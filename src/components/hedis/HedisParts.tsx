"use client";

import Image from "next/image";
import Link from "next/link";
import type { HedisProduct } from "@/app/api/hedis/sohbet/route";
import { AiSparkle } from "@/components/ai/AiBits";
import { ProductCard } from "@/components/site/ProductCard";
import { TagChip } from "@/components/ui/TagChip";
import { formatPrice } from "@/lib/money";
import { useCart, useCartCount } from "@/store/cart";
import { Mascot, type MascotMood } from "./Mascot";

// Hediş'in iki modu (yapay zekalı sohbet ve seçenekli rehber) için ortak parçalar.

/** İlk ekrandaki kişiler: sohbet modunda kullanıcının ağzından doğal bir cümle gönderilir */
export const STARTERS: { key: string; label: string; text: string | null }[] = [
  { key: "anne", label: "Anne", text: "Annem için hediye arıyorum." },
  { key: "baba", label: "Baba", text: "Babam için hediye arıyorum." },
  { key: "sevgili", label: "Sevgili", text: "Sevgilim için hediye arıyorum." },
  { key: "es", label: "Eş", text: "Eşim için hediye arıyorum." },
  { key: "arkadas", label: "Arkadaş", text: "Arkadaşım için hediye arıyorum." },
  { key: "cocuk", label: "Çocuk", text: "Bir çocuk için hediye arıyorum." },
  { key: "ogretmen", label: "Öğretmen", text: "Öğretmenim için hediye arıyorum." },
  { key: "is-arkadasi", label: "İş arkadaşı", text: "İş arkadaşım için hediye arıyorum." },
  { key: "diger", label: "Diğer", text: null },
];

/** Seçenek düğmeleri: hediye etiketi biçiminde, ortalanmış */
export function OptionTags({ children, label = "Seçenekler" }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap justify-center gap-2.5">
      {children}
    </div>
  );
}
export { TagChip as OptionTag };

const LAST_KEY = "hg_hedis_son";

export function readLastRecipient(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? "null");
    return typeof v?.text === "string" ? v.text : null;
  } catch {
    return null;
  }
}
export function writeLastRecipient(text: string) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ text, at: Date.now() }));
  } catch {
    // depolama kapalıysa sorun değil
  }
}

function AssistantBadge({ ai }: { ai: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-hardal px-2.5 py-0.5 text-xs font-bold text-murekkep">
      {ai && <AiSparkle className="size-3.5" />} {ai ? "yapay zeka destekli hediye asistanı" : "hediye asistanı"}
    </span>
  );
}

/** Maskotun çevresindeki küçük süsler */
function Doodles() {
  return (
    <svg aria-hidden viewBox="0 0 200 140" className="pointer-events-none absolute -inset-x-16 -top-3 h-[140%] w-[calc(100%+8rem)]">
      <path d="M24 58c0-5 6-7 8.5-2.5C35 51 41 53 41 58c0 6-8.5 11-8.5 11S24 64 24 58Z" fill="var(--color-gul)" opacity=".7" />
      <path d="M172 34l3 7.5 7.5 3-7.5 3-3 7.5-3-7.5-7.5-3 7.5-3Z" fill="var(--color-hardal)" className="ai-yildiz" />
      <path d="M160 92c0-3.6 4.3-5 6-1.8 1.8-3.2 6-1.8 6 1.8 0 4.3-6 7.8-6 7.8s-6-3.5-6-7.8Z" fill="var(--color-kiremit)" opacity=".55" />
      <path d="M44 104l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="var(--color-zeytin)" opacity=".6" />
      <circle cx="150" cy="16" r="3" fill="var(--color-kiremit)" opacity=".4" />
      <circle cx="40" cy="22" r="2.5" fill="var(--color-hardal)" opacity=".7" />
    </svg>
  );
}

/** Karşılama: ortada sallanan maskot, adı ve maskottan çıkan konuşma balonu */
export function HedisWelcome({
  mood,
  bumpKey,
  ai,
  children,
}: {
  mood: MascotMood;
  bumpKey: number;
  ai: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <div className="relative">
        <span aria-hidden className="absolute inset-x-0 top-5 mx-auto size-28 rounded-full bg-hardal/45 sm:size-32" />
        <Doodles />
        <span className="relative inline-block animate-sallan">
          <Mascot mood={mood} bumpKey={bumpKey} className="size-28 sm:size-32" />
        </span>
      </div>
      <p data-yuzey className="font-baslik text-3xl leading-tight text-kagit drop-shadow-sm">
        Hediş
      </p>
      <p data-yuzey className="mt-1">
        <AssistantBadge ai={ai} />
      </p>
      <div data-yuzey className="relative mt-5 max-w-lg rounded-2xl border-2 border-murekkep bg-kagit px-5 py-4 text-[1.05rem] shadow-baski-sm">
        <span aria-hidden className="absolute -top-[9px] left-1/2 size-4 -translate-x-1/2 rotate-45 border-t-2 border-l-2 border-murekkep bg-kagit" />
        <span className="sr-only">Hediş: </span>
        {children}
      </div>
    </div>
  );
}

