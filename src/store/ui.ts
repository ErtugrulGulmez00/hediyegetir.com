"use client";

import { create } from "zustand";

/** Mobilde ürün sayfasının alttaki "Sepete ekle" çubuğu açık mı (yüzen Hediş düğmesi üstüne kaysın) */
export const useStickyBuyBar = create<{ visible: boolean; setVisible: (visible: boolean) => void }>()((set) => ({
  visible: false,
  setVisible: (visible) => set({ visible }),
}));
