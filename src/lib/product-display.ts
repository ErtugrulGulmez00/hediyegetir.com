// Ürün sayfasının görünüm seçenekleri: fotoğraf dizilişi ve damga. Sitede ve admin önizlemesinde ortak.

export const GALLERY_LAYOUTS = [
  { key: "TEK", label: "Tek", hint: "Tek büyük fotoğraf, kaydırarak geçilir" },
  { key: "IKILI", label: "İkili", hint: "Fotoğraflar ikişer yan yana" },
  { key: "UCLU", label: "Üçlü", hint: "Bir büyük, yanında iki küçük" },
] as const;
export type GalleryLayoutKey = (typeof GALLERY_LAYOUTS)[number]["key"];

/** Yeni ürün damgasız başlar: damga (ve el yapımı vurgusu) yalnızca el yapımı ürünlerde seçilir */
export const DEFAULT_STAMPS: string[] = [];
export const STAMP_PRESETS = ["El yapımı", "Ev yapımı", "El işi", "Kadın işi", "Kadın emeği"] as const;
export const STAMP_MAX_LENGTH = 20;
export const MAX_STAMPS = 3;
/** Yan yana damgalar farklı açılarla basılmış gibi dursun */
export const STAMP_ROTATIONS = [-10, 7, -4] as const;

/** Fotoğraf sayısı seçilen düzene yetmiyorsa bir alt düzene düşer */
export function effectiveLayout(layout: GalleryLayoutKey, count: number): GalleryLayoutKey {
  if (count < 2) return "TEK";
  if (layout === "UCLU" && count < 3) return "IKILI";
  return layout;
}

export const GRID_COLS: Record<Exclude<GalleryLayoutKey, "TEK">, string> = {
  IKILI: "grid-cols-2",
  UCLU: "grid-cols-3",
};

/**
 * Izgarada bir fotoğrafın hücresi. İkilide tek kalan son fotoğraf iki sütuna yayılır;
 * üçlüde ilk fotoğraf 2×2 yer kaplar, yanındaki iki küçükle aynı 4:5 oranında kalır.
 */
export function gridCellClass(layout: Exclude<GalleryLayoutKey, "TEK">, index: number, count: number): string {
  if (layout === "IKILI") return index === count - 1 && count % 2 === 1 ? "col-span-2 aspect-[8/5]" : "aspect-[4/5]";
  return index === 0 ? "col-span-2 row-span-2" : "aspect-[4/5]";
}
