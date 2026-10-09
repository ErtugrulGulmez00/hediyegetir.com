// Deneme ürünlerinin (adresi "deneme-" ile başlayan) yer tutucu görsellerini yapay zekayla üretilmiş ürün
// fotoğraflarıyla değiştirir: OpenAI görsel modeli → Vercel Blob → veritabanı. Ücret OpenAI hesabından düşer.
// Tekrar çalıştırılabilir: yalnızca hâlâ placehold.co olan görseller işlenir.
//
//   npm run deneme-fotograf -- --dene   # kaç görsel üretileceğini gör
//   npm run deneme-fotograf
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import { PrismaClient } from "../src/generated/prisma/client";

const MODEL = "gpt-image-1-mini";
const DRY_RUN = process.argv.includes("--dene");
const CONCURRENCY = 3;

/** Ürünün İngilizce tarifi (görsel modeli İngilizcede daha isabetli) */
const SUBJECTS: Record<string, string> = {
  "deneme-orgu-mini-omuz-cantasi": "a small hand-crocheted cotton shoulder bag in terracotta and cream with a thin adjustable strap and magnetic flap",
  "deneme-deri-gorunumlu-sirt-cantasi": "a modern minimalist faux-leather backpack in cognac brown with a laptop compartment",
  "deneme-papatya-baskili-kanvas-canta": "a natural canvas tote bag with a simple daisy flower print",
  "deneme-makrome-bel-cantasi": "a boho macrame waist bag (belt bag) in natural cotton cord with tassels",
  "deneme-hasir-sepet-canta": "a large woven straw basket bag with brown leather handles and a fabric lining",
  "deneme-yun-bere-atki-takimi": "a hand-knitted wool beanie with a pom-pom and a matching long scarf in mustard and cream",
  "deneme-pamuklu-oversize-tisort": "a plain heavyweight cotton oversized t-shirt in off-white",
  "deneme-orgu-hirka-krem": "a hand-knitted cream chunky cardigan with wooden buttons and two pockets",
  "deneme-erkek-keten-gomlek": "a men's linen short-sleeve shirt in light sand beige",
  "deneme-bebek-patik-bere-seti": "a hand-knitted baby booties and baby beanie set in soft pastel colors in an open gift box",
  "deneme-orgu-ev-botu": "a pair of hand-knitted cozy house boots (slipper socks) with non-slip soles in warm earth tones",
  "deneme-hasir-espadril": "a pair of women's canvas espadrilles with braided jute soles in cream",
  "deneme-deri-sandalet": "a pair of men's brown genuine leather sandals with buckle straps",
  "deneme-kislik-panduf": "a pair of fluffy plush winter house slippers in light beige",
};

/** Aynı ürünün görselleri farklı açılardan: önden, kullanımda, yakın çekim */
const ANGLES = [
  "Clean front product shot, centered, on a plain warm cream background",
  "Lifestyle shot showing the item in use in a cozy home or outdoor setting; if a person appears, crop so the face is not visible",
  "Close-up detail shot showing the texture and material",
];

function prompt(subject: string, index: number) {
  return [
    `Professional e-commerce product photograph of ${subject}.`,
    ANGLES[index % ANGLES.length] + ".",
    "Soft natural daylight, warm earthy color palette (cream, kraft, terracotta, mustard, olive), cozy gift shop aesthetic, photorealistic, sharp focus.",
    "No text, no letters, no logos, no watermark, no price tags.",
  ].join(" ");
}

async function generate(text: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        prompt: text,
        size: "1024x1536",
        quality: "medium",
        output_format: "webp",
        output_compression: 82,
        n: 1,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { b64_json?: string }[]; error?: { message?: string } };
    const b64 = json.data?.[0]?.b64_json;
    if (res.ok && b64) return Buffer.from(b64, "base64");
    if (attempt >= 2) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");
  if (!DRY_RUN && !process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY tanımlı değil (.env)");
  if (!DRY_RUN && !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN tanımlı değil (.env)");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    const images = await db.productImage.findMany({
      where: { url: { startsWith: "https://placehold.co/" }, product: { slug: { startsWith: "deneme-" } } },
      orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
      include: { product: { select: { slug: true, name: true } } },
    });
    const jobs = images.filter((img) => SUBJECTS[img.product.slug]);
    console.log(`${DRY_RUN ? "DENEME MODU: hiçbir şey üretilmeyecek\n" : ""}${jobs.length} görsel üretilecek (${MODEL}).`);
    if (DRY_RUN) {
      for (const img of jobs) console.log(`  ${img.product.name} #${img.sortOrder + 1}`);
      return;
    }

    let done = 0;
    const failed: string[] = [];
    const queue = [...jobs];
    const worker = async () => {
      for (let img = queue.shift(); img; img = queue.shift()) {
        const label = `${img.product.name} #${img.sortOrder + 1}`;
        try {
          const body = await generate(prompt(SUBJECTS[img.product.slug], img.sortOrder));
          const blob = await put(`urunler/${img.product.slug}/foto-${img.sortOrder + 1}.webp`, body, {
            access: "public",
            contentType: "image/webp",
            addRandomSuffix: true,
          });
          await db.productImage.update({
            where: { id: img.id },
            data: { url: blob.url, isBlob: true, alt: img.product.name },
          });
          done++;
          console.log(`  ✓ ${label} (${Math.round(body.length / 1024)} KB)`);
        } catch (e) {
          failed.push(label);
          console.error(`  ✗ ${label}: ${e instanceof Error ? e.message : e}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
    console.log(`\n${done} görsel üretildi${failed.length ? `, ${failed.length} hata (tekrar çalıştırabilirsin)` : ""}.`);
    if (failed.length) process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
