import { z } from "zod";
import { BUDGETS, HOBBIES, MAX_HOBBIES, RECIPIENTS } from "@/lib/hedis/config";
import { recommend } from "@/lib/hedis/recommend";
import { db } from "@/lib/db";

const Body = z.object({
  recipient: z.enum(RECIPIENTS.map((r) => r.key) as [string, ...string[]]),
  gender: z.enum(["KADIN", "ERKEK"]).nullable(),
  budget: z.enum(BUDGETS.map((b) => b.key) as ["0-500", "500-1000", "1000+"]),
  hobbies: z.array(z.enum(HOBBIES.map((h) => h.key) as [string, ...string[]])).max(MAX_HOBBIES),
});

export type HedisProduct = {
  id: string;
  slug: string;
  name: string;
  priceKurus: number;
  compareAtPriceKurus: number | null;
  stock: number | null;
  category: { name: string; slug: string } | null;
  images: { url: string; alt: string }[];
  reasons: string[];
  fallback: boolean;
};

export type HedisResponse = { products: HedisProduct[]; strongCount: number };

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Geçersiz cevaplar" }, { status: 400 });

  // Adaylar: yayında ve stokta (stok takibi yoksa da uygun)
  const candidates = await db.product.findMany({
    where: { isActive: true, OR: [{ stock: null }, { stock: { gt: 0 } }] },
    select: {
      id: true,
      slug: true,
      name: true,
      priceKurus: true,
      compareAtPriceKurus: true,
      stock: true,
      recipients: true,
      gender: true,
      hobbies: true,
      isFeatured: true,
      categoryId: true,
      createdAt: true,
      category: { select: { name: true, slug: true } },
      images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
    },
  });

  const result = recommend(candidates, parsed.data);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const products: HedisProduct[] = result.items.map((item) => {
    const p = byId.get(item.id)!;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      priceKurus: p.priceKurus,
      compareAtPriceKurus: p.compareAtPriceKurus,
      stock: p.stock,
      category: p.category,
      images: p.images,
      reasons: item.reasons,
      fallback: item.fallback,
    };
  });

  return Response.json({ products, strongCount: result.strongCount } satisfies HedisResponse, {
    headers: { "cache-control": "no-store" },
  });
}
