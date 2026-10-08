import Link from "next/link";
import { ORDER_INFO } from "@/lib/site";

const icon = "mt-0.5 size-5 shrink-0 text-kiremit";

/** Ürün sayfasında "Sepete ekle"nin altında: nasıl üretilir, ne zaman kargoda, ödeme nasıl. */
export function OrderInfo({ className = "", handmade = false }: { className?: string; handmade?: boolean }) {
  return (
    <div className={`border-y-2 border-dashed border-kraft-koyu py-4 text-[0.95rem] ${className}`}>
      <ul className="flex flex-col gap-2.5">
        {handmade && (
          <li className="flex gap-3">
            <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="12" r="8.5" />
              <path d="M5.5 8.5c4 0 9 2.5 11.5 7.5M4 13c3.5-.5 8 1 10 5.5M9 3.8c1.5 3 5.5 6 11.3 6.7" strokeLinecap="round" />
            </svg>
            <span>
              <strong>Senin için elde yapılır.</strong> Renk ya da kişiye özel isteğini sepette not olarak yazman yeterli.
            </span>
          </li>
        )}
        <li className="flex gap-3">
          <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
            <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" />
            <path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9" />
          </svg>
          <span>
            <strong>{ORDER_INFO.leadTimeDays} iş gününde kargoda.</strong>
          </span>
        </li>
        <li className="flex gap-3">
          <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
            <path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5H4.5v-10Z" />
          </svg>
          <span>{ORDER_INFO.shipping}; şimdi ödeme alınmaz.</span>
        </li>
      </ul>
      <Link href="/nasil-siparis-verilir" className="link-el mt-3 inline-block text-sm font-semibold">
        Nasıl sipariş verilir?
      </Link>
    </div>
  );
}
