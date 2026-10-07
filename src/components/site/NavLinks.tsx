"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Hediş'e sor", short: "Hediş" },
  { href: "/magaza", label: "Mağaza", short: "Mağaza" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Ana menü" className="flex items-center sm:gap-3">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`px-1.5 py-2 text-[0.95rem] font-semibold whitespace-nowrap sm:px-2 sm:text-base ${
              active ? "link-el" : "text-murekkep-soluk hover:text-murekkep"
            }`}
          >
            {/* Dar telefonlarda logo + menü + sepet tek satıra sığsın */}
            <span className="sm:hidden">{l.short}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
