"use client";

import { useEffect, useRef, useState } from "react";
import type { HedisChatResponse, HedisProduct } from "@/app/api/hedis/sohbet/route";
import { PICKS_MARKER, type ChatProfile, type ChatTurn } from "@/lib/hedis/ai-chat";
import { occasionByKey, recipientByKey } from "@/lib/hedis/config";
import { formatPrice } from "@/lib/money";
import type { MascotMood } from "./Mascot";
import {
  HedisActions,
  MentionedProducts,
  HedisHeader,
  HedisNote,
  HedisWelcome,
  OptionTag,
  OptionTags,
  readLastRecipient,
  Results,
  STARTERS,
  ThinkingDots,
  UserBubble,
  writeLastRecipient,
} from "./HedisParts";

type Entry = ChatTurn & { products?: HedisProduct[]; quickReplies?: string[]; profile?: ChatProfile; catalogSize?: number };

const THINKING = ["Seni dinliyorum…", "Katalogdaki ürünlere bakıyorum…", "Sana uygun olanları seçiyorum…"];

/** Modele giden geçmiş: önerilen ürünler asistan mesajına eklenir ki aynılarını tekrar önermesin */
function toTurns(entries: Entry[]): ChatTurn[] {
  return entries.map((e) =>
    e.role === "assistant" && e.products?.length
      ? { role: "assistant", text: `${e.text} ${PICKS_MARKER} ${e.products.map((p) => `${p.name} (${p.id})`).join(", ")}]` }
      : { role: e.role, text: e.text },
  );
}

