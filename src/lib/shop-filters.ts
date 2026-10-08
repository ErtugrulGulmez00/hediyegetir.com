// Vitrin filtreleri: adres çubuğu <-> filtre durumu. Sunucu sayfası ve istemci araç çubuğu ortak kullanır.
// Kategori adresin kendisidir (/kategori/canta); bütçe, sıralama ve arama sorgu parametresidir.
import { budgetByKey, type BudgetKey } from "./hedis/config";

export const SORT_OPTIONS = {
  onerilen: "Önerilen",
  yeni: "En yeni",
  "fiyat-artan": "Fiyat: artan",
  "fiyat-azalan": "Fiyat: azalan",
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;
export const isSortKey = (s: unknown): s is SortKey => typeof s === "string" && s in SORT_OPTIONS;

export type Filters = { category?: string; budget?: BudgetKey; sort: SortKey; q?: string };

export const MAX_SEARCH_LENGTH = 60;

type SearchParams = Record<string, string | string[] | undefined>;

/** `category`: kategori sayfasında adresten gelen kategori (ana sayfada yok) */
export function readFilters(sp: SearchParams, category?: string): Filters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const budget = one(sp.butce);
  const sort = one(sp.sirala);
  const q = one(sp.ara)?.replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_LENGTH);
  return {
    category: category || undefined,
    budget: budget && budgetByKey(budget) ? (budget as BudgetKey) : undefined,
    sort: isSortKey(sort) ? sort : "onerilen",
    q: q || undefined,
  };
}

/** Mevcut filtrelere bir değişiklik uygulanmış vitrin adresi. Ürün listesine kaydırır. */
export function hrefWith(f: Filters, patch: Partial<Filters>): string {
  const next = { ...f, ...patch };
  const q = new URLSearchParams();
  if (next.budget) q.set("butce", next.budget);
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
