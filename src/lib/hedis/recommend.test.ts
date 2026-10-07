import { describe, expect, it } from "vitest";
import { budgetFit, recommend, type Candidate, type HedisAnswers } from "./recommend";

let seq = 0;
const product = (over: Partial<Candidate> = {}): Candidate => ({
  id: `p${++seq}`,
  priceKurus: 40_000,
  recipients: ["anne"],
  gender: "UNISEX",
  hobbies: [],
  isFeatured: false,
  categoryId: "c1",
  createdAt: new Date(2026, 0, seq),
  ...over,
});

const anne: HedisAnswers = { recipient: "anne", gender: null, budget: "0-500", hobbies: ["mutfak"] };

describe("budgetFit", () => {
  it("bant sınırları: ≤500, 500–≤1000, >1000", () => {
    expect(budgetFit(50_000, "0-500")).toBe("in");
    expect(budgetFit(50_001, "0-500")).toBe("above");
    expect(budgetFit(50_000, "500-1000")).toBe("below");
    expect(budgetFit(100_000, "500-1000")).toBe("in");
    expect(budgetFit(100_001, "1000+")).toBe("in");
  });
  it("%20 tolerans", () => {
    expect(budgetFit(60_000, "0-500")).toBe("above");
    expect(budgetFit(60_001, "0-500")).toBe("out");
    expect(budgetFit(80_001, "1000+")).toBe("below");
    expect(budgetFit(80_000, "1000+")).toBe("out");
  });
});

describe("recommend", () => {
  it("tam eşleşmeyi öne alır ve nedenlerini yazar", () => {
    const best = product({ hobbies: ["mutfak"] });
    const other = product({ recipients: ["baba"] });
    const r = recommend([other, best], anne);
    expect(r.items[0].id).toBe(best.id);
    expect(r.items[0].reasons).toEqual(["Annene uygun", "Bütçene uygun", "Yemek & mutfak sevenlere"]);
    expect(r.items[0].fallback).toBe(false);
  });

  it("bütçeyi biraz aşanı düşük puanla ve etiketle ekler", () => {
    const near = product({ priceKurus: 55_000 });
    const r = recommend([near], anne);
    expect(r.items[0].reasons).toContain("Bütçeni biraz aşıyor");
    expect(r.strongCount).toBe(1);
  });

  it("cinsiyeti uymayan ürünü eler", () => {
    const erkek = product({ gender: "ERKEK", hobbies: ["mutfak"] });
    const r = recommend([erkek, product()], anne);
    expect(r.items.map((i) => i.id)).not.toContain(erkek.id);
  });

  it("cinsiyeti belirsiz kişide kullanıcının cevabını kullanır; 'fark etmez' kimseyi elemez", () => {
    const kadin = product({ recipients: ["sevgili"], gender: "KADIN" });
    const erkek = product({ recipients: ["sevgili"], gender: "ERKEK" });
    const base = { recipient: "sevgili", budget: "0-500" as const, hobbies: [] };
    expect(recommend([kadin, erkek], { ...base, gender: "ERKEK" }).items.map((i) => i.id)).toEqual([erkek.id]);
    expect(recommend([kadin, erkek], { ...base, gender: null }).items).toHaveLength(2);
  });

  it("en fazla 5 sonuç döner", () => {
    const many = Array.from({ length: 9 }, (_, i) => product({ categoryId: `c${i}` }));
    expect(recommend(many, anne).items).toHaveLength(5);
  });

  it("mümkünse aynı kategoriden en fazla 2 ürün seçer", () => {
    const sameCat = Array.from({ length: 4 }, () => product({ categoryId: "canta", hobbies: ["mutfak"] }));
    const others = [product({ categoryId: "giyim" }), product({ categoryId: "dekor" }), product({ categoryId: "taki" })];
    const r = recommend([...sameCat, ...others], anne);
    const fromCanta = r.items.filter((i) => sameCat.some((p) => p.id === i.id));
    expect(fromCanta).toHaveLength(2);
    expect(r.items).toHaveLength(5);
  });

  it("çeşitlilik mümkün değilse aynı kategoriden doldurur", () => {
    const sameCat = Array.from({ length: 6 }, () => product({ categoryId: "canta" }));
    expect(recommend(sameCat, anne).items).toHaveLength(5);
  });

  it("5'ten az uygun ürün varsa yedeklerle doldurur ve işaretler", () => {
    const strong = product();
    const pricey = product({ priceKurus: 300_000 });
    const forBaba = product({ recipients: ["baba"] });
    const r = recommend([pricey, forBaba, strong], anne);
    expect(r.strongCount).toBe(1);
    expect(r.items).toHaveLength(3);
    expect(r.items[0]).toMatchObject({ id: strong.id, fallback: false });
    expect(r.items.slice(1).every((i) => i.fallback)).toBe(true);
  });

  it("hiç ürün yoksa boş döner", () => {
    expect(recommend([], anne)).toEqual({ items: [], strongCount: 0 });
  });

  it("öne çıkan ürün eşit puanda öne geçer", () => {
    const a = product();
    const b = product({ isFeatured: true });
    expect(recommend([a, b], anne).items[0].id).toBe(b.id);
  });
});
