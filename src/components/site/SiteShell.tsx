import { Suspense } from "react";
import { HedisDialog, HedisLauncher } from "@/components/hedis/HedisDialog";
import { aiConfigured } from "@/lib/ai/client";
import { CartHydrator } from "@/store/cart";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { VisitTracker } from "./VisitTracker";

/** Vitrinin ortak kabuğu: üst bilgi, alt bilgi, sepet ve Hediş. (site) layout'u ve 404 sayfası kullanır. */
export function SiteShell({ children }: { children: React.ReactNode }) {
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
      {/* usePathname istek anında bilinir; statik kabuğu bekletmesin */}
      <Suspense fallback={null}>
        <VisitTracker />
        <HedisLauncher />
        <HedisDialog aiOnline={aiConfigured()} />
      </Suspense>
    </>
  );
}
