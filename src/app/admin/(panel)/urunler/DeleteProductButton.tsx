"use client";

import { useTransition } from "react";
import { confirmDialog } from "@/store/confirm";
import { deleteProductAction } from "../../actions";

/** Ürün kartının köşesindeki sil düğmesi: önce onay sorar, sonra siler (sayfa "Ürün silindi." ile yenilenir). */
export function DeleteProductButton({ productId, name, className = "" }: { productId: string; name: string; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={`"${name}" ürününü sil`}
      title="Ürünü sil"
      disabled={pending}
      onClick={async () => {
        const ok = await confirmDialog({
          title: `"${name}" silinsin mi?`,
          message: 'Bu geri alınamaz. Yalnızca gizlemek istiyorsan "yayında" anahtarını kapatman yeterli.',
          confirmLabel: "Evet, sil",
          danger: true,
        });
        if (ok) start(() => deleteProductAction(productId));
      }}
      className={`flex size-8 items-center justify-center rounded-full border-[1.5px] border-murekkep bg-kagit/95 text-kiremit-koyu shadow-baski-sm transition-colors hover:bg-kiremit hover:text-kagit disabled:animate-pulse ${className}`}
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3.5 5.5h13M8 5.5V4h4v1.5M5 5.5l.8 11h8.4l.8-11M8.5 8.5v5.5M11.5 8.5v5.5" />
      </svg>
    </button>
  );
}
