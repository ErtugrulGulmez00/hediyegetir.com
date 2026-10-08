import { describe, expect, it } from "vitest";
import { buildCartMessage, buildProductQuestion, normalizeWhatsappNumber, waLink } from "./whatsapp";

describe("normalizeWhatsappNumber", () => {
  it.each([
    ["0532 123 45 67", "905321234567"],
    ["+90 532 123 4567", "905321234567"],
    ["5321234567", "905321234567"],
    ["0090 532 123 45 67", "905321234567"],
    ["905321234567", "905321234567"],
  ])("%s", (input, expected) => {
    expect(normalizeWhatsappNumber(input)).toBe(expected);
  });
  it("kısa numarayı reddeder", () => {
    expect(normalizeWhatsappNumber("12345")).toBeNull();
  });
});

describe("buildCartMessage", () => {
  const msg = buildCartMessage("Merhaba!", [
    { name: "Kol Çantası", qty: 2, unitPriceKurus: 99_000, url: "https://hediyegetir.com/urun/kol-cantasi" },
    { name: "Süveter", qty: 1, unitPriceKurus: 126_050, url: "https://hediyegetir.com/urun/suveter" },
  ]);

  it("ürünleri numaralı, adet ve fiyatla listeler", () => {
    expect(msg).toContain("1) Kol Çantası\n   2 adet × ₺990 = ₺1.980\n   https://hediyegetir.com/urun/kol-cantasi");
    expect(msg).toContain("2) Süveter\n   1 adet × ₺1.260,50\n");
  });

  it("ara toplamı ekler", () => {
    expect(msg).toContain("Ara toplam: ₺3.240,50");
  });

  it("bölünmez boşluk içermez (WhatsApp'ta düzgün görünsün)", () => {
    expect(msg).not.toMatch(/ /);
  });

  it("wa.me linkinde ürün adı kodlanmış olarak yer alır", () => {
    const link = waLink("905321234567", msg);
    expect(link.startsWith("https://wa.me/905321234567?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toContain("Kol Çantası");
  });

  it("ek yoksa hediye paketi ve not satırı eklemez", () => {
    expect(msg).not.toContain("Hediye paketi");
    expect(msg).not.toContain("Not:");
  });

  it("hediye paketi ve notu ara toplamın altına ekler", () => {
    const withExtras = buildCartMessage("Merhaba!", [{ name: "Süveter", qty: 1, unitPriceKurus: 126_000, url: "u" }], {
      giftWrap: true,
      note: "  Lacivert olsun, içine \"İyi ki doğdun\" yazılsın.  ",
    });
    expect(withExtras).toContain(
      'Ara toplam: ₺1.260\nHediye paketi istiyorum.\nNot: Lacivert olsun, içine "İyi ki doğdun" yazılsın.\nÖdeme ve kargo',
    );
  });

  it("boş notu yok sayar, uzun notu kırpar", () => {
    const line = [{ name: "Çanta", qty: 1, unitPriceKurus: 1, url: "u" }];
    expect(buildCartMessage("M", line, { note: "   " })).not.toContain("Not:");
    const long = buildCartMessage("M", line, { note: "a".repeat(500) });
    expect(long).toContain(`Not: ${"a".repeat(300)}\n`);
  });
});

describe("buildProductQuestion", () => {
  it("ürün adı, fiyatı ve linki içerir", () => {
    const q = buildProductQuestion({ name: "Hasır Çanta", url: "https://x/urun/hasir", priceKurus: 162_000 });
    expect(q).toBe('Merhaba! "Hasır Çanta" (₺1.620) hakkında bilgi almak istiyorum.\nhttps://x/urun/hasir');
  });
});
