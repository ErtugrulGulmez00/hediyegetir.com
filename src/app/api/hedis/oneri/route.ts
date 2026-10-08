import { z } from "zod";
import type { HedisProduct } from "@/app/api/hedis/sohbet/route";
import { db } from "@/lib/db";
import { BUDGETS, HOBBIES, MAX_HOBBIES, RECIPIENTS, type BudgetKey } from "@/lib/hedis/config";
import { recommend } from "@/lib/hedis/recommend";

// Hediş'in rehber modu: yapay zeka yokken (anahtar yok, bakiye bitti, sınır doldu) seçeneklerle
// toplanan cevaplara kural tabanlı motorla öneri yapar. Yapay zeka çağırmaz, bu yüzden sınır yok.

const keys = (list: readonly { key: string }[]) => list.map((x) => x.key) as [string, ...string[]];

const Body = z.object({
  recipient: z.enum(keys(RECIPIENTS)),
  gender: z.enum(["KADIN", "ERKEK"]).nullable(),
  /** null = fark etmez */
  budget: z.enum(keys(BUDGETS) as [BudgetKey, ...BudgetKey[]]).nullable(),
  hobbies: z.array(z.enum(keys(HOBBIES))).max(MAX_HOBBIES),
});

export type HedisRehberRequest = z.infer<typeof Body>;
export type HedisRehberResponse = { products: HedisProduct[]; strongCount: number };

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Geçersiz cevaplar" }, { status: 400 });
  const { recipient, gender, budget, hobbies } = parsed.data;

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
      occasions: true,
      isFeatured: true,
      categoryId: true,
      createdAt: true,
      category: { select: { name: true, slug: true } },
      images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
    },
  });

  const result = recommend(candidates, { recipient, gender, budget: budget ?? undefined, hobbies });
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
    };
  });

  return Response.json({ products, strongCount: result.strongCount } satisfies HedisRehberResponse, {
    headers: { "cache-control": "no-store" },
  });
}
