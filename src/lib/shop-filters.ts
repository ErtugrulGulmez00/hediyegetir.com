// Vitrin filtreleri: adres çubuğu <-> filtre durumu. Sunucu sayfası ve istemci araç çubuğu ortak kullanır.
// Kategori adresin kendisidir (/kategori/canta); fiyat aralığı, sıralama ve arama sorgu parametresidir.
import { budgetByKey } from "./hedis/config";
import { formatPrice } from "./money";

export const SORT_OPTIONS = {
  onerilen: "Önerilen",
  yeni: "En yeni",
  "fiyat-artan": "Fiyat: artan",
  "fiyat-azalan": "Fiyat: azalan",
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;
export const isSortKey = (s: unknown): s is SortKey => typeof s === "string" && s in SORT_OPTIONS;

/** Fiyat aralığı, TL (tam sayı). İki uç da isteğe bağlı. */
export type PriceRange = { min?: number; max?: number };
export type Filters = { category?: string; price?: PriceRange; sort: SortKey; q?: string };

const MAX_PRICE_TL = 1_000_000;

/** "500-1200", "500-" ya da "-1200" (TL). Geçersizse undefined; ters yazılmışsa uçları çevirir. */
export function parsePriceParam(raw: string | undefined): PriceRange | undefined {
  const m = raw?.trim().match(/^(\d{0,7})-(\d{0,7})$/);
  if (!m) return undefined;
  const num = (s: string) => (s ? Math.min(MAX_PRICE_TL, Number(s)) : undefined);
  let min = num(m[1]);
  let max = num(m[2]);
  if (min === 0) min = undefined;
  if (min != null && max != null && min > max) [min, max] = [max, min];
  return min == null && max == null ? undefined : { min, max };
}

const priceParam = (r: PriceRange) => `${r.min ?? ""}-${r.max ?? ""}`;

/** Düğmede ve sonuç satırında: "₺500 – ₺1.200", "₺500 ve üzeri", "₺1.200'e kadar" yerine "en çok ₺1.200" */
export function priceLabel(r: PriceRange | undefined): string | null {
  if (!r || (r.min == null && r.max == null)) return null;
  const tl = (n: number) => formatPrice(n * 100);
  if (r.min != null && r.max != null) return r.min === r.max ? tl(r.min) : `${tl(r.min)} – ${tl(r.max)}`;
  return r.min != null ? `${tl(r.min)} ve üzeri` : `en çok ${tl(r.max!)}`;
}

export const MAX_SEARCH_LENGTH = 60;

type SearchParams = Record<string, string | string[] | undefined>;

/** `category`: kategori sayfasında adresten gelen kategori (ana sayfada yok) */
export function readFilters(sp: SearchParams, category?: string): Filters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  // Eski sabit bütçe adresleri (?butce=500-1000) aralığa çevrilir
  const legacy = budgetByKey(one(sp.butce) ?? "");
  const price =
    parsePriceParam(one(sp.fiyat)) ??
    (legacy
      ? {
          min: legacy.minExclusive != null ? legacy.minExclusive / 100 : undefined,
          max: legacy.maxInclusive != null ? legacy.maxInclusive / 100 : undefined,
        }
      : undefined);
  const sort = one(sp.sirala);
  const q = one(sp.ara)?.replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_LENGTH);
  return {
    category: category || undefined,
    price,
    sort: isSortKey(sort) ? sort : "onerilen",
    q: q || undefined,
  };
}

/** Mevcut filtrelere bir değişiklik uygulanmış vitrin adresi. Ürün listesine kaydırır. */
export function hrefWith(f: Filters, patch: Partial<Filters>): string {
  const next = { ...f, ...patch };
  const q = new URLSearchParams();
  if (next.price && (next.price.min != null || next.price.max != null)) q.set("fiyat", priceParam(next.price));
  if (next.sort !== "onerilen") q.set("sirala", next.sort);
  if (next.q) q.set("ara", next.q);
  const s = q.toString();
  const path = next.category ? `/kategori/${next.category}` : "/";
  return `${path}${s ? `?${s}` : ""}#urunler`;
}

const FOLD: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

/** Arama karşılaştırması için: Türkçe küçük harf, aksanlar katlanır ("Çanta" → "canta", "SÜVETER" → "suveter") */
export function searchKey(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (ch) => FOLD[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Aramadaki her kelime alanlardan birinde geçiyorsa eşleşir */
export function matchesSearch(fields: string[], query: string): boolean {
  const haystack = searchKey(fields.join(" "));
  return searchKey(query)
    .split(" ")
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}
