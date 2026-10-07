"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Sepet yalnızca kimlik + adet tutar; ad ve fiyat her zaman sunucudan güncel çekilir.
export type CartLine = { productId: string; qty: number };

export const MAX_QTY = 20;

type CartState = {
  lines: CartLine[];
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  /** Sunucuda artık bulunmayan ürünleri düşürür */
  keepOnly: (productIds: string[]) => void;
  clear: () => void;
};

// Gizli pencere / engellenmiş depolamada sessizce bellek içinde çalışır.
// useCart'tan önce tanımlı olmalı: createJSONStorage depolamayı hemen okur; burada
// tanımsız kalırsa persist sessizce devre dışı kalır ve useCart.persist undefined olur.
const memory = new Map<string, string>();
const safeLocalStorage = {
  getItem: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      memory.delete(k);
    }
  },
};

const clamp = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(n)));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (productId, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === productId);
          if (existing) {
            return { lines: s.lines.map((l) => (l.productId === productId ? { ...l, qty: clamp(l.qty + qty) } : l)) };
          }
          return { lines: [...s.lines, { productId, qty: clamp(qty) }] };
        }),
      setQty: (productId, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.productId === productId ? { ...l, qty: clamp(qty) } : l)) })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      keepOnly: (productIds) => set((s) => ({ lines: s.lines.filter((l) => productIds.includes(l.productId)) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "hg-sepet",
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      // Sunucu çıktısıyla uyuşmazlık olmasın diye tarayıcıda elle yüklenir
      skipHydration: true,
    },
  ),
);

const subscribeHydration = (cb: () => void) => useCart.persist.onFinishHydration(cb);

/** Sepet tarayıcıda yüklendi mi? Yüklenmeden önce sepet boş görünür. */
export function useCartHydrated() {
  return useSyncExternalStore(subscribeHydration, () => useCart.persist.hasHydrated(), () => false);
}

/** (site) layout'una bir kez konur; sepeti localStorage'dan yükler. */
export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return null;
}

export function useCartCount() {
  const hydrated = useCartHydrated();
  const count = useCart((s) => s.lines.reduce((sum, l) => sum + l.qty, 0));
  return hydrated ? count : 0;
}
