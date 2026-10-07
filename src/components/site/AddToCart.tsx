"use client";

import Link from "next/link";
import { useState } from "react";
import { MAX_QTY, useCart } from "@/store/cart";

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

export function AddToCart({ productId, soldOut }: { productId: string; soldOut: boolean }) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (soldOut) {
    return <p className="font-el text-2xl text-kiremit-koyu">Bu ürün şu an tükendi; WhatsApp&apos;tan sorabilirsin.</p>;
  }

  return (
    <div>
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
    </div>
  );
}