/** Sohbet başladıktan sonraki küçük başlık */
export function HedisHeader({ mood, bumpKey, ai }: { mood: MascotMood; bumpKey: number; ai: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Mascot mood={mood} bumpKey={bumpKey} className="size-14 shrink-0" />
      <div data-yuzey className="text-left">
        <p className="font-baslik text-2xl leading-tight text-kagit">Hediş</p>
        <AssistantBadge ai={ai} />
      </div>
    </div>
  );
}

/** Hediş'in mesajı: küçük maskot avatarlı balon */
export function HedisNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-xl items-end gap-2">
      <Mascot mood="idle" decorative className="size-9 shrink-0" />
      <div data-yuzey className="rounded-2xl rounded-bl-sm border-2 border-murekkep/15 bg-kagit px-4 py-3 shadow-kagit">
        <span className="sr-only">Hediş: </span>
        {children}
      </div>
    </div>
  );
}

export function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <p data-yuzey className="max-w-[85%] rounded-2xl rounded-br-sm border-2 border-kagit/30 bg-kiremit px-4 py-2.5 text-kagit">
      <span className="sr-only">Sen: </span>
      {children}
    </p>
  );
}

export function ThinkingDots() {
  return (
    <span aria-hidden className="mt-2 flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-2 animate-bounce rounded-full bg-kiremit" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

/** Önerilen ürünler. `chips`: Hediş'in anladıkları (kişi, gün, bütçe). */
export function Results({ products, title, chips, ai }: { products: HedisProduct[]; title: string; chips: string[]; ai: boolean }) {
  return (
    <div data-yuzey className="rounded-xl border-2 border-murekkep bg-krem p-4 shadow-baski sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-murekkep-soluk">
          {ai && <AiSparkle className="size-4" />}
          {title}
        </p>
        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Hediş'in anladıkları">
            {chips.map((c) => (
              <li key={c} className="rounded-full bg-krem-koyu px-2.5 py-0.5 text-xs font-semibold">
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
        {products.map((p, i) => (
          <li key={p.id}>
            <ResultCard product={p} index={i} ai={ai} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultCard({ product, index, ai }: { product: HedisProduct; index: number; ai: boolean }) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.lines.some((l) => l.productId === product.id));
  return (
    <ProductCard product={product} index={index} priority={index < 2}>
      {product.reasons.length > 0 && (
        <p className="mt-2.5 flex gap-1.5 text-sm leading-snug text-murekkep-soluk">
          {ai ? (
            <AiSparkle className="mt-0.5 size-3.5 shrink-0" />
          ) : (
            <span aria-hidden className="shrink-0 text-kiremit">
              ✓
            </span>
          )}
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

/** Hediş'in yazıyla andığı, kartı daha önce gösterilmiş ürünler: küçük bağlantılar */
export function MentionedProducts({ products }: { products: HedisProduct[] }) {
  return (
    <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Bahsettiğim ürünler">
      {products.map((p) => (
        <li key={p.id}>
          <Link
            href={`/urun/${p.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-murekkep/30 bg-krem py-0.5 pr-2.5 pl-0.5 text-sm font-semibold hover:border-murekkep"
          >
            {p.images[0] && <Image src={p.images[0].url} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />}
            {p.name}
            <span className="font-normal text-murekkep-soluk">{formatPrice(p.priceKurus)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Pencerenin altındaki bağlantılar. Sepette ürün varsa büyük, belirgin bir "Sepete git" düğmesi çıkar. */
export function HedisActions({ onRestart, onBrowseShop }: { onRestart?: () => void; onBrowseShop: () => void }) {
  const count = useCartCount();
  // Saydam pencerede arkada ne olursa olsun okunsun: koyu kapsül üstünde açık renk
  const link = "underline-offset-2 hover:text-kagit hover:underline";
  return (
    <div className="mt-3 flex flex-col items-center gap-2.5">
      {count > 0 && (
        <Link
          href="/sepet"
          data-yuzey
          className="inline-flex items-center gap-3 rounded-full border-2 border-murekkep bg-hardal px-6 py-3 text-lg font-bold text-murekkep shadow-baski transition-transform hover:-translate-y-0.5"
        >
          <CartIcon />
          Sepete git ({count})
          <span aria-hidden>→</span>
        </Link>
      )}
      <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl bg-murekkep px-5 py-2 text-sm">
        {onRestart && (
          <button type="button" onClick={onRestart} className={`text-krem ${link}`}>
            ↺ Baştan başla
          </button>
        )}
        <button type="button" onClick={onBrowseShop} className={`font-semibold text-krem ${link}`}>
          Diğer ürünlere göz at →
        </button>
      </div>
    </div>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 4h2.2l2.3 11h10.8l2-8H7" />
      <circle cx="9.5" cy="19.5" r="1.5" />
      <circle cx="17" cy="19.5" r="1.5" />
    </svg>
  );
}
