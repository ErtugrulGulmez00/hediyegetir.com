"use client";

import { create } from "zustand";

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Silme gibi geri alınamaz işlerde onay düğmesi kiremit rengi olur */
  danger?: boolean;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

/** Site genelinde tek onay penceresi (tarayıcının confirm() kutusu yerine); <ConfirmHost /> gösterir. */
export const useConfirmStore = create<{ pending: Pending | null; settle: (ok: boolean) => void }>()((set, get) => ({
  pending: null,
  settle: (ok) => {
    get().pending?.resolve(ok);
    set({ pending: null });
  },
}));

/** `if (await confirmDialog({...}))` biçiminde kullanılır. Açık bir soru varsa o "vazgeç" sayılır. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  useConfirmStore.getState().pending?.resolve(false);
  return new Promise((resolve) => useConfirmStore.setState({ pending: { ...options, resolve } }));
}
