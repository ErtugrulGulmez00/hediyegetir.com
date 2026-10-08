"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHedisDialog } from "@/store/hedis";

export function NavLinks() {
  const pathname = usePathname();
  const openHedis = useHedisDialog((s) => s.openHedis);
  const shopActive = pathname === "/";
  const item = "px-1.5 py-2 text-[0.95rem] font-semibold whitespace-nowrap sm:px-2 sm:text-base";

  return (
    <nav aria-label="Ana menü" className="flex items-center sm:gap-3">
      {/* Dar telefonlarda logo + menü + sepet tek satıra sığsın diye kısa etiketler */}
      <button type="button" onClick={openHedis} className={`${item} text-murekkep-soluk hover:text-murekkep`}>
        <span className="sm:hidden">Hediş</span>
        <span className="hidden sm:inline">Hediş · hediye asistanı</span>
      </button>
      <Link
        href="/"
        aria-current={shopActive ? "page" : undefined}
        className={`${item} ${shopActive ? "link-el" : "text-murekkep-soluk hover:text-murekkep"}`}
      >
        Mağaza
      </Link>
    </nav>
  );
}
