"use client";

import { useEffect, useRef, useState } from "react";
import type { HedisChatResponse, HedisProduct } from "@/app/api/hedis/sohbet/route";
import { AiSparkle } from "@/components/ai/AiBits";
import { ProductCard } from "@/components/site/ProductCard";
import { Tape } from "@/components/ui/Tape";
import type { ChatProfile, ChatTurn } from "@/lib/hedis/ai-chat";
import { occasionByKey, recipientByKey } from "@/lib/hedis/config";
import { formatPrice } from "@/lib/money";
import { useCart } from "@/store/cart";
import { Mascot, type MascotMood } from "./Mascot";

type Entry = ChatTurn & { products?: HedisProduct[]; quickReplies?: string[]; profile?: ChatProfile; catalogSize?: number };

/** İlk ekrandaki hızlı seçenekler: tıklanınca kullanıcının ağzından doğal bir cümle gönderilir */
const STARTERS: { label: string; text: string | null }[] = [
  { label: "Anne", text: "Annem için hediye arıyorum." },
  { label: "Baba", text: "Babam için hediye arıyorum." },
  { label: "Sevgili", text: "Sevgilim için hediye arıyorum." },
  { label: "Eş", text: "Eşim için hediye arıyorum." },
  { label: "Arkadaş", text: "Arkadaşım için hediye arıyorum." },
  { label: "Çocuk", text: "Bir çocuk için hediye arıyorum." },
  { label: "Öğretmen", text: "Öğretmenim için hediye arıyorum." },
  { label: "İş arkadaşı", text: "İş arkadaşım için hediye arıyorum." },
  { label: "Diğer", text: null },
];

const THINKING = ["Seni dinliyorum…", "Katalogdaki ürünlere bakıyorum…", "Sana uygun olanları seçiyorum…"];
const LAST_KEY = "hg_hedis_son";

function readLast(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? "null");
    return typeof v?.text === "string" ? v.text : null;
  } catch {
    return null;
  }
}
function writeLast(text: string) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ text, at: Date.now() }));
  } catch {
    // depolama kapalıysa sorun değil
  }
}

/** Modele giden geçmiş: önerilen ürünler asistan mesajına eklenir ki aynılarını tekrar önermesin */
function toTurns(entries: Entry[]): ChatTurn[] {
  return entries.map((e) =>
    e.role === "assistant" && e.products?.length
      ? { role: "assistant", text: `${e.text} [Önerdiğim ürünler: ${e.products.map((p) => `${p.name} (${p.id})`).join(", ")}]` }
      : { role: e.role, text: e.text },
  );
}

