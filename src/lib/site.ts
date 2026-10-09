export const SITE_NAME = "hediyegetir";
/**
 * Sitenin tam adresi (WhatsApp mesajındaki ürün linkleri, sitemap, paylaşım önizlemeleri). Öncelik
 * NEXT_PUBLIC_SITE_URL; Vercel'de bu boşsa ya da yanlışlıkla yerel adres (localhost) girildiyse Vercel'in verdiği
 * üretim adresi (*.vercel.app ya da bağlı alan adı) kullanılır.
 */
export function resolveSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL || env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  const local = !explicit || /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(explicit);
  const url = local && vercel ? `https://${vercel}` : explicit || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
});

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * Sipariş ve teslimat bilgileri: üst bant, ürün sayfası ve "Nasıl sipariş verilir?" sayfası buradan okur.
 * Kargo ücreti netleşince `shipping` metnini güncelle (ör. "Kargo 80 ₺, 1.500 ₺ üzeri ücretsiz").
 */
export const ORDER_INFO = {
  /** Sipariş netleştikten sonra kaç iş gününde kargoya verilir */
  leadTimeDays: 3,
  shipping: "Ödeme ve kargo ücreti WhatsApp'ta netleşir",
};
