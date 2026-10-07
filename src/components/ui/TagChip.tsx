import Link from "next/link";

const base =
  "relative inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-[1.5px] border-murekkep py-1.5 pr-3.5 pl-6 text-[0.95rem] font-semibold transition-[background-color,transform] duration-150 select-none";
const shape = { clipPath: "polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%)" } as const;

function Hole() {
  return <span aria-hidden className="absolute top-1/2 left-2 size-1.5 -translate-y-1/2 rounded-full border border-murekkep bg-krem" />;
}

const tone = (active: boolean) =>
  active ? "bg-murekkep text-kagit" : "bg-kagit text-murekkep hover:bg-krem-koyu hover:-translate-y-px";

/** Hediye etiketi biçiminde seçim düğmesi (Hediş seçenekleri, filtreler). */
export function TagChip({
  active = false,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button type="button" aria-pressed={active} className={`${base} ${tone(active)} ${className}`} style={shape} {...props}>
      <Hole />
      {children}
    </button>
  );
}

/** Aynı görünüm, bağlantı olarak (mağaza filtreleri searchParams ile çalışır). */
export function TagLink({
  active = false,
  href,
  children,
  className = "",
}: {
  active?: boolean;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`${base} ${tone(active)} ${className}`}
      style={shape}
    >
      <Hole />
      {children}
    </Link>
  );
}