export function HedisChat({
  onBrowseShop,
  onFallback,
}: {
  onBrowseShop: () => void;
  /** Yapay zekaya ulaşılamıyor: seçenekli rehber moda geç (bilinen kişiyle) */
  onFallback: (recipient: string | null) => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingLine, setThinkingLine] = useState(0);
  const [returning, setReturning] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // Hediye alınacak kişi (seçilen başlangıç ya da Hediş'in anladığı); rehber moda geçerken taşınır
  const recipientRef = useRef<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage yalnızca mount sonrası okunabilir
    setReturning(readLastRecipient());
  }, []);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setThinkingLine((n) => (n + 1) % THINKING.length), 1400);
    return () => clearInterval(id);
  }, [loading]);

  // Yeni mesajda görünür alana kaydır
  useEffect(() => {
    if (entries.length === 0 && !loading) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length, loading]);

  async function send(text: string, history = entries) {
    const clean = text.trim();
    if (!clean || loading) return;
    const next: Entry[] = [...history, { role: "user", text: clean }];
    setEntries(next);
    setDraft("");
    setError(null);
    setLoading(true);
    setThinkingLine(0);
    try {
      const res = await fetch("/api/hedis/sohbet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ turns: toTurns(next) }),
      });
      // Yapay zeka kapalı, bakiye bitti ya da istek sınırı doldu: seçeneklerle devam
      if (res.status === 503 || res.status === 429) {
        onFallback(recipientRef.current);
        return;
      }
      const data = (await res.json().catch(() => ({ error: "Bağlantı sorunu" }))) as HedisChatResponse;
      if ("error" in data) {
        setError(data.error);
        return;
      }
      setEntries([
        ...next,
        {
          role: "assistant",
          text: data.message,
          products: data.products,
          quickReplies: data.quickReplies,
          profile: data.profile,
          catalogSize: data.catalogSize,
        },
      ]);
      if (data.profile.recipient) recipientRef.current = data.profile.recipient;
      const who = data.profile.recipientText ?? (data.profile.recipient ? recipientByKey(data.profile.recipient)?.label : null);
      if (who) writeLastRecipient(who);
    } catch {
      setError("Bağlantı sorunu; tekrar dener misin?");
    } finally {
      setLoading(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  const retry = () => {
    const lastUser = [...entries].reverse().find((e) => e.role === "user");
    if (!lastUser) return;
    void send(lastUser.text, entries.slice(0, entries.lastIndexOf(lastUser)));
  };

  const restart = () => {
    setEntries([]);
    setError(null);
    setDraft("");
    recipientRef.current = null;
    inputRef.current?.focus();
  };

  // Her mesajdan önce kartı gösterilmiş ürünler
  const shownBefore: Set<string>[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    shownBefore.push(new Set(seen));
    e.products?.forEach((p) => seen.add(p.id));
  }

  const last = entries[entries.length - 1];
  const lastAssistant = [...entries].reverse().find((e) => e.role === "assistant");
  const started = entries.length > 0;
  const quickReplies = !started ? null : !loading && last?.role === "assistant" ? (last.quickReplies ?? []) : [];
  const mood: MascotMood = loading ? "thinking" : lastAssistant?.products?.length ? "happy" : "talking";

  const greeting = returning
    ? `Yine hoş geldin! Geçen sefer ${returning} için bakmıştık. Bu sefer kime hediye arıyoruz?`
    : "Merhaba, ben Hediş! Kime hediye alacağını bana anlat, gerisini birlikte bulalım.";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      {started ? (
        <HedisHeader mood={mood} bumpKey={entries.length} ai />
      ) : (
        <HedisWelcome mood={mood} bumpKey={entries.length} ai>
          <p>{greeting}</p>
          <p className="mt-1.5 text-sm text-murekkep-soluk">
            Bir kişiye dokunabilir ya da kendi cümlenle yazabilirsin: &ldquo;Yeni işe başlayan kız arkadaşıma bir şey arıyorum&rdquo;
            gibi.
          </p>
        </HedisWelcome>
      )}

      {/* Canlı bölge baştan var olsun ki ilk mesajlar da ekran okuyucuya duyurulsun */}
      <ol aria-label="Hediş ile konuşma" aria-live="polite" className={`flex flex-col gap-4 ${started ? "mt-6" : ""}`}>
        {started && (
          <li>
            <HedisNote>
              <p>{greeting}</p>
            </HedisNote>
          </li>
        )}

        {entries.map((e, i) => {
          if (e.role === "user")
            return (
              <li key={i} className="flex justify-end">
                <UserBubble>{e.text}</UserBubble>
              </li>
            );
          // Daha önce kartı gösterilen ürünler katalog olarak tekrar açılmaz, küçük bağlantı olarak anılır
          const fresh = e.products?.filter((p) => !shownBefore[i].has(p.id)) ?? [];
          const repeated = e.products?.filter((p) => shownBefore[i].has(p.id)) ?? [];
          return (
            <li key={i} className="flex flex-col gap-4">
              <HedisNote>
                <p>{e.text}</p>
                {repeated.length > 0 && <MentionedProducts products={repeated} />}
              </HedisNote>
              {fresh.length > 0 && (
                <Results
                  products={fresh}
                  title={e.catalogSize ? `${e.catalogSize} ürün arasından senin için seçtim` : "Senin için seçtim"}
                  chips={profileChips(e.profile)}
                  ai
                />
              )}
            </li>
          );
        })}

        {loading && (
          <li>
            <HedisNote>
              <p className="ai-isilti font-semibold">{THINKING[thinkingLine]}</p>
              <ThinkingDots />
            </HedisNote>
          </li>
        )}

        {error && (
          <li>
            <div role="alert" data-yuzey className="rounded-lg border-l-4 border-kiremit bg-kagit px-4 py-3">
              <p className="font-semibold">{error}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <button type="button" onClick={retry} className="font-semibold underline underline-offset-2">
                  Tekrar dene
                </button>
                <button type="button" onClick={() => onFallback(recipientRef.current)} className="font-semibold underline underline-offset-2">
                  Seçeneklerle devam et
                </button>
                <button type="button" onClick={onBrowseShop} className="font-semibold underline underline-offset-2">
                  Ürünlere göz at
                </button>
              </div>
            </div>
          </li>
        )}
      </ol>
      <div ref={endRef} />

      {/* Hızlı cevaplar: başta kişiler, sonra Hediş'in önerdikleri */}
      {!started ? (
        <div className="mt-6">
          <OptionTags label="Hızlı seçenekler">
            {STARTERS.map((s) => (
              <OptionTag
                key={s.label}
                onClick={() => {
                  if (!s.text) return inputRef.current?.focus();
                  recipientRef.current = s.key;
                  void send(s.text);
                }}
              >
                {s.label}
              </OptionTag>
            ))}
          </OptionTags>
        </div>
      ) : (
        quickReplies &&
        quickReplies.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Hazır cevaplar">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void send(q)}
                className="rounded-full border-[1.5px] border-dashed border-kiremit bg-kagit px-3.5 py-1.5 text-sm font-semibold text-kiremit-koyu transition-colors hover:border-solid hover:bg-kiremit hover:text-kagit"
              >
                {q}
              </button>
            ))}
          </div>
        )
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="sticky bottom-3 z-10 mt-5"
      >
        <div className="ai-kenar" data-calisiyor={loading ? "true" : "false"}>
          <div className="flex items-end gap-2 rounded-[0.75rem] bg-kagit p-2">
            <label htmlFor="hedis-girdi" className="sr-only">
              Hediş&apos;e yaz
            </label>
            <textarea
              id="hedis-girdi"
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={600}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              placeholder={started ? "Yaz ya da seçeneğe dokun…" : "Kime hediye alıyorsun?"}
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base outline-none placeholder:text-murekkep-soluk/80"
            />
            <button type="submit" disabled={loading || !draft.trim()} aria-label="Gönder" className="btn btn-ana size-11 shrink-0 !p-0">
              <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden>
                <path d="M3.4 2.6a.75.75 0 0 0-1 .9l1.9 6.5-1.9 6.5a.75.75 0 0 0 1 .9l14.5-6.7a.75.75 0 0 0 0-1.4L3.4 2.6Zm2.3 8.15h5.55a.75.75 0 0 0 0-1.5H5.7L4.3 4.5 15.6 10 4.3 15.5l1.4-4.75Z" />
              </svg>
            </button>
          </div>
        </div>
        {!started && (
          <p className="mx-auto mt-2 w-fit rounded-full bg-murekkep px-3 py-1 text-center text-xs text-krem">
            Yazdıkların öneri için yapay zekayla işlenir; kişisel bilgi (ad, telefon, adres) paylaşma.{" "}
            <a href="/kvkk" target="_blank" rel="noopener" className="underline underline-offset-2">
              Ayrıntılar
            </a>
          </p>
        )}
        {started && <HedisActions onRestart={restart} onBrowseShop={onBrowseShop} />}
      </form>
    </div>
  );
}

/** Hediş'in anladıkları: kişi, özel gün, bütçe */
function profileChips(profile?: ChatProfile): string[] {
  if (!profile) return [];
  return [
    profile.recipientText ?? (profile.recipient ? recipientByKey(profile.recipient)?.label : null),
    profile.occasion ? occasionByKey(profile.occasion)?.label : null,
    profile.budgetMaxKurus ? `en fazla ${formatPrice(profile.budgetMaxKurus).replace(/ /g, " ")}` : null,
  ].filter((c): c is string => !!c);
}
