// Yerel veritabanındaki ürünleri, kategorileri ve ayarları başka bir veritabanına (ör. Neon) bir kez taşır.
// Fotoğrafları Vercel Blob'a yükler. Tekrar çalıştırılabilir: hedefte aynı adresli (slug) ürün varsa atlanır.
//
// Kullanım (PowerShell):
//   $env:KAYNAK_DATABASE_URL="postgresql://hediye:hediye@localhost:5433/hediyegetir"
//   $env:HEDEF_DATABASE_URL="<Neon havuzsuz adres>"
//   $env:BLOB_READ_WRITE_TOKEN="<Vercel Blob anahtarı>"
//   npm run urun-aktar             # önce --dene ile neyin taşınacağını görebilirsin
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import { PrismaClient } from "../src/generated/prisma/client";

const DRY_RUN = process.argv.includes("--dene");
// Yalnızca test için: fotoğrafları Blob'a yüklemeden adresleri olduğu gibi kopyalar
const NO_BLOB = process.argv.includes("--blob-yok");

function client(url: string | undefined, name: string) {
  if (!url) throw new Error(`${name} tanımlı değil`);
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

const CONTENT_TYPES: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

async function readImage(url: string): Promise<{ body: Buffer; ext: string }> {
  if (url.startsWith("/uploads/")) {
    const file = path.join(process.cwd(), "public", url);
    return { body: await readFile(file), ext: path.extname(file).toLowerCase() || ".webp" };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`indirilemedi (HTTP ${res.status}): ${url}`);
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return { body: Buffer.from(await res.arrayBuffer()), ext: CONTENT_TYPES[ext] ? ext : ".webp" };
}

async function main() {
  const src = client(process.env.KAYNAK_DATABASE_URL, "KAYNAK_DATABASE_URL");
  const dst = client(process.env.HEDEF_DATABASE_URL, "HEDEF_DATABASE_URL");
  if (process.env.KAYNAK_DATABASE_URL === process.env.HEDEF_DATABASE_URL) throw new Error("Kaynak ve hedef aynı veritabanı");
  if (!NO_BLOB && !DRY_RUN && !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN tanımlı değil");

  try {
    console.log(DRY_RUN ? "DENEME MODU: hiçbir şey yazılmayacak\n" : "");

    // Ayarlar: hedefte yoksa kopyala
    const settings = await src.settings.findUnique({ where: { id: 1 } });
    if (settings && !(await dst.settings.findUnique({ where: { id: 1 } }))) {
      const data = {
        whatsappNumber: settings.whatsappNumber,
        whatsappGreeting: settings.whatsappGreeting,
        instagramUrl: settings.instagramUrl,
      };
      console.log(`Ayarlar kopyalanıyor (WhatsApp: ${data.whatsappNumber || "boş"})`);
      if (!DRY_RUN) await dst.settings.create({ data });
    }

    // Kategoriler: slug ile eşleştir
    const categoryMap = new Map<string, string>();
    for (const c of await src.category.findMany()) {
      const existing = await dst.category.findUnique({ where: { slug: c.slug } });
      if (existing) {
        categoryMap.set(c.id, existing.id);
        continue;
      }
      console.log(`+ kategori: ${c.name}`);
      if (!DRY_RUN) {
        const created = await dst.category.create({ data: { name: c.name, slug: c.slug, sortOrder: c.sortOrder } });
        categoryMap.set(c.id, created.id);
      }
    }

    const products = await src.product.findMany({
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
    let added = 0;
    let skipped = 0;
    for (const p of products) {
      if (await dst.product.findUnique({ where: { slug: p.slug }, select: { id: true } })) {
        skipped++;
        continue;
      }
      console.log(`+ ürün: ${p.name} (${p.images.length} fotoğraf)`);
      added++;
      if (DRY_RUN) continue;

      const images = [];
      for (const [i, img] of p.images.entries()) {
        if (NO_BLOB || img.isBlob) {
          images.push({ url: img.url, alt: img.alt, sortOrder: i, isBlob: img.isBlob });
          continue;
        }
        const { body, ext } = await readImage(img.url);
        const blob = await put(`urunler/${p.slug}/${i + 1}${ext}`, body, {
          access: "public",
          contentType: CONTENT_TYPES[ext] ?? "image/webp",
          addRandomSuffix: true,
        });
        images.push({ url: blob.url, alt: img.alt, sortOrder: i, isBlob: true });
      }

      await dst.product.create({
        data: {
          slug: p.slug,
          name: p.name,
          description: p.description,
          priceKurus: p.priceKurus,
          compareAtPriceKurus: p.compareAtPriceKurus,
          stock: p.stock,
          isActive: p.isActive,
          isFeatured: p.isFeatured,
          recipients: p.recipients,
          gender: p.gender,
          hobbies: p.hobbies,
          hedisReviewed: p.hedisReviewed,
          createdAt: p.createdAt,
          categoryId: p.categoryId ? (categoryMap.get(p.categoryId) ?? null) : null,
          images: { create: images },
        },
      });
    }

    console.log(`\n${DRY_RUN ? "Taşınacak" : "Taşındı"}: ${added} ürün · zaten vardı: ${skipped}`);
    if (!DRY_RUN && added > 0) console.log("Sitede görünmesi için Vercel'de yeniden deploy et ya da admin'den herhangi bir ürünü kaydet.");
  } finally {
    await Promise.all([src.$disconnect(), dst.$disconnect()]);
  }
}

main().catch((e) => {
  console.error("HATA:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
