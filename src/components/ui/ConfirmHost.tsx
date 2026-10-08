"use client";

import { useEffect, useRef } from "react";
import { useConfirmStore } from "@/store/confirm";

/**
 * confirmDialog() sorularını gösteren pencere: kraft kâğıt, mürekkep çerçeve, el yazısı başlık.
 * Yerel <dialog>: odak içeride kalır, Esc ve arka plana tıklama "vazgeç" sayılır. Kök yerleşimde bir kez durur.
 */
export function ConfirmHost() {
  const pending = useConfirmStore((s) => s.pending);
  const settle = useConfirmStore((s) => s.settle);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (pending && !d.open) d.showModal();
    else if (!pending && d.open) d.close();
  }, [pending]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="onay-baslik"
      aria-describedby={pending?.message ? "onay-metin" : undefined}
      onClose={() => useConfirmStore.getState().pending && settle(false)}
      onClick={(e) => e.target === e.currentTarget && settle(false)}
      className="m-auto w-[min(26rem,calc(100%-2rem))] overflow-visible border-0 bg-transparent p-0 text-murekkep backdrop:bg-murekkep/60 backdrop:backdrop-blur-[2px]"
    >
      {pending && (
        <div className="kagit relative rotate-[-0.6deg] rounded-xl border-2 border-murekkep px-6 pt-6 pb-5 shadow-baski">
          <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[3deg] bg-hardal/70" />
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-murekkep text-lg font-bold ${
                pending.danger ? "bg-kiremit text-kagit" : "bg-hardal"
              }`}
            >
              !
            </span>
            <div className="min-w-0">
              <h2 id="onay-baslik" className="font-baslik text-xl leading-snug">
                {pending.title}
              </h2>
              {pending.message && (
                <p id="onay-metin" className="mt-1.5 text-[0.95rem] text-murekkep-soluk">
                  {pending.message}
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2.5">
            {/* Odak önce "vazgeç"te: yanlışlıkla Enter'a basınca bir şey silinmesin */}
            <button type="button" autoFocus onClick={() => settle(false)} className="btn btn-ikincil min-h-10 px-4 py-1.5">
              {pending.cancelLabel ?? "Vazgeç"}
            </button>
            <button
              type="button"
              onClick={() => settle(true)}
              className="btn btn-ana min-h-10 px-4 py-1.5"
            >
              {pending.confirmLabel ?? "Tamam"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
