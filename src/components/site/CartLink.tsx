"use client";

import Link from "next/link";
import { useCartCount } from "@/store/cart";

export function CartLink() {
  const count = useCartCount();
  return (
    <Link
      href="/sepet"
      className="relative inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border-2 border-murekkep bg-kagit px-2 shadow-baski-sm transition-transform hover:-translate-y-px sm:px-3.5"
      aria-label={count > 0 ? `Sepet, ${count} ürün` : "Sepet"}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
        <path d="M5 8.5h14l-1.3 11.2a1.5 1.5 0 0 1-1.5 1.3H7.8a1.5 1.5 0 0 1-1.5-1.3L5 8.5Z" fill="var(--color-kraft)" />
        <path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3" strokeLinecap="round" />
      </svg>
      <span aria-hidden className="hidden text-[0.95rem] font-semibold sm:inline">
        Sepet
      </span>
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-murekkep bg-hardal px-1 text-xs font-bold"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
