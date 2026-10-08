import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../db";
import { AiError, askModel, DEFAULT_AI_MODEL, userMessage } from "./client";
import { buildPrompt, parseAiSuggestion, type AiSuggestion } from "./product-vision";

const BLOB_HOST = /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;
const MIME: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
/** Modele en fazla bu kadar fotoğraf gönderilir (hız ve maliyet) */
export const MAX_AI_IMAGES = 3;

/** Yalnızca kendi yüklediğimiz görselleri okur (başka adreslere istek atmak için kullanılamasın). */
async function toDataUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith("/uploads/")) {
    const file = path.join(process.cwd(), "public", "uploads", path.basename(imageUrl));
    const mime = MIME[path.extname(file).toLowerCase()] ?? "image/webp";
    return `data:${mime};base64,${(await readFile(file)).toString("base64")}`;
  }
  const url = new URL(imageUrl);
  if (url.protocol !== "https:" || !BLOB_HOST.test(url.hostname)) throw new AiError("Bu görsel adresi desteklenmiyor");
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new AiError("Görsel okunamadı");
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/webp";
  return `data:${mime};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
}

export async function getAiModel(): Promise<string> {
  const s = await db.settings.findUnique({ where: { id: 1 }, select: { aiModel: true } });
  return s?.aiModel || DEFAULT_AI_MODEL;
}

/** Ürün bilgileri + fotoğraflardan öneri üretir. Fotoğraf yoksa yalnızca metinle çalışır. */
export async function analyzeProduct(input: {
  name: string;
  description: string;
  priceKurus: number | null;
  imageUrls: string[];
}): Promise<{ suggestion: AiSuggestion; model: string }> {
  const imageUrls = input.imageUrls.slice(0, MAX_AI_IMAGES);
  if (imageUrls.length === 0 && !input.name.trim() && !input.description.trim()) {
    throw new AiError("Analiz için en az bir fotoğraf ya da ürün adı gerekli");
  }
  const [model, categories, images] = await Promise.all([
    getAiModel(),
    db.category.findMany({ select: { id: true, name: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    Promise.all(imageUrls.map(toDataUrl)),
  ]);
  const prompt = buildPrompt(categories, { ...input, imageCount: images.length });
  const res = await askModel({ model, messages: [userMessage(prompt, images)] });
  const suggestion = parseAiSuggestion(res.text, categories);
  if (!suggestion) throw new AiError("Modelin cevabı anlaşılamadı, tekrar dene");
  return { suggestion, model: res.model };
}
