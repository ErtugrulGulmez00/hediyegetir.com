// Admin formlarında ortak küçük parçalar (sunucu ve istemci bileşenlerinde kullanılabilir).

/** Genişlik içermez; dar alanlarda (ör. sıra numarası) genişliği çağıran verir */
export const inputBase =
  "rounded-md border-2 border-murekkep/70 bg-kagit px-3 py-2 text-base outline-none focus:border-murekkep focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-kiremit";

export const inputClass = `w-full ${inputBase}`;

export function Field({
  label,
  labelExtra,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  /** Etiketin yanında gösterilecek ek (ör. AI rozeti) */
  labelExtra?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="flex items-center text-sm font-bold">
        {label}
        {labelExtra}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-murekkep-soluk">{hint}</span>}
      {error && <span className="text-sm font-semibold text-kiremit-koyu">{error}</span>}
    </label>
  );
}

export function Panel({ title, children, className = "", action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`kagit rounded-sm p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-baslik text-xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl">{children}</h1>
      {action}
    </div>
  );
}

export function Badge({ tone = "soluk", children }: { tone?: "soluk" | "zeytin" | "kiremit" | "hardal"; children: React.ReactNode }) {
  const tones = {
    soluk: "bg-krem-koyu text-murekkep",
    zeytin: "bg-zeytin text-kagit",
    kiremit: "bg-kiremit text-kagit",
    hardal: "bg-hardal text-murekkep",
  };
  return <span className={`inline-block rounded-sm px-1.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function Flash({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mb-5 border-l-4 border-zeytin bg-kagit px-4 py-3 font-semibold">
      {children}
    </p>
  );
}
