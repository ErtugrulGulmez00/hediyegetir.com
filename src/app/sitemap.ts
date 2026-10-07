import type { MetadataRoute } from "next";
import { getActiveProductSlugs } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getActiveProductSlugs();
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...products.map((p) => ({
      url: absoluteUrl(`/urun/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/kvkk"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
