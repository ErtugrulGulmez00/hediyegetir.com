import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("Türkçe karakterleri dönüştürür", () => {
    expect(slugify("Örgü Çanta & Şal")).toBe("orgu-canta-sal");
    expect(slugify("IĞDIR İĞNE Işık")).toBe("igdir-igne-isik");
  });
  it("baştaki/sondaki tireleri temizler", () => {
    expect(slugify("  --El Yapımı Süveter!-- ")).toBe("el-yapimi-suveter");
  });
});

describe("uniqueSlug", () => {
  it("çakışmada numara ekler", () => {
    expect(uniqueSlug("Çanta", new Set(["canta", "canta-2"]))).toBe("canta-3");
  });
  it("boş isimde yedek kullanır", () => {
    expect(uniqueSlug("!!!", new Set())).toBe("urun");
  });
});
