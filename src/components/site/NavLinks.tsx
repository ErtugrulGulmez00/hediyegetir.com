"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mascot } from "@/components/hedis/Mascot";
import { useHedisDialog } from "@/store/hedis";

const item =
  "inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors sm:px-3 sm:text-[0.95rem]";
const tone = (active: boolean) => (active ? "bg-murekkep text-kagit" : "text-murekkep hover:bg-krem-koyu");
// Dar ekranda yer açmak için yalnızca maskot kalır, diğer ikonlar gizlenir
const icon = "hidden size-4 shrink-0 sm:block";

/**
 * Üst menü: kağıt rengi hap biçimli çubuk. Masaüstünde logonun yanında, mobilde logonun altında
 * ikinci satırda (sığmazsa yana kayar). Bulunulan sayfa koyu dolgulu görünür.
 */
export function NavLinks() {
  const pathname = usePathname();
  const openHedis = useHedisDialog((s) => s.openHedis);
  const shop = pathname === "/" || pathname.startsWith("/kategori") || pathname.startsWith("/urun");
  const order = pathname === "/nasil-siparis-verilir";
  const story = pathname === "/hakkimizda";

  return (
    <nav
      aria-label="Ana menü"
      className="order-3 -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none] md:order-2 md:mx-0 md:w-auto md:overflow-visible md:p-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="mx-auto flex w-max items-center gap-0.5 rounded-full border-2 border-murekkep bg-kagit p-1 shadow-baski-sm md:mx-0">
        <li>
          <Link href="/" aria-current={shop ? "page" : undefined} className={`${item} ${tone(shop)}`}>
            <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
              <path d="M4 10.5 5.5 4.5h13l1.5 6M4 10.5h16M4 10.5c0 1.7 1.3 3 3 3s3-1.3 3-3m-6 0V20h16v-9.5m-10 0c0 1.7 1.3 3 3 3s3-1.3 3-3m0 0c0 1.7 1.3 3 3 3s3-1.3 3-3" />
            </svg>
            Mağaza
          </Link>
        </li>
        <li>
          <button type="button" onClick={openHedis} className={`${item} bg-hardal/35 text-murekkep hover:bg-hardal/60`}>
            <Mascot mood="idle" decorative className="-my-1 size-6 shrink-0" />
            <span className="lg:hidden">Hediş</span>
            <span className="hidden lg:inline">Hediş · hediye asistanı</span>
          </button>
        </li>
        <li>
          <Link href="/nasil-siparis-verilir" aria-current={order ? "page" : undefined} className={`${item} ${tone(order)}`}>
            <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
              <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" />
              <path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9" />
            </svg>
            <span className="lg:hidden">Sipariş nasıl?</span>
            <span className="hidden lg:inline">Nasıl sipariş verilir?</span>
          </Link>
        </li>
        <li>
          <Link href="/hakkimizda" aria-current={story ? "page" : undefined} className={`${item} ${tone(story)}`}>
            <svg viewBox="0 0 24 24" className={icon} fill="currentColor" aria-hidden>
              <path d="M12 21s-7.5-4.6-7.5-10.2C4.5 7.6 6.9 5.5 9.4 5.5c1.3 0 2.2.6 2.6 1.4.4-.8 1.3-1.4 2.6-1.4 2.5 0 4.9 2.1 4.9 5.3C19.5 16.4 12 21 12 21Z" />
            </svg>
            Hikâyemiz
          </Link>
        </li>
      </ul>
    </nav>
  );
}
