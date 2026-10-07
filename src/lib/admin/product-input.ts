// Admin ürün formunun doğrulaması ve ikas kilit hesabı. Saf fonksiyonlar (test edilebilir).
import { z } from "zod";
import { HOBBIES, RECIPIENTS } from "../hedis/config";
import type { LockableField } from "../ikas/sync";
import { parsePriceInput } from "../money";
import { slugify } from "../slug";
import { MAX_IMAGES_PER_PRODUCT } from "./images";

const recipientKeys = RECIPIENTS.map((r) => r.key) as [string, ...string[]];
const hobbyKeys = HOBBIES.map((h) => h.key) as [string, ...string[]];

export const ImageInput = z.object({
  id: z.string().optional(),
  url: z.string().refine((u) => u.startsWith("https://") || u.startsWith("/uploads/"), "Geçersiz görsel adresi"),
  alt: z.string().max(200).default(""),
  isBlob: z.boolean().default(false),
});
export type ImageInput = z.infer<typeof ImageInput>;

export const ProductFormSchema = z.object({
  name: z.string().trim().min(2, "Ürün adı en az 2 karakter").max(200),
  slug: z.string().trim().max(80).default(""),
  description: z.string().max(5000).default(""),
  price: z.string(),
  compareAtPrice: z.string().default(""),
  stock: z.string().default(""),
  categoryId: z.string().default(""),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  recipients: z.array(z.enum(recipientKeys)).default([]),
  gender: z.enum(["KADIN", "ERKEK", "UNISEX"]),
  hobbies: z.array(z.enum(hobbyKeys)).default([]),
  hedisReviewed: z.boolean(),
  images: z.array(ImageInput).max(MAX_IMAGES_PER_PRODUCT, `En fazla ${MAX_IMAGES_PER_PRODUCT} fotoğraf`),
  unlock: z.array(z.string()).default([]),
});
export type ProductFormInput = z.input<typeof ProductFormSchema>;

export type ProductData = {
  name: string;
  slug: string;
  description: string;
  priceKurus: number;
  compareAtPriceKurus: number | null;
  stock: number | null;
  categoryId: string | null;
  isActive: boolean;
  isFeatured: boolean;
  recipients: string[];
  gender: "KADIN" | "ERKEK" | "UNISEX";
  hobbies: string[];
  hedisReviewed: boolean;
  images: ImageInput[];
  unlock: LockableField[];
};

export type FieldErrors = Partial<Record<string, string>>;

export function parseProductForm(raw: unknown): { ok: true; data: ProductData } | { ok: false; errors: FieldErrors } {
  const r = ProductFormSchema.safeParse(raw);
  if (!r.success) {
    const errors: FieldErrors = {};
    for (const issue of r.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, errors };
  }
  const v = r.data;
  const errors: FieldErrors = {};

  const priceKurus = parsePriceInput(v.price);
  if (priceKurus == null || priceKurus <= 0) errors.price = "Geçerli bir fiyat gir (ör. 1.250 ya da 1250,50)";

  let compareAtPriceKurus: number | null = null;
  if (v.compareAtPrice.trim()) {
    compareAtPriceKurus = parsePriceInput(v.compareAtPrice);
    if (compareAtPriceKurus == null) errors.compareAtPrice = "Geçerli bir fiyat gir";
    else if (priceKurus != null && compareAtPriceKurus <= priceKurus)
      errors.compareAtPrice = "Eski fiyat, satış fiyatından yüksek olmalı";
  }

  let stock: number | null = null;
  if (v.stock.trim()) {
    const n = Number(v.stock.trim());
    if (!Number.isInteger(n) || n < 0) errors.stock = "Stok 0 ya da pozitif tam sayı olmalı (boş = sipariş üzerine)";
    else stock = n;
  }

  const slug = slugify(v.slug || v.name);
  if (!slug) errors.slug = "Geçerli bir adres oluşturulamadı";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name: v.name,
      slug,
      description: v.description.replace(/\r\n/g, "\n").trim(),
      priceKurus: priceKurus!,
      compareAtPriceKurus,
      stock,
      categoryId: v.categoryId || null,
      isActive: v.isActive,
      isFeatured: v.isFeatured,
      recipients: [...new Set(v.recipients)],
      gender: v.gender,
      hobbies: [...new Set(v.hobbies)],
      hedisReviewed: v.hedisReviewed,
      images: v.images,
      unlock: v.unlock.filter(isLockable),
    },
  };
}

const LOCKABLE = ["name", "description", "price", "stock", "category", "images", "isActive"] as const;
const isLockable = (s: string): s is LockableField => (LOCKABLE as readonly string[]).includes(s);

type Existing = {
  name: string;
  description: string;
  priceKurus: number;
  compareAtPriceKurus: number | null;
  stock: number | null;
  categoryId: string | null;
  isActive: boolean;
  lockedFields: string[];
  images: { url: string }[];
};

/**
 * ikas ürününde admin'in değiştirdiği alanları kilitler (senkron üzerine yazmasın).
 * "unlock" ile açıkça kilidi açılan alanlar, aynı kayıtta değişmiş olsa bile açılır.
 */
export function computeLockedFields(existing: Existing, next: ProductData): string[] {
  const changed = new Set<string>(existing.lockedFields);
  if (next.name !== existing.name) changed.add("name");
  if (next.description !== existing.description) changed.add("description");
  if (next.priceKurus !== existing.priceKurus || next.compareAtPriceKurus !== existing.compareAtPriceKurus)
    changed.add("price");
  if (next.stock !== existing.stock) changed.add("stock");
  if (next.categoryId !== existing.categoryId) changed.add("category");
  if (next.isActive !== existing.isActive) changed.add("isActive");
  const before = existing.images.map((i) => i.url).join("\n");
  const after = next.images.map((i) => i.url).join("\n");
  if (before !== after) changed.add("images");
  for (const f of next.unlock) changed.delete(f);
  return LOCKABLE.filter((f) => changed.has(f));
}

export const LOCK_LABELS: Record<LockableField, string> = {
  name: "Ad",
  description: "Açıklama",
  price: "Fiyat",
  stock: "Stok",
  category: "Kategori",
  images: "Fotoğraflar",
  isActive: "Yayın durumu",
};
