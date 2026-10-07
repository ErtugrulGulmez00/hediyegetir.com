import { convert } from "html-to-text";
import { liraToKurus } from "../money";

export type ParsedImage = { ikasImageId: string; url: string; isMain: boolean; order: number };

export type ParsedProduct = {
  /** ikas ürün kimliği; yalnızca JSON-LD yedeği kullanıldıysa null */
  ikasId: string | null;
  ikasUrl: string;
  ikasSlug: string;
  name: string;
  description: string;
  priceKurus: number | null;
  compareAtPriceKurus: number | null;
  /** null = stok takibi yok */
  stock: number | null;
  categories: string[];
  images: ParsedImage[];
  warnings: string[];
};

type IkasPrice = { sellPrice?: number | null; discountPrice?: number | null };
type IkasImage = { imageId?: string; fileName?: string; isMain?: boolean; order?: number; isVideo?: boolean };
type IkasVariant = {
  isActive?: boolean;
  deleted?: boolean;
  stock?: number | null;
  prices?: IkasPrice[];
  images?: IkasImage[];
};
type IkasProductData = {
  id?: string;
  name?: string;
  description?: string | null;
  deleted?: boolean;
  categories?: { name?: string }[];
  metaData?: { slug?: string };
  variants?: IkasVariant[];
};

const IMAGE_SIZE = 1080;

export function htmlToPlainText(html: string): string {
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
  })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractStoreId(html: string): string | null {
  return html.match(/cdn\.myikas\.com\/images\/([0-9a-f-]{36})\//)?.[1] ?? null;
}

export function ikasImageUrl(storeId: string, imageId: string, fileName: string, size = IMAGE_SIZE) {
  return `https://cdn.myikas.com/images/${storeId}/${imageId}/${size}/${fileName}.webp`;
}

/** Bir varyantın geçerli fiyatı: indirimli fiyat varsa o, yoksa satış fiyatı (TL). */
function variantPrice(v: IkasVariant): { price: number; compareAt: number | null } | null {
  if (v.deleted || v.isActive === false) return null;
  const p = v.prices?.[0];
  if (!p) return null;
  const sell = p.sellPrice ?? 0;
  const discount = p.discountPrice ?? null;
  const price = discount && discount > 0 ? discount : sell;
  if (!price || price <= 0) return null;
  const compareAt = discount && discount > 0 && sell > discount ? sell : null;
  return { price, compareAt };
}

export function parseProductPage(html: string, url: string): ParsedProduct {
  const ikasSlug = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  const nextData = readNextData(html);
  if (nextData) return fromNextData(nextData, html, url, ikasSlug);
  const ld = readJsonLdProduct(html);
  if (ld) return fromJsonLd(ld, html, url, ikasSlug);
  throw new Error("Sayfada ürün verisi bulunamadı (__NEXT_DATA__ ve JSON-LD yok)");
}

function readNextData(html: string): IkasProductData | null {
  const raw = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!raw) return null;
  try {
    const data = JSON.parse(raw)?.props?.pageProps?.pageSpecificData;
    return data && typeof data === "object" && data.name && Array.isArray(data.variants) ? data : null;
  } catch {
    return null;
  }
}

