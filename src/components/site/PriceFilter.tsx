"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  hrefWith,
  priceLabel,
  type Filters,
  type PriceRange,
} from "@/lib/shop-filters";

const fmt = (n: number) => n.toLocaleString("tr-TR");
const parse = (s: string) => {
  const n = Number(s.replace(/\D/g, ""));
  return n > 0 ? Math.min(1_000_000, n) : undefined;
};

/**
 * Sade fiyat filtresi: düğmeye basınca küçük bir panelde "en az / en çok" kutuları.
 * Kutuların ipucu yazısı kategorideki en düşük ve en yüksek fiyattır.
 */
export function PriceFilter({
  filters,
  prices,
}: {
  filters: Filters;
  prices: number[];
}) {
  const router = useRouter();
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const label = priceLabel(filters.price);

  // Panelin dışına tıklayınca ya da Esc'e basınca kapan
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (range: PriceRange | undefined) => {
    setOpen(false);
    router.push(hrefWith(filters, { price: range }), { scroll: false });
  };
  const apply = () => {
    const a = parse(min);
    const b = parse(max);
    go(
      a == null && b == null
        ? undefined
        : a != null && b != null && a > b
          ? { min: b, max: a }
          : { min: a, max: b },
    );
  };

  const field =
    "w-full min-w-0 rounded-lg border-[1.5px] border-kraft-koyu/70 bg-kagit px-3 py-1.5 font-semibold outline-none focus:border-murekkep";

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1 lg:flex-none">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => {
          setMin(filters.price?.min != null ? fmt(filters.price.min) : "");
          setMax(filters.price?.max != null ? fmt(filters.price.max) : "");
          setOpen((o) => !o);
        }}
        className={`flex h-9 w-full min-w-0 items-center gap-1 rounded-full border-[1.5px] pr-8 pl-3.5 text-sm transition-colors ${
          label
            ? "border-murekkep bg-murekkep text-kagit"
            : "border-kraft-koyu/70 bg-kagit hover:border-murekkep"
        }`}
      >
        <span
          className={`shrink-0 ${label ? "text-kagit/80" : "text-murekkep-soluk"}`}
        >
          Fiyat:
        </span>
        <span className="truncate font-semibold">{label ?? "Tümü"}</span>
        <svg
          viewBox="0 0 16 16"
          className={`pointer-events-none absolute right-3 size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <form
          id={`${id}-panel`}
          aria-label="Fiyat aralığı"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
          className="absolute top-11 left-0 z-30 w-64 rounded-xl border-[1.5px] border-murekkep bg-kagit p-3 shadow-baski-sm sm:right-0 sm:left-auto"
        >
          <div className="flex items-end gap-2 text-sm">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs font-semibold text-murekkep-soluk">
                En az
              </span>
              <input
                aria-label="En az fiyat (₺)"
                inputMode="numeric"
                autoFocus
                value={min}
                onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder={
                  prices.length ? `₺${fmt(Math.floor(prices[0]))}` : "₺"
                }
                className={field}
              />
            </label>
            <span aria-hidden className="pb-2 text-murekkep-soluk">
              –
            </span>
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs font-semibold text-murekkep-soluk">
                En çok
              </span>
              <input
                aria-label="En çok fiyat (₺)"
                inputMode="numeric"
                value={max}
                onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder={
                  prices.length ? `₺${fmt(Math.ceil(prices.at(-1)!))}` : "₺"
                }
                className={field}
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                filters.price ? go(undefined) : (setMin(""), setMax(""))
              }
              className="text-sm font-semibold text-murekkep-soluk underline-offset-2 hover:text-murekkep hover:underline"
            >
              Temizle
            </button>
            <button
              type="submit"
              className="btn btn-ana min-h-8 px-4 py-1 text-sm"
            >
              Uygula
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
