// Yapay zeka arayüz parçaları (admin ürün ekranı ve Hediş ortak kullanır).

/** Dört köşeli küçük yıldız; çalışırken hafifçe göz kırpar. */
export function AiSparkle({ className = "size-4", animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} ${animate ? "ai-yildiz" : ""}`} aria-hidden>
      <path d="M12 1.5c.6 4.9 2.1 8.6 10.5 10.5-8.4 1.9-9.9 5.6-10.5 10.5C11.4 17.6 9.9 13.9 1.5 12 9.9 10.1 11.4 6.4 12 1.5Z" fill="var(--color-hardal)" stroke="var(--color-kiremit-koyu)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M19.5 2.5c.2 1.6.7 2.4 2.3 2.7-1.6.3-2.1 1.1-2.3 2.7-.2-1.6-.7-2.4-2.3-2.7 1.6-.3 2.1-1.1 2.3-2.7Z" fill="var(--color-kiremit)" />
    </svg>
  );
}

/** Alan etiketinin yanındaki "AI" rozeti: bu değeri yapay zeka doldurdu. */
export function AiBadge({ title = "Bu alanı yapay zeka doldurdu; istediğin gibi değiştirebilirsin" }: { title?: string }) {
  return (
    <span
      title={title}
      className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-hardal/30 px-1.5 py-px align-middle text-[0.7rem] font-bold tracking-wide text-kiremit-koyu"
    >
      <AiSparkle className="size-3" /> AI
    </span>
  );
}

export type StepState = "done" | "active" | "pending" | "error";

/** Adım adım analiz göstergesi: ✓ tamamlanan, dönen halka sürmekte olan, ○ bekleyen. */
export function AiSteps({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((s) => (
        <li
          key={s.label}
          className={`flex items-center gap-2.5 text-[0.95rem] transition-colors ${
            s.state === "pending" ? "text-murekkep-soluk/70" : s.state === "error" ? "text-kiremit-koyu" : "text-murekkep"
          }`}
        >
          <StepIcon state={s.state} />
          <span className={s.state === "active" ? "font-semibold" : ""}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-zeytin text-kagit" aria-label="tamamlandı">
        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  if (state === "active")
    return (
      <span className="relative flex size-5 shrink-0 items-center justify-center" aria-label="sürüyor">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-hardal/40 border-t-kiremit" />
        <span className="size-1.5 rounded-full bg-kiremit" />
      </span>
    );
  if (state === "error")
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-kiremit text-kagit" aria-label="hata">
        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="m4.5 4.5 7 7m0-7-7 7" strokeLinecap="round" />
        </svg>
      </span>
    );
  return <span className="size-5 shrink-0 rounded-full border-2 border-dashed border-kraft-koyu" aria-label="bekliyor" />;
}
