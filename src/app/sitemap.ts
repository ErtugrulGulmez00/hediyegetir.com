import type { MetadataRoute } from "next";
import { getActiveProductSlugs, getCategories } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getActiveProductSlugs(), getCategories()]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({
      url: absoluteUrl(`/kategori/${c.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/urun/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/nasil-siparis-verilir"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/hakkimizda"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/kvkk"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
