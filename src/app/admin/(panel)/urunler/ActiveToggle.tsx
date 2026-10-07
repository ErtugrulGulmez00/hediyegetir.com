"use client";

import { useOptimistic, useTransition } from "react";
import { toggleProductActiveAction } from "../../actions";

export function ActiveToggle({ productId, active }: { productId: string; active: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={optimistic ? "Yayında — pasife al" : "Pasif — yayına al"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleProductActiveAction(productId, !optimistic);
        })
      }
      className={`flex shrink-0 items-center gap-2 rounded-full border-2 border-murekkep px-1 py-0.5 text-xs font-bold transition-colors ${
        optimistic ? "bg-zeytin text-kagit" : "bg-krem-koyu text-murekkep-soluk"
      }`}
    >
      <span className={`size-4 rounded-full border-2 border-murekkep bg-kagit transition-transform ${optimistic ? "order-2" : ""}`} />
      <span className="w-12 text-center">{optimistic ? "yayında" : "pasif"}</span>
    </button>
  );
}
