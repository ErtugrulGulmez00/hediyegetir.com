// Yapay zeka çağrıları için ortak istemci (OpenAI ya da OpenRouter, sohbet tamamlama API'si).
// Ürün analizi ve Hediş sohbeti bunu kullanır.

// Hız/maliyet/Türkçe kalite karşılaştırmasında en iyisi (≈2,7 sn, ≈0,00015 $ / fotoğraf)
export const DEFAULT_AI_MODEL = "gpt-6-luna";

/** OpenRouter ücretsiz modelleri sık sık meşgul olur; OpenRouter bunları sırayla dener. */
const FREE_FALLBACKS = ["dots-studio/dots-3-note-preview:free", "google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free"];

export class AiError extends Error {}

export type AiProvider = "openai" | "openrouter";

/** Model adında "/" varsa OpenRouter (ör. "google/gemma-4-31b-it:free"), yoksa doğrudan OpenAI (ör. "gpt-6-luna"). */
export function providerOf(model: string): AiProvider {
  return model.includes("/") ? "openrouter" : "openai";
}

function apiKeyFor(provider: AiProvider): string | undefined {
  return provider === "openai" ? process.env.OPENAI_API_KEY : process.env.OPENROUTER_API_KEY;
}

/** Herhangi bir yapay zeka anahtarı varsa AI özellikleri açılır. */
export const aiConfigured = () => !!(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY);

/** Tekrar denemekle düzelmeyecek hata (anahtar yok/geçersiz, bakiye bitti, model yok) */
export const isPersistentAiError = (e: unknown) =>
  e instanceof AiError && /anahtar|bakiye|tanımlı değil|bulunamadı/i.test(e.message);

/**
 * OpenAI akıl yürütme modellerinde düşünme süresini kapatır (bu işler için gereksiz, yalnızca yavaşlatır).
 * İlk GPT-5 ailesi "minimal", sonrakiler "none" kabul eder.
 */
function reasoningEffort(model: string): string | undefined {
  if (/^gpt-5-(nano|mini)|^gpt-5$/.test(model)) return "minimal";
  if (/^gpt-(5\.|6)/.test(model)) return "none";
  return undefined;
}

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "low" } };
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string | Part[] };

/** Metin + (isteğe bağlı) görsellerden oluşan kullanıcı mesajı. Görseller https ya da data: URL. */
export function userMessage(text: string, imageUrls: string[] = []): ChatMessage {
  if (imageUrls.length === 0) return { role: "user", content: text };
  return {
    role: "user",
    content: [
      { type: "text", text },
      // "low": görsel 512 px'e küçültülür; kategori/etiket için yeterli, daha hızlı ve ucuz
      ...imageUrls.map((url) => ({ type: "image_url" as const, image_url: { url, detail: "low" as const } })),
    ],
  };
}

/** Modelden JSON cevap ister, ham metni döner (ayrıştırma çağıranın işi). */
export async function askModel(opts: {
  model: string;
  messages: ChatMessage[];
  timeoutMs?: number;
}): Promise<{ text: string; model: string }> {
  const provider = providerOf(opts.model);
  const apiKey = apiKeyFor(provider);
  if (!apiKey) throw new AiError(provider === "openai" ? "OPENAI_API_KEY tanımlı değil" : "OPENROUTER_API_KEY tanımlı değil");

  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;
  if (provider === "openai") {
    url = "https://api.openai.com/v1/chat/completions";
    headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
    const effort = reasoningEffort(opts.model);
    body = {
      model: opts.model,
      response_format: { type: "json_object" },
      messages: opts.messages,
      ...(effort ? { reasoning_effort: effort } : { temperature: 0.3 }),
    };
  } else {
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://hediyegetir.com",
      "X-Title": "hediyegetir",
    };
    const models = opts.model.endsWith(":free") ? [opts.model, ...FREE_FALLBACKS.filter((m) => m !== opts.model)] : [opts.model];
    body = { model: models[0], models, temperature: 0.3, messages: opts.messages };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? (provider === "openai" ? 30_000 : 90_000)),
    });
  } catch (e) {
    throw new AiError(e instanceof Error && e.name === "TimeoutError" ? "Model zamanında yanıt vermedi" : "Yapay zeka servisine ulaşılamadı");
  }
  const json = (await res.json().catch(() => null)) as {
    model?: string;
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  } | null;
  const text = json?.choices?.[0]?.message?.content;
  if (!res.ok || !text) {
    const msg = json?.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 401) throw new AiError("Yapay zeka anahtarı geçersiz");
    if (res.status === 402 || /insufficient_quota|exceeded your current quota|credit/i.test(msg))
      throw new AiError("Yapay zeka hesabında bakiye kalmadı");
    if (res.status === 429 || /rate-limit|temporarily/i.test(msg)) throw new AiError("Model şu an meşgul, birazdan tekrar dene");
    if (res.status === 404 || /model.*(not exist|not found)/i.test(msg)) throw new AiError(`"${opts.model}" modeli bulunamadı; Ayarlar'dan kontrol et`);
    throw new AiError(`Model yanıt veremedi (${msg.slice(0, 120)})`);
  }
  return { text, model: json?.model ?? opts.model };
}

/** Modelin metninden ilk geçerli JSON nesnesini çıkarır (kod bloğu, düşünme metni vb. içinde olabilir). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  if (start < 0) return null;
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
