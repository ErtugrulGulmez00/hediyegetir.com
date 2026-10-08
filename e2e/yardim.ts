import type { Page } from "@playwright/test";

/** Ana sayfada Hediş penceresi kendiliğinden açılmasın (Hediş'i test etmeyen testler için). */
export async function hedisGorulmus(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("hg_hedis_goruldu", "1");
    } catch {
      // yoksay
    }
  });
}

/** Tarayıcı hatası (ör. hydration, persist) testi düşürsün */
export function hatadaDus(page: Page) {
  page.on("pageerror", (err) => {
    throw err;
  });
}

/** Gerçek bir ürünün kart bilgileri (Hediş cevabını taklit ederken geçerli id/slug gerekir). */
export async function ornekUrun(slug: string) {
  const { config } = await import("dotenv");
  config({ quiet: true });
  const { Client } = await import("pg");
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const { rows } = await db.query(
      `select p.id, p.slug, p.name, p."priceKurus", p."compareAtPriceKurus", p.stock,
              (select json_agg(json_build_object('url', i.url, 'alt', i.alt) order by i."sortOrder") from "ProductImage" i where i."productId" = p.id) as images
         from "Product" p where p.slug = $1`,
      [slug],
    );
    const p = rows[0];
    return {
      id: p.id as string,
      slug: p.slug as string,
      name: p.name as string,
      priceKurus: p.priceKurus as number,
      compareAtPriceKurus: p.compareAtPriceKurus as number | null,
      stock: p.stock as number | null,
      category: null,
      images: (p.images ?? []) as { url: string; alt: string }[],
      reasons: [] as string[],
    };
  } finally {
    await db.end();
  }
}
