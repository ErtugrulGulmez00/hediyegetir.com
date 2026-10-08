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
      <div className="sayfa flex items-center justify-between gap-2 py-4">
        <Logo />
        <div className="flex items-center gap-1.5 sm:gap-4">
          <NavLinks />
          <CartLink />
        </div>
      </div>
    </header>
  );
}
