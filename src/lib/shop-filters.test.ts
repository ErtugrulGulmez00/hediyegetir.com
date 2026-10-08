import { describe, expect, it } from "vitest";
import { hrefWith, matchesSearch, readFilters, searchKey } from "./shop-filters";

describe("readFilters", () => {
  it("kategori adresten gelir, ?kategori= yok sayılır", () => {
    expect(readFilters({ kategori: "giyim" }).category).toBeUndefined();
    expect(readFilters({}, "canta").category).toBe("canta");
  });

  it("geçersiz bütçe ve sıralamayı yok sayar, aramayı temizler", () => {
    expect(readFilters({ butce: "x", sirala: "y", ara: "  hasır   çanta " })).toEqual({
      category: undefined,
      budget: undefined,
      sort: "onerilen",
      q: "hasır çanta",
    });
    expect(readFilters({ ara: "   " }).q).toBeUndefined();
  });
});

describe("hrefWith", () => {
  const base = { sort: "onerilen" as const };

  it("kategori seçilince kategori sayfasına gider, diğer filtreleri korur", () => {
    expect(hrefWith({ ...base, budget: "500-1000", q: "örgü" }, { category: "canta" })).toBe(
      "/kategori/canta?butce=500-1000&ara=%C3%B6rg%C3%BC#urunler",
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
