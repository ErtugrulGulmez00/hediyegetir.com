import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { matchesSearch, type Filters, type PriceRange, type SortKey } from "./shop-filters";

// Katalog okumaları önbellekli. Admin'deki değişiklikler updateTag(CATALOG_TAG) ile hemen tazeler;
// veritabanına doğrudan yapılan değişiklikler (ör. urun-aktar betiği) en geç bir saatte görünür.
export const CATALOG_TAG = "katalog";
export const SETTINGS_TAG = "ayarlar";

const SORT_ORDER: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  onerilen: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  yeni: [{ createdAt: "desc" }],
  "fiyat-artan": [{ priceKurus: "asc" }],
  "fiyat-azalan": [{ priceKurus: "desc" }],
};

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  priceKurus: true,
  compareAtPriceKurus: true,
  stock: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

/** TL aralığı → kuruş filtresi (iki uç da dahil) */
export function priceWhere(r: PriceRange | undefined): Prisma.IntFilter | undefined {
  if (!r || (r.min == null && r.max == null)) return undefined;
  return {
    ...(r.min != null ? { gte: r.min * 100 } : {}),
    ...(r.max != null ? { lte: r.max * 100 } : {}),
  };
}

/** Fiyat filtresinin kaydırıcısı ve dağılım grafiği için: kategorideki yayındaki ürünlerin fiyatları (TL, artan) */
export async function getPriceStats(category?: string): Promise<number[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const rows = await db.product.findMany({
    where: { isActive: true, ...(category ? { category: { slug: category } } : {}) },
    select: { priceKurus: true },
    orderBy: { priceKurus: "asc" },
  });
  return rows.map((r) => r.priceKurus / 100);
}

export async function getCategories() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.category.findMany({
    where: { products: { some: { isActive: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, _count: { select: { products: { where: { isActive: true } } } } },
  });
}

export async function getShopProducts(filters: Filters): Promise<ProductCardData[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const rows = await db.product.findMany({
    where: {
      isActive: true,
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.price ? { priceKurus: priceWhere(filters.price) } : {}),
    },
    orderBy: SORT_ORDER[filters.sort],
    select: { ...cardSelect, description: true, tags: true },
  });
  // Arama JS'te: veritabanı yerel ayarından bağımsız Türkçe harf/aksan katlama ("canta" → "Çanta")
  const { q } = filters;
  const matched = q ? rows.filter((p) => matchesSearch([p.name, p.description, p.category?.name ?? "", ...p.tags], q)) : rows;
  return matched.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    priceKurus: p.priceKurus,
    compareAtPriceKurus: p.compareAtPriceKurus,
    stock: p.stock,
    category: p.category,
    images: p.images,
  }));
}

/** Ana sayfanın başındaki fotoğraf kolajı: öne çıkanlar önce, fotoğrafı olan 3 ürün */
export async function getHeroProducts() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.product.findMany({
    where: { isActive: true, images: { some: {} } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: { slug: true, name: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } } },
  });
}

/** Kategori sayfası için; yayında ürünü olmayan kategori yok sayılır */
export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.category.findFirst({
    where: { slug, products: { some: { isActive: true } } },
    select: { id: true, name: true, slug: true },
  });
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true } },
    },
  });
}

export async function getActiveProductSlugs() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } });
}

export async function getRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const sameCategory = categoryId
    ? await db.product.findMany({
        where: { isActive: true, categoryId, id: { not: productId } },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: cardSelect,
      })
    : [];
  if (sameCategory.length >= limit) return sameCategory;
  const others = await db.product.findMany({
    where: { isActive: true, id: { notIn: [productId, ...sameCategory.map((p) => p.id)] } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit - sameCategory.length,
    select: cardSelect,
  });
  return [...sameCategory, ...others];
}

export type SiteSettings = { whatsappNumber: string; whatsappGreeting: string; instagramUrl: string };

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("days");
  const s = await db.settings.findUnique({ where: { id: 1 } });
  return {
    whatsappNumber: s?.whatsappNumber || process.env.WHATSAPP_NUMBER_FALLBACK || "",
    whatsappGreeting: s?.whatsappGreeting || "Merhaba! hediyegetir üzerinden şu ürünlerle ilgileniyorum:",
    instagramUrl: s?.instagramUrl || "",
  };
}
