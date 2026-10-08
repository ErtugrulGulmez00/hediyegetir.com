"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/money";
import { MAX_QTY, useCart } from "@/store/cart";
import { useStickyBuyBar } from "@/store/ui";

export function QtyStepper({
  value,
  onChange,
  label = "Adet",
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div className="inline-flex items-stretch border-2 border-murekkep bg-kagit" role="group" aria-label={label}>
      <button
        type="button"
        className="w-10 text-xl font-bold hover:bg-krem-koyu disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Bir azalt"
      >
        −
      </button>
      <span className="flex w-10 items-center justify-center border-x-2 border-murekkep font-semibold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="w-10 text-xl font-bold hover:bg-krem-koyu disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QTY}
        aria-label="Bir artır"
      >
        +
      </button>
    </div>
  );
}

export function AddToCart({
  productId,
  soldOut,
  name,
  priceKurus,
}: {
  productId: string;
  soldOut: boolean;
  name: string;
  priceKurus: number;
}) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const [scrolledPast, setScrolledPast] = useState(false);
  const setBarVisible = useStickyBuyBar((s) => s.setVisible);

  // Ana "Sepete ekle" ekranın üstünden çıkınca mobilde alttan yapışkan çubuk açılır. IntersectionObserver
  // yerine kaydırma dinlenir: sayfa butonu hiç göstermeden aşağı atlasa da (geri tuşu, çapa) çalışsın.
  useEffect(() => {
    const el = blockRef.current;
    if (!el) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      setScrolledPast(el.getBoundingClientRect().bottom < 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setBarVisible(scrolledPast);
    // Sayfa sonu (footer) çubuğun altında kalmasın: globals.css mobilde body'ye bu kadar alt boşluk verir
    document.documentElement.style.setProperty("--alt-cubuk", scrolledPast ? "5.5rem" : "0px");
    return () => {
      setBarVisible(false);
      document.documentElement.style.removeProperty("--alt-cubuk");
    };
  }, [scrolledPast, setBarVisible]);

  if (soldOut) {
    return <p className="font-el text-2xl text-kiremit-koyu">Bu ürün şu an tükendi; WhatsApp&apos;tan sorabilirsin.</p>;
  }

  return (
    <div ref={blockRef}>
      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, Math.min(MAX_QTY, n)))} />
        <button
          type="button"
          className="btn btn-ana flex-1 sm:flex-none"
          onClick={() => {
            add(productId, qty);
            setAdded(true);
          }}
        >
          Sepete ekle
        </button>
      </div>
      <p className="mt-3 min-h-7 font-el text-xl" aria-live="polite">
        {added && (
          <>
            Sepete koyduk!{" "}
            <Link href="/sepet" className="link-el font-govde text-base font-semibold">
              Sepete git
            </Link>
          </>
        )}
      </p>

      {scrolledPast && (
        <div
          role="region"
          aria-label="Hızlı sepete ekle"
          className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-murekkep bg-kagit px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="font-baslik text-lg leading-tight font-semibold">{formatPrice(priceKurus)}</p>
            </div>
            {added ? (
              <Link href="/sepet" className="btn btn-ikincil shrink-0">
                Sepete git →
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-ana shrink-0"
                onClick={() => {
                  add(productId, 1);
                  setAdded(true);
                }}
              >
                Sepete ekle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
