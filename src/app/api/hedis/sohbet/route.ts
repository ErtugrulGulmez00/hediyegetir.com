import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { getAiModel } from "@/lib/ai/analyze";
import { AiError, aiConfigured, askModel, type ChatMessage } from "@/lib/ai/client";
import { db } from "@/lib/db";
import {
  catalogText,
  MAX_MESSAGE_CHARS,
  MAX_TURNS,
  parseChatReply,
  profileToAnswers,
  sanitizeTurns,
  systemPrompt,
  type ChatProfile,
} from "@/lib/hedis/ai-chat";
import { recommend } from "@/lib/hedis/recommend";

const Body = z.object({
  turns: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(MAX_MESSAGE_CHARS * 2) }))
    .min(1)
    .max(MAX_TURNS * 2),
});

export type HedisProduct = {
  id: string;
  slug: string;
  name: string;
  priceKurus: number;
  compareAtPriceKurus: number | null;
  stock: number | null;
  category: { name: string; slug: string } | null;
  images: { url: string; alt: string }[];
  reasons: string[];
};

export type HedisChatResponse =
  | {
      message: string;
      quickReplies: string[];
      stage: "question" | "recommend";
      profile: ChatProfile;
      products: HedisProduct[];
      catalogSize: number;
    }
  | { error: string };

/** IP başına 10 dakikada en fazla bu kadar istek */
const PER_IP_LIMIT = 30;
const WINDOW_MS = 10 * 60_000;
/** Tüm ziyaretçiler için günlük üst sınır (bakiyeyi korur) */
const DAILY_LIMIT = Number(process.env.HEDIS_DAILY_LIMIT) || 1500;
const CATALOG_LIMIT = 150;

const json = (body: HedisChatResponse, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

async function rateLimited(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "yerel";
  const key = createHash("sha256").update(`hedis:${ip}`).digest("hex").slice(0, 32);
  const now = Date.now();
  const [mine, today] = await Promise.all([
    db.aiRequest.count({ where: { kind: "hedis", key, createdAt: { gte: new Date(now - WINDOW_MS) } } }),
    db.aiRequest.count({ where: { kind: "hedis", createdAt: { gte: new Date(now - 86_400_000) } } }),
  ]);
  if (mine >= PER_IP_LIMIT) return "Biraz hızlı gittik; birkaç dakika sonra devam edelim.";
  if (today >= DAILY_LIMIT) return "Hediş bugün çok yoğun. Ürünlere göz atabilir ya da yarın tekrar deneyebilirsin.";
  await db.aiRequest.create({ data: { kind: "hedis", key } });
  if (Math.random() < 0.02) await db.aiRequest.deleteMany({ where: { createdAt: { lt: new Date(now - 2 * 86_400_000) } } });
  return null;
}

export async function POST(request: Request): Promise<Response> {
  if (!aiConfigured()) return json({ error: "Hediş şu an çevrim dışı." }, 503);
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Geçersiz istek" }, 400);
  const turns = sanitizeTurns(parsed.data.turns);
  if (turns.length === 0 || turns[turns.length - 1].role !== "user") return json({ error: "Geçersiz istek" }, 400);

  const limited = await rateLimited();
  if (limited) return json({ error: limited }, 429);

  const products = await db.product.findMany({
    where: { isActive: true, OR: [{ stock: null }, { stock: { gt: 0 } }] },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: CATALOG_LIMIT,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      priceKurus: true,
      compareAtPriceKurus: true,
      stock: true,
      recipients: true,
      gender: true,
      hobbies: true,
      occasions: true,
      tags: true,
      isFeatured: true,
      categoryId: true,
      createdAt: true,
      category: { select: { name: true, slug: true } },
      images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  try {
    const catalog = catalogText(products.map((p) => ({ ...p, category: p.category?.name ?? null })));
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt(catalog, products.length) },
      ...turns.map((t) => ({ role: t.role, content: t.text })),
    ];
    const { text } = await askModel({ model: await getAiModel(), messages });
    const reply = parseChatReply(text, new Set(byId.keys()));
    if (!reply) return json({ error: "Hediş bir an dalgınlaştı; tekrar yazar mısın?" }, 502);

    let picks = reply.picks.map((p) => ({ id: p.id, reasons: p.reason ? [p.reason] : [] }));
    // AI öneri aşamasına geçti ama geçerli ürün seçemediyse kural tabanlı motorla doldur
    if (reply.stage === "recommend" && picks.length === 0) {
      const answers = profileToAnswers(reply.profile);
      if (answers) picks = recommend(products, answers).items.map((i) => ({ id: i.id, reasons: i.reasons }));
    }

    const cards: HedisProduct[] = picks.map(({ id, reasons }) => {
      const p = byId.get(id)!;
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        priceKurus: p.priceKurus,
        compareAtPriceKurus: p.compareAtPriceKurus,
        stock: p.stock,
        category: p.category,
        images: p.images,
        reasons,
      };
    });

    return json({
      message: reply.message,
      quickReplies: reply.quickReplies,
      stage: cards.length > 0 ? "recommend" : "question",
      profile: reply.profile,
      products: cards,
      catalogSize: products.length,
    });
  } catch (e) {
    if (!(e instanceof AiError)) console.error("hedis-sohbet", e);
    return json({ error: "Hediş şu an cevap veremiyor; birazdan tekrar dener misin?" }, 502);
  }
}
