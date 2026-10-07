"use client";

import { create } from "zustand";

/** Hediş penceresinin açık/kapalı durumu (site genelinde tek pencere). */
export const useHedisDialog = create<{ open: boolean; openHedis: () => void; closeHedis: () => void }>()((set) => ({
  open: false,
  openHedis: () => set({ open: true }),
  closeHedis: () => set({ open: false }),
}));

/** Bu tarayıcı oturumunda Hediş kendiliğinden açıldı mı? */
export const HEDIS_SEEN_KEY = "hg_hedis_goruldu";
