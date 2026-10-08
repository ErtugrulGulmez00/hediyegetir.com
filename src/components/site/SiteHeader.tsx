import { Logo } from "@/components/ui/Logo";
import { ORDER_INFO } from "@/lib/site";
import { CartLink } from "./CartLink";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    // id: yüzen Hediş düğmesi, üst menü ekrandan çıkınca görünür (HedisLauncher)
    <header id="site-ust">
      <p className="bg-murekkep px-4 py-1.5 text-center font-el text-lg leading-tight text-krem">
        {ORDER_INFO.leadTimeDays} iş gününde kargoda
        <span className="hidden sm:inline"> · sipariş ve ödeme WhatsApp&apos;tan</span>
      </p>
      {/* Mobilde menü çubuğu logo ve sepetin altında ikinci satıra iner (NavLinks'teki order) */}
      <div className="sayfa flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-4 pb-2 md:flex-nowrap md:pb-4">
        <div className="order-1">
          <Logo />
        </div>
        <NavLinks />
        <div className="order-2 md:order-3">
          <CartLink />
        </div>
      </div>
    </header>
  );
}
