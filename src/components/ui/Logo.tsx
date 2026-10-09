import Link from "next/link";
import { Mascot } from "@/components/hedis/Mascot";

/** Site logosu: Hediş robotu + "hediyegetir" yazısı */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className}`} aria-label="hediyegetir ana sayfa">
      <Mascot decorative className="size-8 transition-transform group-hover:-rotate-6 sm:size-9" />
      <span className="font-baslik text-[1.35rem] leading-none sm:text-[1.6rem] font-semibold tracking-tight">
        hediye<span className="font-el text-[1.6rem] font-bold sm:text-[1.9rem] text-kiremit">getir</span>
      </span>
    </Link>
  );
}
