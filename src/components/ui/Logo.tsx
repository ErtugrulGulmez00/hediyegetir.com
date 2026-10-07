import Link from "next/link";

export function GiftIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M5.5 13.5h21v14h-21z" fill="var(--color-kraft)" />
      <path d="M4 9.5h24v4H4z" fill="var(--color-kraft)" />
      <path d="M16 9.5v18" stroke="var(--color-kiremit)" strokeWidth="2.6" />
      <path d="M16 9.3c-2-4.5-7.5-6-8.3-3.2-.7 2.6 4.3 3.3 8.3 3.2Zm0 0c2-4.5 7.5-6 8.3-3.2.7 2.6-4.3 3.3-8.3 3.2Z" stroke="var(--color-kiremit)" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-end gap-1.5 ${className}`} aria-label="hediyegetir ana sayfa">
      <GiftIcon className="size-7 -rotate-6 sm:size-8 transition-transform group-hover:rotate-3" />
      <span className="font-baslik text-[1.35rem] leading-none sm:text-[1.6rem] font-semibold tracking-tight">
        hediye<span className="font-el text-[1.6rem] font-bold sm:text-[1.9rem] text-kiremit">getir</span>
      </span>
    </Link>
  );
}
