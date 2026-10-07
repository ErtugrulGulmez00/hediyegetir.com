// Vitrin filtreleri: adres çubuğu <-> filtre durumu. Sunucu sayfası ve istemci araç çubuğu ortak kullanır.
import { budgetByKey, type BudgetKey } from "./hedis/config";

export const SORT_OPTIONS = {
  onerilen: "Önerilen",
  yeni: "En yeni",
  "fiyat-artan": "Fiyat: artan",
  "fiyat-azalan": "Fiyat: azalan",
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;
export const isSortKey = (s: unknown): s is SortKey => typeof s === "string" && s in SORT_OPTIONS;

export type Filters = { category?: string; budget?: BudgetKey; sort: SortKey };

type SearchParams = Record<string, string | string[] | undefined>;

export function readFilters(sp: SearchParams): Filters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const budget = one(sp.butce);
  const sort = one(sp.sirala);
  return {
    category: one(sp.kategori) || undefined,
    budget: budget && budgetByKey(budget) ? (budget as BudgetKey) : undefined,
    sort: isSortKey(sort) ? sort : "onerilen",
  };
}

/** Mevcut filtrelere bir değişiklik uygulanmış vitrin adresi. Ürün listesine kaydırır. */
export function hrefWith(f: Filters, patch: Partial<Filters>): string {
  const next = { ...f, ...patch };
  const q = new URLSearchParams();
  if (next.category) q.set("kategori", next.category);
  if (next.budget) q.set("butce", next.budget);
  if (next.sort !== "onerilen") q.set("sirala", next.sort);
  const s = q.toString();
  return `${s ? `/?${s}` : "/"}#urunler`;
}
