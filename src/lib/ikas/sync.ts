import { put, del } from "@vercel/blob";
import type { PrismaClient } from "@/generated/prisma/client";
import { slugify, uniqueSlug } from "../slug";
import { suggestTags } from "./auto-tag";
import { parseProductPage, type ParsedImage, type ParsedProduct } from "./parse-product";
import { fetchProductUrls, IKAS_USER_AGENT } from "./sitemap";

/** Admin'in elle değiştirebileceği ve kilitlenince senkronun dokunmadığı alanlar */
export const LOCKABLE_FIELDS = ["name", "description", "price", "stock", "category", "images", "isActive"] as const;
export type LockableField = (typeof LOCKABLE_FIELDS)[number];

export type SyncReport = {
  logId: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  added: number;
  updated: number;
  deactivated: number;
  failed: number;
  messages: string[];
};

type StoredImage = { url: string; isBlob: boolean };

export type SyncOptions = {
  db: PrismaClient;
  baseUrl: string;
  fetchImpl?: typeof fetch;
  concurrency?: number;
  delayMs?: number;
  onProgress?: (line: string) => void;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function syncFromIkas(opts: SyncOptions): Promise<SyncReport> {
  const { db, baseUrl, fetchImpl = fetch, concurrency = 2, delayMs = 300 } = opts;
  const log = opts.onProgress ?? (() => {});
  const messages: string[] = [];
  const note = (m: string) => {
    messages.push(m);
    log(m);
  };
  const counts = { added: 0, updated: 0, deactivated: 0, failed: 0 };
  const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  if (!useBlob) note("BLOB_READ_WRITE_TOKEN yok: görseller ikas CDN adresinden kullanılacak");

  const syncLog = await db.ikasSyncLog.create({ data: {} });

  const finish = async (status: SyncReport["status"]): Promise<SyncReport> => {
    await db.ikasSyncLog.update({
      where: { id: syncLog.id },
      data: { ...counts, status, messages, finishedAt: new Date() },
    });
    return { logId: syncLog.id, status, ...counts, messages };
  };

  try {
    const entries = await fetchProductUrls(baseUrl, fetchImpl);
    note(`Sitemap: ${entries.length} ürün bulundu`);

    const taken = new Set((await db.product.findMany({ select: { slug: true } })).map((p) => p.slug));
    const seenUrls = new Set<string>();
    const failedUrls = new Set<string>();

    const storeImage = async (img: ParsedImage, productSlug: string): Promise<StoredImage> => {
      if (!useBlob) return { url: img.url, isBlob: false };
      const res = await fetchImpl(img.url, { headers: { "user-agent": IKAS_USER_AGENT } });
      if (!res.ok) throw new Error(`Görsel indirilemedi (HTTP ${res.status}): ${img.url}`);
      const body = Buffer.from(await res.arrayBuffer());
      const blob = await put(`urunler/${productSlug}/${img.ikasImageId}.webp`, body, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: true,
      });
      return { url: blob.url, isBlob: true };
    };

    const processOne = async (url: string) => {
      const res = await fetchImpl(url, { headers: { "user-agent": IKAS_USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = parseProductPage(await res.text(), url);
      for (const w of parsed.warnings) note(`${parsed.name}: ${w}`);
      const result = await upsertProduct(db, parsed, taken, storeImage);
      counts[result]++;
      log(`${result === "added" ? "+" : "~"} ${parsed.name}`);
    };

    // Siteyi yormamak için sınırlı eşzamanlılık + istekler arası bekleme
    let cursor = 0;
    const worker = async () => {
      while (cursor < entries.length) {
        const { url } = entries[cursor++];
        seenUrls.add(url);
        try {
          await processOne(url);
        } catch (e) {
          counts.failed++;
          failedUrls.add(url);
          note(`HATA ${url}: ${e instanceof Error ? e.message : String(e)}`);
        }
        await sleep(delayMs);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, worker));

    // Sitemap'ten kalkan ikas ürünlerini pasife al (silme). Sitemap boş geldiyse
    // bir sorun olduğunu varsay ve hiçbir şeyi kapatma.
    if (entries.length > 0) {
      const gone = await db.product.findMany({
        where: { source: "IKAS", isActive: true, ikasUrl: { notIn: [...seenUrls] } },
        select: { id: true, name: true, lockedFields: true },
      });
      for (const p of gone) {
        if (p.lockedFields.includes("isActive")) continue;
        await db.product.update({ where: { id: p.id }, data: { isActive: false } });
        counts.deactivated++;
        note(`Pasife alındı (ikas'ta artık yok): ${p.name}`);
      }
    }

    return finish(counts.failed > 0 ? "PARTIAL" : "SUCCESS");
  } catch (e) {
    note(`Senkron durdu: ${e instanceof Error ? e.message : String(e)}`);
    return finish("FAILED");
  }
}

async function upsertProduct(
  db: PrismaClient,
  p: ParsedProduct,
  takenSlugs: Set<string>,
  storeImage: (img: ParsedImage, slug: string) => Promise<StoredImage>,
): Promise<"added" | "updated"> {
  const categoryId = await ensureCategory(db, p.categories[0]);
  const existing = await db.product.findFirst({
    where: { OR: [...(p.ikasId ? [{ ikasId: p.ikasId }] : []), { ikasUrl: p.ikasUrl }] },
    include: { images: true },
  });

  const hasPrice = p.priceKurus != null;

  if (!existing) {
    const slug = uniqueSlug(p.ikasSlug || p.name, takenSlugs);
    takenSlugs.add(slug);
    const tags = suggestTags(p);
    const stored = [];
    for (const img of p.images) stored.push({ img, ...(await storeImage(img, slug)) });
    await db.product.create({
      data: {
        slug,
        name: p.name,
        description: p.description,
        priceKurus: p.priceKurus ?? 0,
        compareAtPriceKurus: p.compareAtPriceKurus,
        stock: p.stock,
        isActive: hasPrice,
        categoryId,
        source: "IKAS",
        ikasId: p.ikasId,
        ikasUrl: p.ikasUrl,
        recipients: tags.recipients,
        gender: tags.gender,
        hobbies: tags.hobbies,
        hedisReviewed: false,
        images: {
          create: stored.map((s, i) => ({
            url: s.url,
            isBlob: s.isBlob,
            alt: p.name,
            sortOrder: i,
            ikasImageId: s.img.ikasImageId,
          })),
        },
      },
    });
    return "added";
  }

  const locked = new Set(existing.lockedFields);
  const data: Parameters<typeof db.product.update>[0]["data"] = { ikasId: p.ikasId ?? existing.ikasId, ikasUrl: p.ikasUrl };
  if (!locked.has("name")) data.name = p.name;
  if (!locked.has("description")) data.description = p.description;
  if (!locked.has("price") && hasPrice) {
    data.priceKurus = p.priceKurus!;
    data.compareAtPriceKurus = p.compareAtPriceKurus;
  }
  if (!locked.has("stock")) data.stock = p.stock;
  if (!locked.has("category") && categoryId) data.categoryId = categoryId;
  if (!locked.has("isActive")) data.isActive = hasPrice;

  await db.product.update({ where: { id: existing.id }, data });
  if (!locked.has("images")) await syncImages(db, existing, p, storeImage);
  return "updated";
}

async function syncImages(
  db: PrismaClient,
  existing: { id: string; slug: string; name: string; images: { id: string; url: string; isBlob: boolean; ikasImageId: string | null; sortOrder: number }[] },
  p: ParsedProduct,
  storeImage: (img: ParsedImage, slug: string) => Promise<StoredImage>,
) {
  const byIkasId = new Map(existing.images.filter((i) => i.ikasImageId).map((i) => [i.ikasImageId!, i]));
  const wanted = new Set(p.images.map((i) => i.ikasImageId));

  for (const [ikasImageId, img] of byIkasId) {
    if (wanted.has(ikasImageId)) continue;
    await db.productImage.delete({ where: { id: img.id } });
    if (img.isBlob) await del(img.url).catch(() => {});
  }

  for (const [i, img] of p.images.entries()) {
    const current = byIkasId.get(img.ikasImageId);
    if (current) {
      if (current.sortOrder !== i) await db.productImage.update({ where: { id: current.id }, data: { sortOrder: i } });
      continue;
    }
    const stored = await storeImage(img, existing.slug);
    await db.productImage.create({
      data: { productId: existing.id, url: stored.url, isBlob: stored.isBlob, alt: existing.name, sortOrder: i, ikasImageId: img.ikasImageId },
    });
  }

  // Admin'in elle eklediği görseller ikas görsellerinin arkasında kalır
  const manual = existing.images.filter((i) => !i.ikasImageId).sort((a, b) => a.sortOrder - b.sortOrder);
  for (const [j, img] of manual.entries()) {
    const order = p.images.length + j;
    if (img.sortOrder !== order) await db.productImage.update({ where: { id: img.id }, data: { sortOrder: order } });
  }
}

async function ensureCategory(db: PrismaClient, name: string | undefined): Promise<string | null> {
  if (!name) return null;
  const slug = slugify(name);
  if (!slug) return null;
  const cat = await db.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
  return cat.id;
}
