import { describe, expect, it } from "vitest";
import { formatPrice, liraToKurus, parsePriceInput } from "./money";

// Intl çıktısında bölünmez boşluk olabilir; karşılaştırmada normalize ediyoruz
const norm = (s: string) => s.replace(/\s/g, " ");

describe("formatPrice", () => {
  it("tam lirayı kuruşsuz yazar", () => {
    expect(norm(formatPrice(125000))).toBe("₺1.250");
  });
  it("kuruşlu fiyatı virgülle yazar", () => {
    expect(norm(formatPrice(125050))).toBe("₺1.250,50");
  });
});

describe("liraToKurus", () => {
  it("kayan nokta hatasını yuvarlar", () => {
    expect(liraToKurus(19.99)).toBe(1999);
    expect(liraToKurus(0.1 + 0.2)).toBe(30);
  });
});

describe("parsePriceInput", () => {
  it.each([
    ["1250", 125000],
    ["1.250", 125000],
    ["1.250,50", 125050],
    ["1250,5", 125050],
    ["1250.50", 125050],
    ["₺ 899", 89900],
  ])("%s -> %d", (input, expected) => {
    expect(parsePriceInput(input)).toBe(expected);
  });
  it.each(["", "abc", "12,345,6", "-5"])("geçersiz: %s", (input) => {
    expect(parsePriceInput(input)).toBeNull();
  });
});
