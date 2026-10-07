"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Hediş'e sor" },
  { href: "/magaza", label: "Mağaza" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Ana menü" className="flex items-center gap-1 sm:gap-3">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`px-2 py-2 text-[0.95rem] font-semibold sm:text-base ${
              active ? "link-el" : "text-murekkep-soluk hover:text-murekkep"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
