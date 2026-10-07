import { z } from "zod";
import { db } from "@/lib/db";

const Body = z.object({ ids: z.array(z.string().min(1).max(64)).max(50) });

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  priceKurus: number;
  compareAtPriceKurus: number | null;
  stock: number | null;
  image: { url: string; alt: string } | null;
};

/** Sepetteki ürünlerin güncel bilgileri. Pasif / silinmiş ürünler dönmez. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

  const ids = [...new Set(parsed.data.ids)];
  if (ids.length === 0) return Response.json({ products: [] });

  const rows = await db.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      priceKurus: true,
      compareAtPriceKurus: true,
      stock: true,
      images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const products: CartProduct[] = rows.map(({ images, ...p }) => ({ ...p, image: images[0] ?? null }));
  return Response.json({ products }, { headers: { "cache-control": "no-store" } });
}
