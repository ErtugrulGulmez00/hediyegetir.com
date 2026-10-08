"use client";

import { useState, useTransition } from "react";
import { AiSparkle } from "@/components/ai/AiBits";
import { enrichProductsAction, type EnrichState } from "../../actions";

/** Özel gün / etiket / özellik alanı boş ürünleri AI ile doldurur (8'erli gruplar halinde). */
export function EnrichButton({ missing }: { missing: number }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<EnrichState | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const remaining = result?.remaining ?? missing;
  if (missing === 0 && !result) return null;

  return (
    <div className="ai-kenar mb-6" data-calisiyor={pending ? "true" : "false"}>
      <div className="flex flex-wrap items-center gap-3 rounded-[0.75rem] bg-kagit px-4 py-3">
        <AiSparkle className="size-5" animate={pending} />
        <p className="min-w-0 flex-1 text-[0.95rem]" aria-live="polite">
          {pending ? (
            <span className="ai-isilti font-semibold">Ürünler analiz ediliyor…</span>
          ) : result ? (
            <>
              {result.message ?? `${result.done} ürün zenginleştirildi.`}
              {remaining > 0 ? ` ${remaining} ürün kaldı.` : " Eksik kalmadı."}
              {result.errors && result.errors.length > 0 && (
                <span className="mt-1 block text-sm text-kiremit-koyu">{result.errors.join(" · ")}</span>
              )}
            </>
          ) : (
            <>
              <strong>{missing} ürünün</strong> özel gün, etiket ya da özellik bilgisi eksik. Hediş bu bilgilerle daha iyi
              öneri yapar.
            </>
          )}
        </p>
        {remaining > 0 && (
          <button
            type="button"
            disabled={pending}
            className="btn btn-ana min-h-9 py-1 text-sm"
            onClick={() =>
              start(async () => {
                const r = await enrichProductsAction(failed);
                setResult(r);
                if (r.failedIds) setFailed(r.failedIds);
              })
            }
          >
            {pending ? "Çalışıyor…" : "AI ile eksikleri doldur"}
          </button>
        )}
      </div>
    </div>
  );
}