export function HedisChat({ onBrowseShop }: { onBrowseShop: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingLine, setThinkingLine] = useState(0);
  const [returning, setReturning] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage yalnızca mount sonrası okunabilir
    setReturning(readLast());
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
      const who = data.profile.recipientText ?? (data.profile.recipient ? recipientByKey(data.profile.recipient)?.label : null);
      if (who) writeLast(who);
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
    inputRef.current?.focus();
  };

  const last = entries[entries.length - 1];
  const lastAssistant = [...entries].reverse().find((e) => e.role === "assistant");
  const started = entries.length > 0;
  const quickReplies = !started ? null : !loading && last?.role === "assistant" ? (last.quickReplies ?? []) : [];
  const mood: MascotMood = loading ? "thinking" : lastAssistant?.products?.length ? "happy" : "talking";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <div className="flex items-center gap-3">
        <Mascot mood={mood} bumpKey={entries.length} className="size-16 shrink-0 sm:size-20" />
        <div>
          <p className="font-baslik text-2xl leading-tight">Hediş</p>
          <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-hardal/25 px-2 py-0.5 text-xs font-bold text-kiremit-koyu">
            <AiSparkle className="size-3.5" /> yapay zeka destekli hediye asistanı
          </p>
        </div>
      </div>

      <ol aria-label="Hediş ile konuşma" aria-live="polite" className="mt-6 flex flex-col gap-4">
        <li>
          <HedisNote>
            <p>
              {returning
                ? `Yine hoş geldin! Geçen sefer ${returning} için bakmıştık. Bu sefer kime hediye arıyoruz?`
                : "Merhaba, ben Hediş! Kime hediye alacağını bana anlat, gerisini birlikte bulalım."}
            </p>
            {!started && (
              <p className="mt-1.5 text-sm text-murekkep-soluk">
                Bir seçeneğe dokunabilir ya da kendi cümlenle yazabilirsin: &ldquo;Yeni işe başlayan kız arkadaşıma bir şey
                arıyorum&rdquo; gibi.
              </p>
            )}
          </HedisNote>
        </li>

        {entries.map((e, i) =>
          e.role === "user" ? (
            <li key={i} className="flex justify-end">
              <UserBubble>{e.text}</UserBubble>
            </li>
          ) : (
            <li key={i} className="flex flex-col gap-4">
              <HedisNote>
                <p>{e.text}</p>
              </HedisNote>
              {e.products && e.products.length > 0 && <Results products={e.products} profile={e.profile} catalogSize={e.catalogSize} />}
            </li>
          ),
        )}

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
            <div role="alert" className="rounded-lg border-l-4 border-kiremit bg-kagit px-4 py-3">
              <p className="font-semibold">{error}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <button type="button" onClick={retry} className="font-semibold underline underline-offset-2">
                  Tekrar dene
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
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Hızlı seçenekler">
          {STARTERS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => (s.text ? void send(s.text) : inputRef.current?.focus())}
              className="rounded-full border-[1.5px] border-murekkep bg-kagit px-4 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-murekkep hover:text-kagit"
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : (
        quickReplies &&
        quickReplies.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-end gap-2" aria-label="Hazır cevaplar">
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
        className="sticky bottom-0 z-10 -mx-1 mt-5 bg-krem px-1 pt-2 pb-1"
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
        {started && (
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
            <button type="button" onClick={restart} className="text-murekkep-soluk underline-offset-2 hover:text-murekkep hover:underline">
              Baştan başla
            </button>
            <button type="button" onClick={onBrowseShop} className="font-semibold text-murekkep-soluk underline-offset-2 hover:text-murekkep hover:underline">
              Diğer ürünlere göz at →
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function HedisNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="kagit relative max-w-xl rounded-sm px-5 pt-6 pb-4">
      <Tape color="gul" rotate={-4} className="-top-3 left-5 h-5 w-16" />
      <span className="mb-1 flex items-center gap-1 font-el text-lg leading-none text-kiremit-koyu">Hediş</span>
      {children}
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-murekkep px-4 py-2.5 text-kagit">
      <span className="sr-only">Sen: </span>
      {children}
    </p>
  );
}

function ThinkingDots() {
  return (
    <span aria-hidden className="mt-2 flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-2 animate-bounce rounded-full bg-kiremit" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

function ProfileChips({ profile }: { profile?: ChatProfile }) {
  if (!profile) return null;
  const chips = [
    profile.recipientText ?? (profile.recipient ? recipientByKey(profile.recipient)?.label : null),
    profile.occasion ? occasionByKey(profile.occasion)?.label : null,
    profile.budgetMaxKurus ? `en fazla ${formatPrice(profile.budgetMaxKurus).replace(/ /g, " ")}` : null,
  ].filter((c): c is string => !!c);
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Hediş'in anladıkları">
      {chips.map((c) => (
        <li key={c} className="rounded-full bg-krem-koyu px-2.5 py-0.5 text-xs font-semibold">
          {c}
        </li>
      ))}
    </ul>
  );
}

function Results({ products, profile, catalogSize }: { products: HedisProduct[]; profile?: ChatProfile; catalogSize?: number }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-kraft-koyu p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-murekkep-soluk">
          <AiSparkle className="size-4" />
          {catalogSize ? `${catalogSize} ürün arasından senin için seçtim` : "Senin için seçtim"}
        </p>
        <ProfileChips profile={profile} />
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
        {products.map((p, i) => (
          <li key={p.id}>
            <ResultCard product={p} index={i} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultCard({ product, index }: { product: HedisProduct; index: number }) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.lines.some((l) => l.productId === product.id));
  return (
    <ProductCard product={product} index={index} priority={index < 2}>
      {product.reasons.length > 0 && (
        <p className="mt-2.5 flex gap-1.5 text-sm leading-snug text-murekkep-soluk">
          <AiSparkle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="sr-only">Neden önerdim: </span>
            {product.reasons.join(" · ")}
          </span>
        </p>
      )}
      <button
        type="button"
        onClick={() => add(product.id)}
        disabled={inCart}
        className={`mt-3 w-full border-2 border-murekkep px-2 py-1.5 text-sm font-bold transition-colors ${
          inCart ? "bg-zeytin text-kagit" : "bg-kagit hover:bg-krem-koyu"
        }`}
      >
        {inCart ? "Sepette" : "Sepete ekle"}
      </button>
    </ProductCard>
  );
}
