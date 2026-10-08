// Hediş'in yapay zeka sohbeti: katalog özeti, sistem istemi ve model cevabının doğrulanması.
// Saf fonksiyonlar; ağ çağrısı ve veritabanı route'ta.
import { z } from "zod";
import { extractJson } from "../ai/client";
import { HOBBIES, OCCASIONS, RECIPIENTS, type BudgetKey } from "./config";
import type { HedisAnswers } from "./recommend";

export const MAX_TURNS = 14;
export const MAX_MESSAGE_CHARS = 600;
export const MAX_PICKS = 5;
/** İlk öneriden önce sorulabilecek en fazla soru sayısı */
export const MAX_QUESTIONS = 2;

export type ChatTurn = { role: "user" | "assistant"; text: string };

export type CatalogItem = {
  id: string;
  name: string;
  category: string | null;
  priceKurus: number;
  recipients: string[];
  gender: string;
  hobbies: string[];
  occasions: string[];
  tags: string[];
  description: string;
};

/** Modelin bağlamı için kısa katalog satırları (her ürün tek satır). */
export function catalogText(items: CatalogItem[]): string {
  return items
    .map((p) =>
      [
        p.id,
        p.name,
        p.category ?? "-",
        `${Math.round(p.priceKurus / 100)} TL`,
        `kime:${p.recipients.join(",") || "-"}`,
        `cinsiyet:${p.gender}`,
        `ilgi:${p.hobbies.join(",") || "-"}`,
        `gün:${p.occasions.join(",") || "-"}`,
        `etiket:${p.tags.join(",") || "-"}`,
        p.description.replace(/\s+/g, " ").slice(0, 140),
      ].join(" | "),
    )
    .join("\n");
}

export function systemPrompt(catalog: string, productCount: number): string {
  return `Sen "Hediş"sin: hediyelik ürünler satan hediyegetir'in sıcak, samimi hediye asistanı. Türkçe ve "sen" diliyle konuş.
Görevin: kullanıcıyı bir form doldurtmadan, sohbetle tanıyıp katalogdan en uygun hediyeleri bulmak.

Kurallar:
- Her mesajın kısa olsun (en fazla 2 cümle). Abartılı övgü ve emoji kullanma.
- Her turda EN FAZLA BİR soru sor. Soruların kişiye ve kataloğa göre özgün olsun; aynı kalıbı herkese sorma.
  Örnek yönler: hediye alınan kişiyle ilişki, özel gün, bütçe, kişinin zevki/yaşam tarzı, kullanışlı mı duygusal mı hediye istediği.
- Öneriden önce EN FAZLA ${MAX_QUESTIONS} soru sor; ${MAX_QUESTIONS}. sorunun cevabı gelince artık soru sorma, mutlaka öner. Kullanıcı yeterince bilgi verdiyse ya da önerileri görmek isterse hiç soru sormadan hemen öner.
- Bilmediğin ayrıntıları (bütçe, zevk) soru sormak yerine makul varsayımla tamamla; öneri sonrası kullanıcı isterse daraltırsın.
- Yalnızca aşağıdaki katalogdaki ürünleri öner; id'leri aynen kullan. Bütçe verildiyse ona uy (en fazla %20 aşabilir, aşıyorsa nedeninde söyle).
- Önerirken 1-${MAX_PICKS} ürün seç, en uygun olan önce. Her biri için bu kişiye NEDEN uygun olduğunu tek kısa cümleyle yaz.
- Kullanıcı daha önce gösterdiğin ürünler hakkında bir şey sorarsa (fiyat, ölçü, renk, malzeme, kargo, hangisi daha iyi gibi) yalnızca yazıyla cevap ver: "oneriler" boş, "asama" "sohbet" olsun. Gösterdiğin ürünler geçmişte "[Önerdiğim ürünler: …]" olarak yazılı.
- Ürün kartlarını yalnızca YENİ ürün önerirken ya da kullanıcı başka/farklı seçenek isteyince göster. Mesajında daha önce göstermediğin bir ürünün adı geçiyorsa onu "oneriler"e ekle.
- Katalogda uygun ürün yoksa dürüstçe söyle ve en yakın seçenekleri öner.
- Kullanıcı konu dışı bir şey isterse kibarca hediye aramaya geri dön.

Anahtar listeleri:
kime: ${RECIPIENTS.map((r) => r.key).join(", ")}
ilgiler: ${HOBBIES.map((h) => h.key).join(", ")}
özel günler: ${OCCASIONS.map((o) => o.key).join(", ")}

Katalog (${productCount} ürün; id | ad | kategori | fiyat | kime | cinsiyet | ilgi | özel gün | etiket | açıklama):
${catalog}

YALNIZCA şu JSON'u döndür:
{
  "mesaj": "kullanıcıya söyleyeceğin kısa metin",
  "secenekler": ["kullanıcının tıklayabileceği 2-5 kısa hazır cevap (en fazla 5 kelime)"],
  "asama": "soru", "oneri" ya da "sohbet" (ürün göstermeden yalnızca cevap),
  "profil": {
    "kime": "kime anahtarı ya da null",
    "kimeMetin": "kullanıcının kendi ifadesiyle kısa (ör. yeni işe başlayan kız arkadaşı) ya da null",
    "cinsiyet": "KADIN, ERKEK ya da null",
    "butceMaxTL": sayı ya da null,
    "ozelGun": "özel gün anahtarı ya da null",
    "ilgiler": [ilgi anahtarları]
  },
  "oneriler": [{"id": "katalogdaki ürün id", "neden": "tek kısa cümle"}]
}`;
}

