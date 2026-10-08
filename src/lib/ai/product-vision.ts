// Ürün analizi: ad, açıklama, fotoğraflar ve fiyattan kategori, Hediş etiketleri, özel günler,
// anahtar kelimeler ve ürün özellikleri önerir. İstem ve cevap ayrıştırma saf fonksiyonlardır.
import { z } from "zod";
import { HOBBIES, OCCASIONS, RECIPIENTS, type GenderKey } from "../hedis/config";
import { extractJson } from "./client";

export type Category = { id: string; name: string };

export type AiSuggestion = {
  name?: string;
  description?: string;
  features: string[];
  categoryId?: string;
  /** Model mevcut kategorilerle eşleşmeyen yeni bir kategori önerdiyse adı (admin isterse oluşturur) */
  newCategoryName?: string;
  gender?: GenderKey;
  recipients: string[];
  hobbies: string[];
  occasions: string[];
  tags: string[];
  /** Gönderilen fotoğraflarla aynı sırada alt metinler */
  alts: string[];
};

export type ProductFacts = { name: string; description: string; priceKurus: number | null; imageCount: number };

export function buildPrompt(categories: Category[], facts: ProductFacts): string {
  const cats = categories.length ? categories.map((c) => c.name).join(", ") : "(henüz kategori yok)";
  const known = [
    facts.name.trim() && `Ürün adı: ${facts.name.trim()}`,
    facts.description.trim() && `Mevcut açıklama: ${facts.description.trim().slice(0, 1500)}`,
    facts.priceKurus && `Fiyat: ${Math.round(facts.priceKurus / 100)} TL`,
  ]
    .filter(Boolean)
    .join("\n");
  return `Sen bir hediye mağazasının ürün editörüsün. Mağazada hem el yapımı hem hazır ürünler var; ürünün el yapımı olduğu fotoğraftan ya da verilen bilgiden açıkça anlaşılmıyorsa "el yapımı" deme. ${facts.imageCount > 0 ? `Ekteki ${facts.imageCount} fotoğrafı ve` : "Aşağıdaki"} bilgileri inceleyip ürünü kataloğa hazırla.
${known || "(Admin henüz bilgi girmedi; yalnızca fotoğraflara dayan.)"}

YALNIZCA aşağıdaki JSON'u döndür:
{
  "urunAdi": "kısa, sade Türkçe ürün adı (en fazla 6 kelime; marka tahmini yapma)",
  "aciklama": "müşteriye hitap eden, abartısız, 2-3 cümlelik Türkçe ürün açıklaması",
  "ozellikler": ["3-5 kısa madde: malzeme, boyut/kullanım, öne çıkan özellik; emin olmadığını yazma"],
  "kategori": "mevcut kategorilerden en uygun olanın TAM adı: ${cats}. Hiçbiri mantıklı şekilde uymuyorsa kısa yeni bir kategori adı öner",
  "cinsiyet": "KADIN, ERKEK ya da UNISEX",
  "kime": [bu ürünü kime hediye etmek uygun? yalnızca şu anahtarlar: ${RECIPIENTS.map((r) => r.key).join(", ")}],
  "hobiler": [en fazla 3, yalnızca şu anahtarlar: ${HOBBIES.map((h) => h.key).join(", ")}],
  "ozelGunler": [uygun olduğu özel günler, yalnızca şu anahtarlar: ${OCCASIONS.map((o) => o.key).join(", ")}],
  "etiketler": ["5-8 kısa Türkçe anahtar kelime, küçük harf (ör. romantik, kişiye özel, el örgüsü)"],
  "altMetinler": [${facts.imageCount > 0 ? `her fotoğraf için sırayla kısa Türkçe açıklama (en fazla 20 kelime), toplam ${facts.imageCount} adet` : ""}]
}`;
}

const Raw = z.object({
  urunAdi: z.string().optional(),
  aciklama: z.string().optional(),
  ozellikler: z.array(z.string()).optional(),
  kategori: z.string().optional(),
  cinsiyet: z.string().optional(),
  kime: z.array(z.string()).optional(),
  hobiler: z.array(z.string()).optional(),
  ozelGunler: z.array(z.string()).optional(),
  etiketler: z.array(z.string()).optional(),
  altMetinler: z.array(z.string()).optional(),
  // Eski tek fotoğraflık biçim
  altMetin: z.string().optional(),
});

const clean = (s: string | undefined, max: number) => {
  const t = s?.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : undefined;
};
const trLower = (s: string) => s.toLocaleLowerCase("tr-TR").trim();
const onlyKeys = (list: string[] | undefined, keys: readonly { key: string }[]) => {
  const allowed = new Set(keys.map((k) => k.key));
  return [...new Set((list ?? []).filter((k) => allowed.has(k)))];
};

export function parseAiSuggestion(text: string, categories: Category[]): AiSuggestion | null {
  const r = Raw.safeParse(extractJson(text));
  if (!r.success) return null;
  const v = r.data;
  const gender = v.cinsiyet?.toUpperCase().trim();

  let categoryId: string | undefined;
  let newCategoryName: string | undefined;
  const catName = clean(v.kategori, 60);
  if (catName) {
    const match = categories.find((c) => trLower(c.name) === trLower(catName));
    if (match) categoryId = match.id;
    else newCategoryName = catName;
  }

  return {
    name: clean(v.urunAdi, 120),
    description: v.aciklama?.trim().slice(0, 1000) || undefined,
    features: (v.ozellikler ?? []).map((f) => clean(f, 120)).filter((f): f is string => !!f).slice(0, 6),
    categoryId,
    newCategoryName,
    gender: gender === "KADIN" || gender === "ERKEK" || gender === "UNISEX" ? gender : undefined,
    recipients: onlyKeys(v.kime, RECIPIENTS),
    hobbies: onlyKeys(v.hobiler, HOBBIES).slice(0, 3),
    occasions: onlyKeys(v.ozelGunler, OCCASIONS),
    tags: [...new Set((v.etiketler ?? []).map((t) => clean(trLower(t), 40)).filter((t): t is string => !!t))].slice(0, 10),
    alts: (v.altMetinler ?? (v.altMetin ? [v.altMetin] : [])).map((a) => clean(a, 200) ?? ""),
  };
}
