import { describe, expect, it } from "vitest";
import { extractJson, providerOf } from "./client";
import { buildPrompt, parseAiSuggestion } from "./product-vision";

const cats = [
  { id: "c1", name: "Çanta" },
  { id: "c2", name: "Kadın Giyim (Handmade)" },
];

describe("parseAiSuggestion", () => {
  it("tam cevabı ayrıştırır, kategoriyi büyük/küçük harf bağımsız eşler", () => {
    const text = `{"urunAdi": "Yeşil Zigzag Örgü Elbise", "aciklama": "Pamuk ipten elde örüldü.",
      "ozellikler": ["Pamuk ip", "Askılı, midi boy"], "kategori": "kadın giyim (handmade)", "cinsiyet": "KADIN",
      "kime": ["anne", "sevgili"], "hobiler": ["el-isi", "moda"], "ozelGunler": ["dogum-gunu", "uydurma"],
      "etiketler": ["El Örgüsü", "yazlık", "el örgüsü"], "altMetinler": ["Önden görünüm", "Arkadan görünüm"]}`;
    expect(parseAiSuggestion(text, cats)).toEqual({
      name: "Yeşil Zigzag Örgü Elbise",
      description: "Pamuk ipten elde örüldü.",
      features: ["Pamuk ip", "Askılı, midi boy"],
      categoryId: "c2",
      newCategoryName: undefined,
      gender: "KADIN",
      recipients: ["anne", "sevgili"],
      hobbies: ["el-isi", "moda"],
      occasions: ["dogum-gunu"],
      tags: ["el örgüsü", "yazlık"],
      alts: ["Önden görünüm", "Arkadan görünüm"],
    });
  });

  it("eşleşmeyen kategoriyi yeni kategori önerisi olarak döner", () => {
    const s = parseAiSuggestion('{"urunAdi": "Saat", "kategori": "Aksesuar"}', cats);
    expect(s?.categoryId).toBeUndefined();
    expect(s?.newCategoryName).toBe("Aksesuar");
  });

  it("bilinmeyen anahtarları ve geçersiz cinsiyeti atar, hobiyi 3 ile sınırlar", () => {
    const s = parseAiSuggestion(
      '{"cinsiyet": "kedi", "kime": ["anne", "uzayli", "anne"], "hobiler": ["moda", "uçmak", "okuma", "muzik", "oyun"]}',
      cats,
    );
    expect(s?.gender).toBeUndefined();
    expect(s?.recipients).toEqual(["anne"]);
    expect(s?.hobbies).toEqual(["moda", "okuma", "muzik"]);
  });

  it("eski tek fotoğraflık altMetin biçimini de okur", () => {
    expect(parseAiSuggestion('{"altMetin": "Saat"}', cats)?.alts).toEqual(["Saat"]);
  });

  it("JSON yoksa null döner", () => {
    expect(parseAiSuggestion("User Safety: safe", cats)).toBeNull();
  });
});

describe("extractJson", () => {
  it("kod bloğu ve öncesindeki metni atlar, metin içindeki süslü parantezi bozmaz", () => {
    expect(extractJson('Bakıyorum...\n```json\n{"a": "Kalp {mini} kolye"}\n```')).toEqual({ a: "Kalp {mini} kolye" });
  });
});

describe("buildPrompt", () => {
  it("bilinenleri, kategorileri ve anahtarları içerir", () => {
    const p = buildPrompt(cats, { name: "Ahşap kalem", description: "", priceKurus: 45_000, imageCount: 2 });
    expect(p).toContain("Ürün adı: Ahşap kalem");
    expect(p).toContain("Fiyat: 450 TL");
    expect(p).toContain("Ekteki 2 fotoğrafı");
    expect(p).toContain("Çanta, Kadın Giyim (Handmade)");
    expect(p).toContain("emeklilik");
    expect(p).toContain("kiz-kardes");
  });
});

describe("providerOf", () => {
  it("adında / olmayan modeller OpenAI, olanlar OpenRouter", () => {
    expect(providerOf("gpt-6-luna")).toBe("openai");
    expect(providerOf("google/gemma-4-31b-it:free")).toBe("openrouter");
  });
});
