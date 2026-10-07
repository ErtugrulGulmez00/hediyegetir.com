// Temel kayıtları oluşturur. Tekrar çalıştırılabilir (upsert).
// Örnek ürünler için: npm run db:seed -- --demo
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DEMO_CATEGORIES = [
  { name: "Çanta", slug: "canta", sortOrder: 1 },
  { name: "Giyim", slug: "giyim", sortOrder: 2 },
  { name: "Ev & Dekor", slug: "ev-dekor", sortOrder: 3 },
];

// Görseller yer tutucudur; gerçek ürünler ikas senkronuyla gelir.
const DEMO_PRODUCTS = [
  {
    slug: "demo-orgu-omuz-cantasi",
    name: "Örgü Omuz Çantası",
    description: "Pamuk iplikten elde örülmüş, astarlı omuz çantası.",
    priceKurus: 85_000,
    compareAtPriceKurus: 99_000,
    category: "canta",
    recipients: ["anne", "kiz-kardes", "sevgili", "teyze"],
    gender: "KADIN" as const,
    hobbies: ["moda", "el-isi"],
  },
  {
    slug: "demo-el-orgusu-suveter",
    name: "El Örgüsü Yün Süveter",
    description: "Yumuşak yün karışımı, bol kesim süveter.",
    priceKurus: 145_000,
    compareAtPriceKurus: null,
    category: "giyim",
    recipients: ["sevgili", "es", "baba", "arkadas"],
    gender: "UNISEX" as const,
    hobbies: ["moda", "seyahat"],
  },
  {
    slug: "demo-makrome-saksi-askisi",
    name: "Makrome Saksı Askısı",
    description: "Doğal pamuk ipten makrome askı. Saksı dahil değildir.",
    priceKurus: 32_000,
    compareAtPriceKurus: null,
    category: "ev-dekor",
    recipients: ["anne", "arkadas", "is-arkadasi", "ogretmen", "buyukanne"],
    gender: "UNISEX" as const,
    hobbies: ["bahce", "dekorasyon"],
  },
];

async function main() {
  await db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  console.log("✓ Ayarlar");

  if (!process.argv.includes("--demo")) return;

  for (const c of DEMO_CATEGORIES) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  for (const p of DEMO_PRODUCTS) {
    const { category, ...data } = p;
    const cat = await db.category.findUniqueOrThrow({ where: { slug: category } });
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...data,
        categoryId: cat.id,
        hedisReviewed: true,
        images: {
          create: [{ url: `https://placehold.co/1080x1350/F4ECDF/2B2420.png?text=${encodeURIComponent(p.name)}`, alt: p.name }],
        },
      },
    });
  }
  console.log(`✓ ${DEMO_CATEGORIES.length} demo kategori, ${DEMO_PRODUCTS.length} demo ürün`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