const Raw = z.object({
  mesaj: z.string(),
  secenekler: z.array(z.string()).optional(),
  asama: z.string().optional(),
  profil: z
    .object({
      kime: z.string().nullish(),
      kimeMetin: z.string().nullish(),
      cinsiyet: z.string().nullish(),
      butceMaxTL: z.number().nullish(),
      ozelGun: z.string().nullish(),
      ilgiler: z.array(z.string()).nullish(),
    })
    .partial()
    .optional(),
  oneriler: z.array(z.object({ id: z.string(), neden: z.string().optional() })).optional(),
});

export type ChatProfile = {
  recipient: string | null;
  recipientText: string | null;
  gender: "KADIN" | "ERKEK" | null;
  budgetMaxKurus: number | null;
  occasion: string | null;
  hobbies: string[];
};

export type ChatReply = {
  message: string;
  quickReplies: string[];
  stage: "question" | "recommend";
  profile: ChatProfile;
  picks: { id: string; reason: string }[];
};

const clean = (s: string | null | undefined, max: number) => s?.replace(/\s+/g, " ").trim().slice(0, max) || null;
const allowed = (keys: readonly { key: string }[]) => new Set(keys.map((k) => k.key));

/** Modelin cevabını doğrular: bilinmeyen anahtarları ve katalogda olmayan ürünleri atar. */
export function parseChatReply(text: string, validIds: Set<string>): ChatReply | null {
  const r = Raw.safeParse(extractJson(text));
  if (!r.success) return null;
  const v = r.data;
  const message = clean(v.mesaj, 600);
  if (!message) return null;

  const p = v.profil ?? {};
  const recipient = p.kime && allowed(RECIPIENTS).has(p.kime) ? p.kime : null;
  const occasion = p.ozelGun && allowed(OCCASIONS).has(p.ozelGun) ? p.ozelGun : null;
  const gender = p.cinsiyet === "KADIN" || p.cinsiyet === "ERKEK" ? p.cinsiyet : null;
  const hobbyKeys = allowed(HOBBIES);

  const seen = new Set<string>();
  const picks = (v.oneriler ?? [])
    .filter((o) => validIds.has(o.id) && !seen.has(o.id) && seen.add(o.id))
    .slice(0, MAX_PICKS)
    .map((o) => ({ id: o.id, reason: clean(o.neden, 200) ?? "" }));

  return {
    message,
    quickReplies: [...new Set((v.secenekler ?? []).map((s) => clean(s, 40)).filter((s): s is string => !!s))].slice(0, 5),
    stage: v.asama === "oneri" || picks.length > 0 ? "recommend" : "question",
    profile: {
      recipient,
      recipientText: clean(p.kimeMetin, 80),
      gender,
      budgetMaxKurus: typeof p.butceMaxTL === "number" && p.butceMaxTL > 0 ? Math.round(p.butceMaxTL * 100) : null,
      occasion,
      hobbies: [...new Set((p.ilgiler ?? []).filter((h) => hobbyKeys.has(h)))].slice(0, 3),
    },
    picks,
  };
}

export function budgetKeyFor(maxKurus: number | null): BudgetKey | undefined {
  if (maxKurus == null) return undefined;
  if (maxKurus <= 50_000) return "0-500";
  if (maxKurus <= 100_000) return "500-1000";
  return "1000+";
}

/** AI ürün seçemediğinde kural tabanlı motora verilecek cevaplar. */
export function profileToAnswers(p: ChatProfile, { anyRecipient = false } = {}): HedisAnswers | null {
  if (!p.recipient && !anyRecipient) return null;
  return {
    recipient: p.recipient ?? "diger",
    gender: p.gender,
    budget: budgetKeyFor(p.budgetMaxKurus),
    hobbies: p.hobbies,
    occasion: p.occasion ?? undefined,
  };
}

/** Önerilen ürün listesi istemcide asistan mesajının sonuna bu işaretle eklenir */
export const PICKS_MARKER = "[Önerdiğim ürünler:";

/**
 * Henüz hiç ürün önerilmediyse Hediş'in kaç soru sorduğu (asistan mesajı sayısı). Öneri yapıldıysa null:
 * sonrası serbest sohbet, soru sınırı yalnızca ilk öneriye kadar geçerli.
 */
export function questionsBeforeFirstPick(turns: ChatTurn[]): number | null {
  const assistant = turns.filter((t) => t.role === "assistant");
  if (assistant.some((t) => t.text.includes(PICKS_MARKER))) return null;
  return assistant.length;
}

/** Soru sınırı doldu mu: bu turda soru yerine mutlaka öneri yapılmalı */
export function mustRecommend(turns: ChatTurn[]): boolean {
  const asked = questionsBeforeFirstPick(turns);
  return asked != null && asked >= MAX_QUESTIONS;
}

/** İstemciden gelen geçmişi temizler: boş/uzun mesajları kırpar, son MAX_TURNS turu alır. */
export function sanitizeTurns(turns: ChatTurn[]): ChatTurn[] {
  return turns
    .map((t) => ({ role: t.role, text: t.text.trim().slice(0, MAX_MESSAGE_CHARS) }))
    .filter((t) => t.text.length > 0)
    .slice(-MAX_TURNS);
}
