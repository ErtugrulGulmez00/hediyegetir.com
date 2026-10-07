// Ürün fotoğrafından ad, kategori, açıklama ve Hediş etiketi önerisi (OpenRouter, görüntü destekli model).
// İstem ve cevap ayrıştırma saf fonksiyonlardır; ağ çağrısı ayrı.
import { z } from "zod";
import { HOBBIES, RECIPIENTS, type GenderKey } from "../hedis/config";

export const DEFAULT_AI_MODEL = "dots-studio/dots-3-note-preview:free";

/** Ücretsiz modeller sık sık meşgul olur; OpenRouter bunları sırayla dener. */
const FREE_FALLBACKS = ["dots-studio/dots-3-note-preview:free", "google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free"];

export type Category = { id: string; name: string };

export type AiSuggestion = {
  name?: string;
  description?: string;
  categoryId?: string;
  /** Model mevcut olmayan bir kategori önerdiyse adı (admin isterse ekler) */
  newCategoryName?: string;
  gender?: GenderKey;
  recipients: string[];
  hobbies: string[];
  alt?: string;
};

export function buildPrompt(categories: Category[]): string {
  const cats = categories.length ? categories.map((c) => c.name).join(", ") : "(henüz kategori yok)";
  return `Sen el yapımı ürünler satan bir hediye mağazasının ürün editörüsün. Fotoğraftaki ürünü incele.
YALNIZCA aşağıdaki JSON'u döndür; açıklama, kod bloğu ya da başka metin yazma.
{
  "urunAdi": "kısa, sade Türkçe ürün adı (en fazla 6 kelime)",
  "aciklama": "müşteriye hitap eden, abartısız 2-3 cümlelik Türkçe ürün açıklaması",
  "kategori": "mümkünse şunlardan biri: ${cats}. Hiçbiri uymuyorsa kısa yeni bir kategori adı",
  "cinsiyet": "KADIN, ERKEK ya da UNISEX",
  "kime": [bu ürünü kime hediye etmek uygun? yalnızca şu anahtarlar: ${RECIPIENTS.map((r) => r.key).join(", ")}],
  "hobiler": [en fazla 3, yalnızca şu anahtarlar: ${HOBBIES.map((h) => h.key).join(", ")}],
  "altMetin": "fotoğrafın görme engelli kullanıcılar için kısa Türkçe açıklaması (en fazla 20 kelime)"
}`;
}

const Raw = z.object({
  urunAdi: z.string().optional(),
  aciklama: z.string().optional(),
  kategori: z.string().optional(),
  cinsiyet: z.string().optional(),
  kime: z.array(z.string()).optional(),
  hobiler: z.array(z.string()).optional(),
  altMetin: z.string().optional(),
});

/** Modelin metninden ilk geçerli JSON nesnesini çıkarır (kod bloğu, düşünme metni vb. içinde olabilir). */
function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  if (start < 0) return null;
  // Dengeli süslü parantezle biten ilk nesneyi bul
  let depth = 0;
  let inString = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      try {
        return JSON.parse(cleaned.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

const clean = (s: string | undefined, max: number) => {
  const t = s?.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : undefined;
};
const trLower = (s: string) => s.toLocaleLowerCase("tr-TR").trim();

export function parseAiSuggestion(text: string, categories: Category[]): AiSuggestion | null {
  const r = Raw.safeParse(extractJson(text));
  if (!r.success) return null;
  const v = r.data;

  const recipientKeys = new Set(RECIPIENTS.map((x) => x.key));
  const hobbyKeys = new Set(HOBBIES.map((x) => x.key));
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
    categoryId,
    newCategoryName,
    gender: gender === "KADIN" || gender === "ERKEK" || gender === "UNISEX" ? gender : undefined,
    recipients: [...new Set((v.kime ?? []).filter((k) => recipientKeys.has(k)))],
    hobbies: [...new Set((v.hobiler ?? []).filter((k) => hobbyKeys.has(k)))].slice(0, 3),
    alt: clean(v.altMetin, 200),
  };
}

export class AiError extends Error {}

/** Görseli modele gönderir, ham metin cevabı döner. imageUrl: https adresi ya da data: URL. */
export async function askVisionModel(opts: {
  apiKey: string;
  model: string;
  prompt: string;
  imageUrl: string;
  timeoutMs?: number;
}): Promise<{ text: string; model: string }> {
  const models = opts.model.endsWith(":free")
    ? [opts.model, ...FREE_FALLBACKS.filter((m) => m !== opts.model)]
    : [opts.model];
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hediyegetir.com",
        "X-Title": "hediyegetir",
      },
      body: JSON.stringify({
        model: models[0],
        models,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: opts.prompt },
              { type: "image_url", image_url: { url: opts.imageUrl } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 90_000),
    });
  } catch (e) {
    throw new AiError(e instanceof Error && e.name === "TimeoutError" ? "Model zamanında yanıt vermedi" : "OpenRouter'a ulaşılamadı");
  }
  const json = (await res.json().catch(() => null)) as {
    model?: string;
    choices?: { message?: { content?: string } }[];
    error?: { message?: string; code?: number };
  } | null;
  const text = json?.choices?.[0]?.message?.content;
  if (!res.ok || !text) {
    const msg = json?.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 429 || /rate-limit|temporarily/i.test(msg)) throw new AiError("Ücretsiz modeller şu an meşgul, birazdan tekrar dene");
    if (res.status === 401) throw new AiError("OpenRouter anahtarı geçersiz");
    if (res.status === 402) throw new AiError("OpenRouter kredisi yetersiz");
    throw new AiError(`Model yanıt veremedi (${msg.slice(0, 120)})`);
  }
  return { text, model: json?.model ?? models[0] };
}