function fromNextData(p: IkasProductData, html: string, url: string, ikasSlug: string): ParsedProduct {
  const warnings: string[] = [];
  const storeId = extractStoreId(html);

  const variants = p.variants ?? [];
  const priced = variants
    .map((v) => ({ v, price: variantPrice(v) }))
    .filter((x): x is { v: IkasVariant; price: NonNullable<ReturnType<typeof variantPrice>> } => !!x.price);
  // Varyant seçimi v1'de yok: en düşük geçerli fiyat kullanılır
  priced.sort((a, b) => a.price.price - b.price.price);
  const cheapest = priced[0];
  if (!cheapest) warnings.push("Geçerli fiyatlı varyant yok; ürün pasif alınacak");
  if (priced.length > 1) warnings.push(`${priced.length} varyant var; en düşük fiyat kullanıldı`);

  const validVariants = variants.filter((v) => !v.deleted && v.isActive !== false);
  const stock = validVariants.some((v) => v.stock == null)
    ? null
    : validVariants.reduce((sum, v) => sum + (v.stock ?? 0), 0);

  const images: ParsedImage[] = [];
  const seen = new Set<string>();
  for (const v of validVariants) {
    for (const img of v.images ?? []) {
      if (!img.imageId || !img.fileName || img.isVideo || seen.has(img.imageId)) continue;
      seen.add(img.imageId);
      if (!storeId) continue;
      images.push({
        ikasImageId: img.imageId,
        url: ikasImageUrl(storeId, img.imageId, img.fileName),
        isMain: !!img.isMain,
        order: img.order ?? images.length,
      });
    }
  }
  if (seen.size > 0 && !storeId) warnings.push("Mağaza kimliği bulunamadı; görseller alınamadı");
  sortImages(images);

  return {
    ikasId: p.id ?? null,
    ikasUrl: url,
    ikasSlug: p.metaData?.slug || ikasSlug,
    name: p.name!.trim(),
    description: p.description ? htmlToPlainText(p.description) : "",
    priceKurus: cheapest ? liraToKurus(cheapest.price.price) : null,
    compareAtPriceKurus: cheapest?.price.compareAt ? liraToKurus(cheapest.price.compareAt) : null,
    stock,
    categories: (p.categories ?? []).map((c) => c.name?.trim()).filter((n): n is string => !!n),
    images,
    warnings,
  };
}

type JsonLdProduct = {
  name?: string;
  description?: string;
  image?: string | string[];
  offers?: { price?: number | string; availability?: string } | { price?: number | string }[];
};

function readJsonLdProduct(html: string): JsonLdProduct | null {
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      if (data?.["@type"] === "Product") return data;
    } catch {
      // bozuk JSON-LD bloğunu atla
    }
  }
  return null;
}

function readBreadcrumbCategory(html: string): string | null {
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      if (data?.["@type"] !== "BreadcrumbList") continue;
      const items: { position: number; name: string }[] = data.itemListElement ?? [];
      // [mağaza, kategori, ürün] -> ortadaki
      return items.length >= 3 ? items[items.length - 2].name : null;
    } catch {
      // yoksay
    }
  }
  return null;
}

function fromJsonLd(ld: JsonLdProduct, html: string, url: string, ikasSlug: string): ParsedProduct {
  const warnings = ["__NEXT_DATA__ yok; JSON-LD yedeği kullanıldı (indirim ve stok bilgisi eksik olabilir)"];
  const offers = Array.isArray(ld.offers) ? ld.offers : ld.offers ? [ld.offers] : [];
  const prices = offers.map((o) => Number(o.price)).filter((n) => Number.isFinite(n) && n > 0);
  const price = prices.length ? Math.min(...prices) : null;
  if (price == null) warnings.push("Geçerli fiyat yok; ürün pasif alınacak");

  const urls = Array.isArray(ld.image) ? ld.image : ld.image ? [ld.image] : [];
  const images: ParsedImage[] = urls.flatMap((u, i) => {
    const id = u.match(/cdn\.myikas\.com\/images\/[0-9a-f-]{36}\/([0-9a-f-]{36})\//)?.[1];
    return id ? [{ ikasImageId: id, url: u, isMain: i === 0, order: i }] : [];
  });
  const category = readBreadcrumbCategory(html);

  return {
    ikasId: null,
    ikasUrl: url,
    ikasSlug,
    name: (ld.name ?? ikasSlug).trim(),
    description: ld.description ? htmlToPlainText(ld.description) : "",
    priceKurus: price != null ? liraToKurus(price) : null,
    compareAtPriceKurus: null,
    stock: null,
    categories: category ? [category] : [],
    images,
    warnings,
  };
}

function sortImages(images: ParsedImage[]) {
  images.sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.order - b.order);
}
