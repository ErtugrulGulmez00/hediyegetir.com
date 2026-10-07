import { describe, expect, it } from "vitest";
import { computeLockedFields, parseProductForm, type ProductFormInput } from "./product-input";

const base: ProductFormInput = {
  name: "Hasır Çanta",
  slug: "",
  description: "Güzel",
  price: "1.250",
  compareAtPrice: "",
  stock: "",
  categoryId: "",
  isActive: true,
  isFeatured: false,
  recipients: ["anne"],
  gender: "KADIN",
  hobbies: ["moda"],
  hedisReviewed: true,
  images: [{ url: "https://x.public.blob.vercel-storage.com/a.webp", alt: "", isBlob: true }],
  unlock: [],
};

describe("parseProductForm", () => {
  it("geçerli formu dönüştürür", () => {
    const r = parseProductForm(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.priceKurus).toBe(125_000);
    expect(r.data.slug).toBe("hasir-canta");
    expect(r.data.stock).toBeNull();
    expect(r.data.categoryId).toBeNull();
  });

  it("alan hatalarını Türkçe döner", () => {
    const r = parseProductForm({ ...base, price: "abc", compareAtPrice: "100", stock: "-1" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.price).toMatch(/fiyat/);
    expect(r.errors.stock).toMatch(/Stok/);
  });

  it("eski fiyat satış fiyatından düşükse reddeder", () => {
    const r = parseProductForm({ ...base, compareAtPrice: "1.000" });
    expect(r.ok).toBe(false);
  });

  it("bilinmeyen kişi/hobi anahtarını reddeder", () => {
    expect(parseProductForm({ ...base, recipients: ["uzayli"] }).ok).toBe(false);
  });

  it("javascript: gibi görsel adreslerini reddeder", () => {
    expect(parseProductForm({ ...base, images: [{ url: "javascript:alert(1)", alt: "", isBlob: false }] }).ok).toBe(false);
  });
});

describe("computeLockedFields", () => {
  const existing = {
    name: "Hasır Çanta",
    description: "Güzel",
    priceKurus: 125_000,
    compareAtPriceKurus: null,
    stock: null,
    categoryId: null,
    isActive: true,
    lockedFields: ["stock"],
    images: [{ url: "https://x.public.blob.vercel-storage.com/a.webp" }],
  };
  const parsed = (over: Partial<ProductFormInput>) => {
    const r = parseProductForm({ ...base, ...over });
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    return r.data;
  };

  it("değişmeyen alanları kilitlemez, mevcut kilitleri korur", () => {
    expect(computeLockedFields(existing, parsed({}))).toEqual(["stock"]);
  });

  it("değişen alanları kilitler", () => {
    expect(computeLockedFields(existing, parsed({ name: "Yeni Ad", price: "999", images: [] }))).toEqual([
      "name",
      "price",
      "stock",
      "images",
    ]);
  });

  it("kilidi açılan alan açılır", () => {
    expect(computeLockedFields(existing, parsed({ name: "Yeni Ad", unlock: ["name", "stock"] }))).toEqual([]);
  });
});
