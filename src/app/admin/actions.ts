"use server";

import { del } from "@vercel/blob";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { parseProductForm, type FieldErrors } from "@/lib/admin/product-input";
import { login, logout, requireAdmin } from "@/lib/auth";
import { CATALOG_TAG, SETTINGS_TAG } from "@/lib/catalog";
import { db } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

// ---------- Oturum ----------

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Kullanıcı adı ve şifre gerekli." };
  const result = await login(username, password);
  if (!result.ok) return { error: result.error };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/giris");
}

// ---------- Ürünler ----------

export type ProductFormState = { errors?: FieldErrors; message?: string };

async function deleteBlobs(urls: string[]) {
  if (urls.length === 0 || !process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(urls).catch((e) => console.error("Blob silinemedi", e));
}

export async function saveProductAction(
  productId: string | null,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { message: "Form okunamadı, sayfayı yenileyip tekrar dene." };
  }
  const parsed = parseProductForm(raw);
  if (!parsed.ok) return { errors: parsed.errors, message: "Bazı alanları düzeltmen gerekiyor." };
  const d = parsed.data;

  const existing = productId
    ? await db.product.findUnique({ where: { id: productId }, include: { images: { orderBy: { sortOrder: "asc" } } } })
    : null;
  if (productId && !existing) return { message: "Ürün bulunamadı (silinmiş olabilir)." };

  const slugTaken = await db.product.findFirst({
    where: { slug: d.slug, ...(productId ? { id: { not: productId } } : {}) },
    select: { id: true },
  });
  if (slugTaken) return { errors: { slug: "Bu adres başka bir üründe kullanılıyor" } };

  const fields = {
    name: d.name,
    slug: d.slug,
    description: d.description,
    priceKurus: d.priceKurus,
    compareAtPriceKurus: d.compareAtPriceKurus,
    stock: d.stock,
    categoryId: d.categoryId,
    isActive: d.isActive,
    isFeatured: d.isFeatured,
    recipients: d.recipients,
    gender: d.gender,
    hobbies: d.hobbies,
    hedisReviewed: d.hedisReviewed,
  };

  let id = productId;
  const blobsToDelete: string[] = [];

  if (!existing) {
    const created = await db.product.create({
      data: {
        ...fields,
        images: { create: d.images.map((img, i) => ({ url: img.url, alt: img.alt, isBlob: img.isBlob, sortOrder: i })) },
      },
    });
    id = created.id;
  } else {
    const keepIds = new Set(d.images.filter((i) => i.id).map((i) => i.id!));
    const removed = existing.images.filter((i) => !keepIds.has(i.id));
    blobsToDelete.push(...removed.filter((i) => i.isBlob).map((i) => i.url));

    await db.$transaction([
      db.product.update({ where: { id: existing.id }, data: fields }),
      db.productImage.deleteMany({ where: { id: { in: removed.map((i) => i.id) } } }),
      ...d.images.map((img, i) =>
        img.id && existing.images.some((e) => e.id === img.id)
          ? db.productImage.update({ where: { id: img.id }, data: { alt: img.alt, sortOrder: i } })
          : db.productImage.create({
              data: { productId: existing.id, url: img.url, alt: img.alt, isBlob: img.isBlob, sortOrder: i },
            }),
      ),
    ]);
  }

  await deleteBlobs(blobsToDelete);
  updateTag(CATALOG_TAG);
  redirect(`/admin/urunler/${id}?kaydedildi=1`);
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  const product = await db.product.findUnique({ where: { id: productId }, include: { images: true } });
  if (!product) redirect("/admin/urunler");
  await db.product.delete({ where: { id: productId } });
  await deleteBlobs(product.images.filter((i) => i.isBlob).map((i) => i.url));
  updateTag(CATALOG_TAG);
  redirect("/admin/urunler?silindi=1");
}

export async function toggleProductActiveAction(productId: string, active: boolean) {
  await requireAdmin();
  await db.product.updateMany({ where: { id: productId }, data: { isActive: active } });
  updateTag(CATALOG_TAG);
}

// ---------- Kategoriler ----------

export type CategoryState = { error?: string; ok?: string };

const CategoryInput = z.object({
  name: z.string().trim().min(2, "Kategori adı en az 2 karakter").max(60),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function createCategoryAction(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const r = CategoryInput.safeParse({ name: formData.get("name"), sortOrder: formData.get("sortOrder") || 0 });
  if (!r.success) return { error: r.error.issues[0].message };
  const taken = new Set((await db.category.findMany({ select: { slug: true } })).map((c) => c.slug));
  if (taken.has(slugify(r.data.name))) return { error: "Bu isimde bir kategori zaten var" };
  await db.category.create({ data: { name: r.data.name, slug: uniqueSlug(r.data.name, taken), sortOrder: r.data.sortOrder } });
  updateTag(CATALOG_TAG);
  return { ok: `"${r.data.name}" eklendi` };
}

export async function updateCategoryAction(categoryId: string, _prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const r = CategoryInput.safeParse({ name: formData.get("name"), sortOrder: formData.get("sortOrder") || 0 });
  if (!r.success) return { error: r.error.issues[0].message };
  // Adres (slug) bilerek değişmez: mağazadaki kategori linkleri kırılmasın
  await db.category.update({ where: { id: categoryId }, data: r.data });
  updateTag(CATALOG_TAG);
  return { ok: "Kaydedildi" };
}

export async function deleteCategoryAction(categoryId: string) {
  await requireAdmin();
  try {
    await db.category.delete({ where: { id: categoryId } });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")) throw e;
  }
  updateTag(CATALOG_TAG);
}

// ---------- Ayarlar ----------

export type SettingsState = { error?: string; ok?: boolean };

const SettingsInput = z.object({
  whatsappNumber: z.string().trim(),
  whatsappGreeting: z.string().trim().min(5, "Karşılama cümlesi çok kısa").max(300),
  instagramUrl: z
    .string()
    .trim()
    .refine((u) => u === "" || /^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/.test(u), "Örnek: https://instagram.com/hesabin"),
});

export async function saveSettingsAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin();
  const r = SettingsInput.safeParse(Object.fromEntries(formData));
  if (!r.success) return { error: r.error.issues[0].message };
  const number = r.data.whatsappNumber ? normalizeWhatsappNumber(r.data.whatsappNumber) : "";
  if (number === null) return { error: "WhatsApp numarası geçersiz. Örnek: 0532 123 45 67" };
  const data = { ...r.data, whatsappNumber: number };
  await db.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  updateTag(SETTINGS_TAG);
  return { ok: true };
}
