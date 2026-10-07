import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { suggestTags } from "./auto-tag";
import { htmlToPlainText, parseProductPage } from "./parse-product";
import { parseProductsSitemap } from "./sitemap";

const fixture = (name: string) => readFileSync(new URL(`../../../tests/fixtures/${name}`, import.meta.url), "utf8");
const URL_ = "https://hediyeyolla.ikas.shop/handmade-kol-cantasi";

describe("parseProductsSitemap", () => {
  it("ürün URL'lerini alır, mağaza ana sayfasını atlar", () => {
    const xml = `<urlset><url><loc>https://x.ikas.shop</loc></url>
      <url><loc>https://x.ikas.shop/a-urun</loc><lastmod>2026-09-27T14:01:27.761Z</lastmod></url>
      <url><loc>https://x.ikas.shop/b&amp;c</loc></url></urlset>`;
    expect(parseProductsSitemap(xml, "https://x.ikas.shop/")).toEqual([
      { url: "https://x.ikas.shop/a-urun", lastmod: "2026-09-27T14:01:27.761Z" },
      { url: "https://x.ikas.shop/b&c", lastmod: null },
    ]);
  });
});

describe("parseProductPage (__NEXT_DATA__)", () => {
  const p = parseProductPage(fixture("ikas-product.html"), URL_);

  it("temel alanları okur", () => {
    expect(p.ikasId).toBe("518e6b38-9ba2-4bb0-a18c-f8bf04c22185");
    expect(p.name).toBe("Handmade Kol Çantası");
    expect(p.ikasSlug).toBe("handmade-kol-cantasi");
    expect(p.categories).toEqual(["Çanta"]);
    expect(p.stock).toBe(1);
  });

  it("indirimli fiyatı satış, normal fiyatı üstü çizili alır", () => {
    expect(p.priceKurus).toBe(99_000);
    expect(p.compareAtPriceKurus).toBe(110_000);
  });

  it("görselleri ana görsel önce, 1080 boyutunda kurar", () => {
    expect(p.images).toHaveLength(2);
    expect(p.images[0]).toMatchObject({ ikasImageId: "760a22a8-5ce6-416f-b707-ff57b0ddce7b", isMain: true });
    expect(p.images[0].url).toBe(
      "https://cdn.myikas.com/images/f9283aa4-18ee-4a07-9ffa-0e324667b1e0/760a22a8-5ce6-416f-b707-ff57b0ddce7b/1080/1000000757.webp",
    );
  });

  it("açıklamayı HTML'den düz metne çevirir", () => {
    expect(p.description).not.toMatch(/<|&nbsp;|style=/);
    expect(p.description).toContain("üç iş günü içerisinde kargoya verilir");
    expect(p.description).not.toMatch(/\n{3,}/);
  });
});

describe("parseProductPage (JSON-LD yedeği)", () => {
  it("__NEXT_DATA__ yoksa JSON-LD'den okur ve uyarı ekler", () => {
    const p = parseProductPage(fixture("ikas-product-jsonld-only.html"), URL_);
    expect(p.ikasId).toBeNull();
    expect(p.name).toBe("Handmade Kol Çantası");
    expect(p.priceKurus).toBeGreaterThan(0);
    expect(p.categories).toEqual(["Çanta"]);
    expect(p.images.length).toBe(2);
    expect(p.warnings[0]).toMatch(/JSON-LD/);
  });

  it("ürün verisi yoksa hata fırlatır", () => {
    expect(() => parseProductPage("<html></html>", URL_)).toThrow();
  });
});

describe("parseProductPage fiyat kuralları", () => {
  const page = (variants: unknown[]) =>
    `<img src="https://cdn.myikas.com/images/f9283aa4-18ee-4a07-9ffa-0e324667b1e0/x/1/y.webp">` +
    `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: { pageProps: { pageSpecificData: { id: "1", name: "Test", variants } } },
    })}</script>`;

  it("silinmiş ve sıfır fiyatlı varyantları atlar, en düşük geçerli fiyatı alır", () => {
    const p = parseProductPage(
      page([
        { deleted: true, prices: [{ sellPrice: 10 }] },
        { prices: [{ sellPrice: 0 }] },
        { stock: 2, prices: [{ sellPrice: 300, discountPrice: null }] },
        { stock: 1, prices: [{ sellPrice: 250, discountPrice: null }] },
      ]),
      URL_,
    );
    expect(p.priceKurus).toBe(25_000);
    expect(p.compareAtPriceKurus).toBeNull();
  });

  it("geçerli fiyat yoksa null döner ve uyarır", () => {
    const p = parseProductPage(page([{ prices: [{ sellPrice: 0 }] }]), URL_);
    expect(p.priceKurus).toBeNull();
    expect(p.warnings.join(" ")).toMatch(/pasif/);
  });

  it("stok takibi olmayan varyant varsa stok null olur", () => {
    const p = parseProductPage(page([{ stock: null, prices: [{ sellPrice: 100 }] }]), URL_);
    expect(p.stock).toBeNull();
  });
});

describe("htmlToPlainText", () => {
  it("etiketleri ve fazla boş satırları temizler", () => {
    expect(htmlToPlainText("<p>Bir</p><br><p><br></p><p>İki &amp; üç</p>")).toBe("Bir\n\nİki & üç");
  });
});

describe("suggestTags", () => {
  it("elbise -> kadın, moda; erkek akrabalar önerilmez", () => {
    const t = suggestTags({ name: "Handmade Elbise Pamuk İp", description: "", categories: ["Kadın Giyim"] });
    expect(t.gender).toBe("KADIN");
    expect(t.hobbies).toContain("moda");
    expect(t.recipients).toContain("anne");
    expect(t.recipients).toContain("sevgili");
    expect(t.recipients).not.toContain("baba");
    expect(t.recipients).not.toContain("cocuk");
  });

  it("süveter -> unisex", () => {
    const t = suggestTags({ name: "Handmade Süveter", description: "", categories: [] });
    expect(t.gender).toBe("UNISEX");
    expect(t.recipients).toContain("baba");
    expect(t.recipients).toContain("anne");
  });

  it("renk ve malzeme kelimelerini hobi sanmaz", () => {
    const t = suggestTags({ name: "Hasır Çanta", description: "Kahverengi, doğal hasırdan", categories: [] });
    expect(t.hobbies).not.toContain("kahve-cay");
    expect(t.hobbies).not.toContain("spor-doga");
  });

  it("plaj/hasır -> seyahat", () => {
    const t = suggestTags({ name: "Handmade Plaj Çantası", description: "Hasır", categories: ["Çanta"] });
    expect(t.hobbies).toContain("seyahat");
  });
});
