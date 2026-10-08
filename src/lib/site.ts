export const SITE_NAME = "hediyegetir";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hediyegetir.com").replace(/\/+$/, "");

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
