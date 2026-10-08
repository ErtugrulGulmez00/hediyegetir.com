import { z } from "zod";
import { analyzeProduct, MAX_AI_IMAGES } from "@/lib/ai/analyze";
import { AiError, aiConfigured } from "@/lib/ai/client";
import type { AiSuggestion } from "@/lib/ai/product-vision";
import { adminOrNull } from "@/lib/auth";

const Body = z.object({
  name: z.string().max(200).default(""),
  description: z.string().max(5000).default(""),
  priceKurus: z.number().int().positive().nullable().default(null),
  imageUrls: z.array(z.string().max(1000)).max(12).default([]),
});

export type AiOneriRequest = z.input<typeof Body>;
export type AiOneriResponse = { suggestion: AiSuggestion; model: string; analyzedImages: string[] } | { error: string };

export async function POST(request: Request): Promise<Response> {
  if (!(await adminOrNull())) return Response.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!aiConfigured()) return Response.json({ error: "Yapay zeka anahtarı tanımlı değil" } satisfies AiOneriResponse, { status: 503 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Geçersiz istek" } satisfies AiOneriResponse, { status: 400 });

  try {
    const imageUrls = parsed.data.imageUrls.slice(0, MAX_AI_IMAGES);
    const { suggestion, model } = await analyzeProduct({ ...parsed.data, imageUrls });
    return Response.json({ suggestion, model, analyzedImages: imageUrls } satisfies AiOneriResponse);
  } catch (e) {
    if (!(e instanceof AiError)) console.error("ai-oneri", e);
    const message = e instanceof AiError ? e.message : "Öneri alınamadı";
    return Response.json({ error: message } satisfies AiOneriResponse, { status: 502 });
  }
}
