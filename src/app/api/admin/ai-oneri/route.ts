import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { AiError, askVisionModel, buildPrompt, DEFAULT_AI_MODEL, parseAiSuggestion, type AiSuggestion } from "@/lib/ai/product-vision";
import { adminOrNull } from "@/lib/auth";
import { db } from "@/lib/db";

const Body = z.object({ imageUrl: z.string().max(1000) });

export type AiOneriResponse = { suggestion: AiSuggestion; model: string } | { error: string };

const BLOB_HOST = /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;
const MIME: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

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

export async function POST(request: Request): Promise<Response> {
  if (!(await adminOrNull())) return Response.json({ error: "Oturum gerekli" }, { status: 401 });
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY tanımlı değil" } satisfies AiOneriResponse, { status: 503 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Geçersiz istek" } satisfies AiOneriResponse, { status: 400 });

  try {
    const [settings, categories] = await Promise.all([
      db.settings.findUnique({ where: { id: 1 }, select: { aiModel: true } }),
      db.category.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    const { text, model } = await askVisionModel({
      apiKey,
      model: settings?.aiModel || DEFAULT_AI_MODEL,
      prompt: buildPrompt(categories),
      imageUrl: await toDataUrl(parsed.data.imageUrl),
    });
    const suggestion = parseAiSuggestion(text, categories);
    if (!suggestion) return Response.json({ error: "Modelin cevabı anlaşılamadı, tekrar dene" } satisfies AiOneriResponse, { status: 502 });
    return Response.json({ suggestion, model } satisfies AiOneriResponse);
  } catch (e) {
    const message = e instanceof AiError ? e.message : "Öneri alınamadı";
    if (!(e instanceof AiError)) console.error("ai-oneri", e);
    return Response.json({ error: message } satisfies AiOneriResponse, { status: 502 });
  }
}
