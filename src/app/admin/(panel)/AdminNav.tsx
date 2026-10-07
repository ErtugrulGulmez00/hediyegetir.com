"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "../actions";

const LINKS = [
  { href: "/admin", label: "Özet" },
  { href: "/admin/urunler", label: "Ürünler" },
  { href: "/admin/kategoriler", label: "Kategoriler" },
  { href: "/admin/ikas", label: "ikas senkronu" },
  { href: "/admin/ayarlar", label: "Ayarlar" },
];

/** Aktif sayfayı işaretleyen menü. Layout'ta Suspense içinde kullanılır (usePathname istek anında bilinir). */
export function AdminNav() {
  return <AdminNavView pathname={usePathname()} />;
}

/** pathname null ise hiçbir bağlantı aktif görünmez (Suspense yedeği). */
export function AdminNavView({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Yönetim menüsü" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3 md:pb-0">
      {LINKS.map((l) => {
        const active = pathname != null && (l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-sm px-3 py-2 text-[0.95rem] font-semibold whitespace-nowrap ${
              active ? "bg-murekkep text-kagit" : "hover:bg-kraft/50"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
      <Link href="/" className="shrink-0 rounded-sm px-3 py-2 text-[0.95rem] whitespace-nowrap text-murekkep-soluk hover:bg-kraft/50">
        Siteyi aç ↗
      </Link>
      <form action={logoutAction} className="shrink-0 md:hidden">
        <button type="submit" className="rounded-sm px-3 py-2 text-[0.95rem] whitespace-nowrap text-murekkep-soluk">
          Çıkış
        </button>
      </form>
    </nav>
  );
}
