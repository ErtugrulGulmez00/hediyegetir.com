"use client";

import Link from "next/link";
import type { HedisProduct } from "@/app/api/hedis/sohbet/route";
import { AiSparkle } from "@/components/ai/AiBits";
import { ProductCard } from "@/components/site/ProductCard";
import { Tape } from "@/components/ui/Tape";
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

export const starterChip =
  "rounded-full border-[1.5px] border-murekkep bg-kagit px-4 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-murekkep hover:text-kagit";

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

/** Maskot ve ad. Yapay zeka kapalıyken "yapay zeka" iddiası taşımaz. */
export function HedisHeader({ mood, bumpKey, ai }: { mood: MascotMood; bumpKey: number; ai: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Mascot mood={mood} bumpKey={bumpKey} className="size-16 shrink-0 sm:size-20" />
      <div>
        <p className="font-baslik text-2xl leading-tight">Hediş</p>
        <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-hardal/25 px-2 py-0.5 text-xs font-bold text-kiremit-koyu">
          {ai && <AiSparkle className="size-3.5" />} {ai ? "yapay zeka destekli hediye asistanı" : "hediye asistanı"}
        </p>
      </div>
    </div>
  );
}

export function HedisNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="kagit relative max-w-xl rounded-sm px-5 pt-6 pb-4">
      <Tape color="gul" rotate={-4} className="-top-3 left-5 h-5 w-16" />
      <span className="mb-1 flex items-center gap-1 font-el text-lg leading-none text-kiremit-koyu">Hediş</span>
      {children}
    </div>
  );
}

export function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-murekkep px-4 py-2.5 text-kagit">
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
    <div className="rounded-xl border-2 border-dashed border-kraft-koyu p-4 sm:p-5">
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

/** Pencerenin altındaki bağlantılar. Sepette ürün varsa sepete kestirme yol da çıkar. */
export function HedisActions({ onRestart, onBrowseShop }: { onRestart?: () => void; onBrowseShop: () => void }) {
  const count = useCartCount();
  const link = "underline-offset-2 hover:text-murekkep hover:underline";
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
      {onRestart ? (
        <button type="button" onClick={onRestart} className={`text-murekkep-soluk ${link}`}>
          Baştan başla
        </button>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {count > 0 && (
          <Link href="/sepet" className="font-bold text-kiremit-koyu underline-offset-2 hover:underline">
            Sepete git ({count}) →
          </Link>
        )}
        <button type="button" onClick={onBrowseShop} className={`font-semibold text-murekkep-soluk ${link}`}>
          Diğer ürünlere göz at →
        </button>
      </div>
    </div>
  );
}
