import { describe, expect, it } from "vitest";
import { buildPrompt, parseAiSuggestion, providerOf } from "./product-vision";

const cats = [
  { id: "c1", name: "Çanta" },
  { id: "c2", name: "Kadın Giyim (Handmade)" },
];

describe("parseAiSuggestion", () => {
  it("modelin gerçek cevabını ayrıştırır ve kategoriyi eşler", () => {
    const text = `{"urunAdi": "Yeşil Zigzag Örgü Elbise", "kategori": "kadın giyim (handmade)", "cinsiyet": "KADIN",
      "kime": ["anne", "sevgili", "kiz-kardes"], "hobiler": ["el-isi", "moda", "seyahat"],
      "altMetin": "Yeşil ve bej zigzag desenli askılı elbise", "aciklama": "Pamuk ipten elde örüldü."}`;
    expect(parseAiSuggestion(text, cats)).toEqual({
      name: "Yeşil Zigzag Örgü Elbise",
      description: "Pamuk ipten elde örüldü.",
      categoryId: "c2",
      newCategoryName: undefined,
      gender: "KADIN",
      recipients: ["anne", "sevgili", "kiz-kardes"],
      hobbies: ["el-isi", "moda", "seyahat"],
      alt: "Yeşil ve bej zigzag desenli askılı elbise",
    });
  });

  it("kod bloğu ve öncesindeki düşünme metnini atlar", () => {
    const text = 'Fotoğrafa bakıyorum {not json}...\n```json\n{"urunAdi": "Saat", "kategori": "Aksesuar", "kime": ["baba"]}\n```';
    const s = parseAiSuggestion(text.replace("{not json}", ""), cats);
    expect(s?.name).toBe("Saat");
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

  it("JSON içindeki süslü parantezli metni bozmaz", () => {
    expect(parseAiSuggestion('{"urunAdi": "Kalp {mini} kolye"}', cats)?.name).toBe("Kalp {mini} kolye");
  });

  it("JSON yoksa null döner", () => {
    expect(parseAiSuggestion("User Safety: safe", cats)).toBeNull();
  });
});

describe("buildPrompt", () => {
  it("mevcut kategorileri ve Hediş anahtarlarını içerir", () => {
    const p = buildPrompt(cats);
    expect(p).toContain("Çanta, Kadın Giyim (Handmade)");
    expect(p).toContain("kiz-kardes");
    expect(p).toContain("kahve-cay");
  });
});

describe("providerOf", () => {
  it("adında / olmayan modeller OpenAI, olanlar OpenRouter", () => {
    expect(providerOf("gpt-6-luna")).toBe("openai");
    expect(providerOf("google/gemma-4-31b-it:free")).toBe("openrouter");
    expect(providerOf("~deepseek/deepseek-flash-latest")).toBe("openrouter");
  });
});
