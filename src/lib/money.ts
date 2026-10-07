// Tüm fiyatlar kuruş cinsinden tamsayı olarak saklanır.

const formatterWhole = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatterCents = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 125000 -> "₺1.250", 125050 -> "₺1.250,50" */
export function formatPrice(kurus: number): string {
  const formatter = kurus % 100 === 0 ? formatterWhole : formatterCents;
  return formatter.format(kurus / 100);
}

/** 1250.5 (TL) -> 125050 (kuruş). Kayan nokta hatalarını yuvarlayarak giderir. */
export function liraToKurus(lira: number): number {
  return Math.round(lira * 100);
}

/**
 * Admin formundaki "1.250,50" / "1250.50" / "1250" gibi girdileri kuruşa çevirir.
 * Geçersizse null döner.
 */
export function parsePriceInput(input: string): number | null {
  const cleaned = input.replace(/[₺\s]/g, "");
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(",")) {
    // Türkçe biçim: nokta binlik ayırıcı, virgül ondalık
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    // "1.250" gibi yalnızca binlik ayırıcı
    normalized = cleaned.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return liraToKurus(Number(normalized));
}
