import { Suspense } from "react";
import { HedisDialog, HedisLauncher } from "@/components/hedis/HedisDialog";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { VisitTracker } from "@/components/site/VisitTracker";
import { CartHydrator } from "@/store/cart";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-kagit focus:px-3 focus:py-2"
      >
        İçeriğe geç
      </a>
      <SiteHeader />
      <main id="icerik" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CartHydrator />
      <HedisLauncher />
      {/* usePathname istek anında bilinir; statik kabuğu bekletmesin */}
      <Suspense fallback={null}>
        <VisitTracker />
        <HedisDialog />
      </Suspense>
    </>
  );
}
