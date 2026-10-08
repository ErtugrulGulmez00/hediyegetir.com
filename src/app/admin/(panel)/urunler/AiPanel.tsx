"use client";

import { useEffect, useState } from "react";
import { AiSparkle, AiSteps, type StepState } from "@/components/ai/AiBits";
import { AI_FIELD_LABELS, type AiField } from "@/lib/ai/merge";

export type AiState =
  | { status: "idle" }
  | { status: "running"; withImages: boolean }
  | { status: "done"; filled: AiField[]; withImages: boolean; note?: string }
  | { status: "error"; message: string; withImages: boolean };

const STEP_MS = 650;

function stepLabels(withImages: boolean) {
  return [
    ...(withImages ? ["Fotoğraflar inceleniyor"] : []),
    "Ürün bilgileri analiz ediliyor",
    "Kategori belirleniyor",
    "Hedef kitle analiz ediliyor",
    "Özel günler ve etiketler hazırlanıyor",
    "Ürün öneri sistemine ekleniyor",
  ];
}

/**
 * Yapay zeka ürün asistanı kutusu. Analiz tek istekte yapılır; adımlar istek sürerken sırayla
 * ilerler, son adım cevap gelince tamamlanır. Hareketi azalt tercihinde animasyonlar durur.
 */
export function AiPanel({
  state,
  canRun,
  onRun,
  children,
}: {
  state: AiState;
  /** Analiz için yeterli bilgi var mı (fotoğraf ya da ürün adı) */
  canRun: boolean;
  onRun: () => void;
  /** Kategori / açıklama önerisi kartları */
  children?: React.ReactNode;
}) {
  const running = state.status === "running";
  const [step, setStep] = useState(0);
  const labels = stepLabels(state.status !== "idle" && state.withImages);

  // İstek sürerken adımları ilerlet; son adım cevabı bekler
  useEffect(() => {
    if (!running) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- yeni analizde adımlar baştan başlar
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, labels.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, [running, labels.length]);

  const steps = labels.map((label, i): { label: string; state: StepState } => {
    if (state.status === "done") return { label, state: "done" };
    if (state.status === "error") return { label, state: i < step ? "done" : i === step ? "error" : "pending" };
    if (running) return { label, state: i < step ? "done" : i === step ? "active" : "pending" };
    return { label, state: "pending" };
  });

  return (
    <section aria-labelledby="ai-panel-baslik" className="ai-kenar" data-calisiyor={running ? "true" : "false"}>
      <div className="rounded-[0.75rem] bg-kagit p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="ai-panel-baslik" className="flex items-center gap-2 font-baslik text-lg">
            <AiSparkle className="size-5" animate={running} />
            {running ? <span className="ai-isilti">Ürün analiz ediliyor…</span> : "AI ürün asistanı"}
          </h2>
          {state.status !== "idle" && !running && (
            <button
              type="button"
              onClick={onRun}
              disabled={!canRun}
              className="shrink-0 rounded-full border-[1.5px] border-murekkep/50 px-3 py-1 text-sm font-semibold hover:border-murekkep hover:bg-krem-koyu disabled:opacity-40"
            >
              Yeniden analiz et
            </button>
          )}
        </div>

        <div aria-live="polite">
          {state.status === "idle" && (
            <>
              <p className="mt-2 text-[0.95rem] text-murekkep-soluk">
                Fotoğraf yükle ya da ürün adını yaz; kategoriyi, kime uygun olduğunu, özel günleri, etiketleri ve
                açıklamayı ben hazırlayayım. Sen yalnızca kontrol et.
              </p>
              <button type="button" onClick={onRun} disabled={!canRun} className="btn btn-ana mt-4 w-full">
                <AiSparkle className="size-4" /> Şimdi analiz et
              </button>
            </>
          )}

          {state.status !== "idle" && (
            <div className="mt-4">
              <AiSteps steps={steps} />
            </div>
          )}

          {state.status === "done" && (
            <div className="mt-4 border-t-2 border-dashed border-kraft pt-3">
              {state.filled.length > 0 ? (
                <>
                  <p className="text-sm font-semibold">Hazırladıklarım</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {state.filled.map((f) => (
                      <li key={f} className="rounded-full bg-hardal/25 px-2.5 py-0.5 text-xs font-semibold text-kiremit-koyu">
                        {AI_FIELD_LABELS[f]}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-murekkep-soluk">
                    <span className="font-bold text-kiremit-koyu">AI</span> rozetli alanları istediğin gibi değiştirebilirsin.
                  </p>
                </>
              ) : (
                <p className="text-sm text-murekkep-soluk">Doldurulacak boş alan yoktu; senin yazdıklarına dokunmadım.</p>
              )}
              {state.note && <p className="mt-2 text-sm text-murekkep-soluk">{state.note}</p>}
            </div>
          )}

          {state.status === "error" && (
            <div className="mt-4 rounded-md bg-kiremit/10 p-3 text-sm">
              <p className="font-semibold text-kiremit-koyu">{state.message}</p>
              <button type="button" onClick={onRun} className="mt-2 font-semibold underline underline-offset-2">
                Tekrar dene
              </button>
            </div>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}

/** AI'ın önerdiği bir karar (yeni kategori, geliştirilmiş açıklama) için onay kartı. */
export function AiProposal({
  title,
  children,
  confirmLabel,
  onConfirm,
  onDismiss,
  busy,
}: {
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
  busy?: boolean;
}) {
  return (
    <div className="mt-4 rounded-lg border-[1.5px] border-hardal bg-hardal/10 p-3.5">
      <p className="flex items-start gap-1.5 text-sm font-semibold">
        <AiSparkle className="mt-0.5 size-4 shrink-0" />
        {title}
      </p>
      <div className="mt-1.5 text-sm">{children}</div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onConfirm} disabled={busy} className="btn btn-ana min-h-9 px-3 py-1 text-sm">
          {busy ? "Oluşturuluyor…" : confirmLabel}
        </button>
        <button type="button" onClick={onDismiss} className="rounded-md px-3 py-1 text-sm font-semibold hover:bg-krem-koyu">
          Vazgeç
        </button>
      </div>
    </div>
  );
}
