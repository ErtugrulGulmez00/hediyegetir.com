// Veritabanındaki yerel ürün fotoğraflarını (public/uploads) Vercel Blob'a yükler ve adreslerini günceller.
// Yayına geçmeden önce bir kez çalıştırılır: public/uploads git'e girmediği için yayında bu dosyalar yoktur.
// Tekrar çalıştırılabilir: yalnızca adresi hâlâ /uploads/ ile başlayan fotoğraflar işlenir.
//
// Kullanım: .env'deki BLOB_READ_WRITE_TOKEN'ı doldur (Vercel → Storage → Blob), sonra
//   npm run foto-blob -- --dene   # önce neyin yükleneceğini gör
//   npm run foto-blob
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import { PrismaClient } from "../src/generated/prisma/client";

const DRY_RUN = process.argv.includes("--dene");
const CONTENT_TYPES: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");
  if (!DRY_RUN && !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN tanımlı değil (.env)");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    const images = await db.productImage.findMany({
      where: { url: { startsWith: "/uploads/" } },
      orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
      include: { product: { select: { slug: true } } },
    });
    console.log(`${DRY_RUN ? "DENEME MODU: hiçbir şey yazılmayacak\n" : ""}${images.length} yerel fotoğraf bulundu.`);

    let done = 0;
    const failed: string[] = [];
    for (const img of images) {
      const file = path.join(process.cwd(), "public", img.url);
      const ext = path.extname(file).toLowerCase();
      try {
        const body = await readFile(file);
        if (DRY_RUN) {
          console.log(`  ${img.product.slug}: ${img.url} (${Math.round(body.length / 1024)} KB)`);
          continue;
        }
        const blob = await put(`urunler/${img.product.slug}/${path.basename(file)}`, body, {
          access: "public",
          contentType: CONTENT_TYPES[ext] ?? "image/webp",
          addRandomSuffix: true,
        });
        await db.productImage.update({ where: { id: img.id }, data: { url: blob.url, isBlob: true } });
        done++;
        console.log(`  ✓ ${img.product.slug}: ${img.url} → ${blob.url}`);
      } catch (e) {
        failed.push(img.url);
        console.error(`  ✗ ${img.url}: ${e instanceof Error ? e.message : e}`);
      }
    }

    if (!DRY_RUN) console.log(`\n${done} fotoğraf Blob'a taşındı${failed.length ? `, ${failed.length} hata (tekrar çalıştırabilirsin)` : ""}.`);
    if (failed.length) process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
