"use server";

import { del } from "@vercel/blob";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { parseProductForm, type FieldErrors } from "@/lib/admin/product-input";
import { analyzeProduct } from "@/lib/ai/analyze";
import { AiError, aiConfigured, DEFAULT_AI_MODEL } from "@/lib/ai/client";
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
    occasions: d.occasions,
    tags: d.tags,
    features: d.features,
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

/** Ürün formundan: AI'ın önerdiği kategoriyi oluşturur (ya da aynı adlı varsa onu döner). */
export async function createCategoryQuickAction(name: string): Promise<{ id: string; name: string } | { error: string }> {
  await requireAdmin();
  const r = CategoryInput.shape.name.safeParse(name);
  if (!r.success) return { error: r.error.issues[0].message };
  const all = await db.category.findMany({ select: { id: true, name: true, slug: true } });
  const existing = all.find((c) => c.slug === slugify(r.data));
  if (existing) return { id: existing.id, name: existing.name };
  const created = await db.category.create({
    data: { name: r.data, slug: uniqueSlug(r.data, new Set(all.map((c) => c.slug))), sortOrder: all.length },
  });
  updateTag(CATALOG_TAG);
  return { id: created.id, name: created.name };
}

// ---------- AI ile toplu zenginleştirme ----------

export type EnrichState = { done?: number; remaining?: number; errors?: string[]; message?: string; failedIds?: string[] };

const ENRICH_BATCH = 8;

/**
 * Özel gün / etiket / özellik alanları boş ürünleri AI ile doldurur (yalnızca boş alanlar).
 * Bir seferde ENRICH_BATCH ürün işler; kalan varsa admin tekrar basar. Öneri çıkmayan ürünler
 * (skipIds) sonraki turlarda atlanır ki diğerlerinin önünü tıkamasın.
 */
export async function enrichProductsAction(skipIds: string[] = []): Promise<EnrichState> {
  await requireAdmin();
  if (!aiConfigured()) return { message: "Yapay zeka anahtarı tanımlı değil." };
  const missing = { OR: [{ occasions: { isEmpty: true } }, { tags: { isEmpty: true } }, { features: { isEmpty: true } }] };
  const products = await db.product.findMany({
    where: { ...missing, id: { notIn: skipIds } },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    take: ENRICH_BATCH,
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2, select: { url: true } } },
  });
  let done = 0;
  const errors: string[] = [];
  const failedIds = [...skipIds];
  for (const p of products) {
    try {
      const { suggestion: s } = await analyzeProduct({
        name: p.name,
        description: p.description,
        priceKurus: p.priceKurus,
        imageUrls: p.images.map((i) => i.url),
      });
      const data: Prisma.ProductUpdateInput = {};
      if (p.occasions.length === 0 && s.occasions.length) data.occasions = s.occasions;
      if (p.tags.length === 0 && s.tags.length) data.tags = s.tags;
      if (p.features.length === 0 && s.features.length) data.features = s.features;
      if (!p.description.trim() && s.description) data.description = s.description;
      if (!p.categoryId && s.categoryId) data.category = { connect: { id: s.categoryId } };
      if (p.recipients.length === 0 && p.hobbies.length === 0 && (s.recipients.length || s.hobbies.length)) {
        data.recipients = s.recipients;
        data.hobbies = s.hobbies;
        if (s.gender) data.gender = s.gender;
      }
      if (data.occasions || data.tags || data.recipients) data.hedisReviewed = false;
      if (Object.keys(data).length === 0) {
        errors.push(`${p.name}: AI yeni bir öneri çıkaramadı, elle doldurman gerekebilir`);
        failedIds.push(p.id);
        continue;
      }
      await db.product.update({ where: { id: p.id }, data });
      done++;
    } catch (e) {
      errors.push(`${p.name}: ${e instanceof Error ? e.message : "hata"}`);
      failedIds.push(p.id);
      if (e instanceof AiError && /bakiye|anahtar/i.test(e.message)) break;
    }
  }
  if (done > 0) updateTag(CATALOG_TAG);
  const remaining = await db.product.count({ where: { ...missing, id: { notIn: failedIds } } });
  return { done, remaining, errors, failedIds };
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
  aiModel: z
    .string()
    .trim()
    .transform((m) => m || DEFAULT_AI_MODEL)
    // OpenAI: "gpt-6-luna"; OpenRouter: "saglayici/model-adi"
    .refine((m) => /^~?[\w.-]+(\/[\w.:-]+)?$/.test(m), "Geçersiz model adı (ör. gpt-6-luna ya da saglayici/model-adi)"),
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
