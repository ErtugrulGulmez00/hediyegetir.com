// Admin ürün formunun doğrulaması. Saf fonksiyon (test edilebilir).
import { z } from "zod";
import { HOBBIES, OCCASIONS, RECIPIENTS } from "../hedis/config";
import { parsePriceInput } from "../money";
import { DEFAULT_STAMPS, MAX_STAMPS, STAMP_MAX_LENGTH, type GalleryLayoutKey } from "../product-display";
import { slugify } from "../slug";
import { MAX_IMAGES_PER_PRODUCT } from "./images";

const recipientKeys = RECIPIENTS.map((r) => r.key) as [string, ...string[]];
const hobbyKeys = HOBBIES.map((h) => h.key) as [string, ...string[]];
const occasionKeys = OCCASIONS.map((o) => o.key) as [string, ...string[]];

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
  occasions: z.array(z.enum(occasionKeys)).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(15, "En fazla 15 etiket").default([]),
  features: z.array(z.string().trim().min(1).max(160)).max(8, "En fazla 8 özellik").default([]),
  images: z.array(ImageInput).max(MAX_IMAGES_PER_PRODUCT, `En fazla ${MAX_IMAGES_PER_PRODUCT} fotoğraf`),
  galleryLayout: z.enum(["TEK", "IKILI", "UCLU"]).default("TEK"),
  // Boş liste = damga yok
  stamps: z
    .array(z.string().trim().min(1).max(STAMP_MAX_LENGTH, `Damga en fazla ${STAMP_MAX_LENGTH} karakter`))
    .max(MAX_STAMPS, `En fazla ${MAX_STAMPS} damga`)
    .default(DEFAULT_STAMPS),
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
  occasions: string[];
  tags: string[];
  features: string[];
  images: ImageInput[];
  galleryLayout: GalleryLayoutKey;
  stamps: string[];
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
      occasions: [...new Set(v.occasions)],
      tags: [...new Set(v.tags.map((t) => t.toLocaleLowerCase("tr-TR")))],
      features: v.features,
      images: v.images,
      galleryLayout: v.galleryLayout,
      stamps: [...new Set(v.stamps.map((t) => t.replace(/\s+/g, " ")))],
    },
  };
}
