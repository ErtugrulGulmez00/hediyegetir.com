import { describe, expect, it } from "vitest";
import { hrefWith, matchesSearch, parsePriceParam, priceLabel, readFilters, searchKey } from "./shop-filters";

describe("readFilters", () => {
  it("kategori adresten gelir, ?kategori= yok sayılır", () => {
    expect(readFilters({ kategori: "giyim" }).category).toBeUndefined();
    expect(readFilters({}, "canta").category).toBe("canta");
  });

  it("geçersiz fiyat ve sıralamayı yok sayar, aramayı temizler", () => {
    expect(readFilters({ butce: "x", fiyat: "abc", sirala: "y", ara: "  hasır   çanta " })).toEqual({
      category: undefined,
      price: undefined,
      sort: "onerilen",
      q: "hasır çanta",
    });
    expect(readFilters({ ara: "   " }).q).toBeUndefined();
  });

  it("fiyat aralığını okur; eski ?butce= adreslerini aralığa çevirir", () => {
    expect(readFilters({ fiyat: "500-1200" }).price).toEqual({ min: 500, max: 1200 });
    expect(readFilters({ butce: "500-1000" }).price).toEqual({ min: 500, max: 1000 });
    expect(readFilters({ butce: "1000+" }).price).toEqual({ min: 1000, max: undefined });
  });
});

describe("parsePriceParam", () => {
  it("tek uçlu, ters ve geçersiz aralıklar", () => {
    expect(parsePriceParam("500-")).toEqual({ min: 500, max: undefined });
    expect(parsePriceParam("-1200")).toEqual({ min: undefined, max: 1200 });
    expect(parsePriceParam("1200-500")).toEqual({ min: 500, max: 1200 });
    expect(parsePriceParam("0-")).toBeUndefined();
    expect(parsePriceParam("-")).toBeUndefined();
    expect(parsePriceParam("1.5-3")).toBeUndefined();
  });

  it("etiket", () => {
    expect(priceLabel({ min: 500, max: 1200 })).toMatch(/500 – .*1\.200/);
    expect(priceLabel({ min: 500 })).toMatch(/ve üzeri$/);
    expect(priceLabel({ max: 800 })).toMatch(/^en çok/);
    expect(priceLabel(undefined)).toBeNull();
  });
});

describe("hrefWith", () => {
  const base = { sort: "onerilen" as const };

  it("kategori seçilince kategori sayfasına gider, diğer filtreleri korur", () => {
    expect(hrefWith({ ...base, price: { min: 500, max: 1000 }, q: "örgü" }, { category: "canta" })).toBe(
      "/kategori/canta?fiyat=500-1000&ara=%C3%B6rg%C3%BC#urunler",
    );
  });

  it("'Hepsi' ana sayfaya döner; varsayılan sıralama adrese yazılmaz", () => {
    expect(hrefWith({ ...base, category: "canta", sort: "yeni" }, { category: undefined })).toBe("/?sirala=yeni#urunler");
    expect(hrefWith(base, {})).toBe("/#urunler");
  });
});

describe("arama", () => {
  it("Türkçe harfleri ve büyük/küçük harfi katlar", () => {
    expect(searchKey("ÇANTA Süveter İğne")).toBe("canta suveter igne");
  });

  it("her kelime bir alanda geçmeli", () => {
    const fields = ["Granny Square Kolsuz Süveter", "Klasik motifler", "Giyim"];
    expect(matchesSearch(fields, "suveter")).toBe(true);
    expect(matchesSearch(fields, "granny giyim")).toBe(true);
    expect(matchesSearch(fields, "granny çanta")).toBe(false);
  });
});
