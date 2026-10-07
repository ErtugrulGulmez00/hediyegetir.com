import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { budgetByKey, type BudgetKey } from "./hedis/config";

// Katalog okumaları önbellekli. Admin'deki değişiklikler updateTag(CATALOG_TAG) ile hemen tazeler;
// veritabanına doğrudan yapılan değişiklikler (ör. urun-aktar betiği) en geç bir saatte görünür.
export const CATALOG_TAG = "katalog";
export const SETTINGS_TAG = "ayarlar";

export const SORTS = {
  onerilen: { label: "Önerilen", orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }] },
  yeni: { label: "En yeni", orderBy: [{ createdAt: "desc" }] },
  "fiyat-artan": { label: "Fiyat: artan", orderBy: [{ priceKurus: "asc" }] },
  "fiyat-azalan": { label: "Fiyat: azalan", orderBy: [{ priceKurus: "desc" }] },
} satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput[] }>;
export type SortKey = keyof typeof SORTS;
export const isSortKey = (s: unknown): s is SortKey => typeof s === "string" && s in SORTS;

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

export function priceWhere(budget: BudgetKey | undefined): Prisma.IntFilter | undefined {
  const b = budget ? budgetByKey(budget) : undefined;
  if (!b) return undefined;
  return {
    ...(b.minExclusive != null ? { gt: b.minExclusive } : {}),
    ...(b.maxInclusive != null ? { lte: b.maxInclusive } : {}),
  };
}

export async function getCategories() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.category.findMany({
    where: { products: { some: { isActive: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
}

export async function getShopProducts(filters: { category?: string; budget?: BudgetKey; sort: SortKey }) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.product.findMany({
    where: {
      isActive: true,
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.budget ? { priceKurus: priceWhere(filters.budget) } : {}),
    },
    orderBy: SORTS[filters.sort].orderBy,
    select: cardSelect,
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
    whatsappGreeting: s?.whatsappGreeting || "Merhaba! hediyegetir.com üzerinden şu ürünlerle ilgileniyorum:",
    instagramUrl: s?.instagramUrl || "",
  };
}
