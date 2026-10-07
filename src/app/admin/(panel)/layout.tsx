import { Suspense } from "react";
import { Logo } from "@/components/ui/Logo";
import { logoutAction } from "../actions";
import { AdminNav, AdminNavView } from "./AdminNav";

// Kenar menüsü statik. Oturum ve veri okuyan sayfa içeriği loading.tsx sınırları
// içinde akar; böylece sayfalar arası geçişte menü hemen görünür.
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="border-b-2 border-dashed border-kraft-koyu bg-krem-koyu/60 md:w-56 md:shrink-0 md:border-r-2 md:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:block md:px-5 md:py-6">
          <Logo />
          <p className="hidden font-el text-lg text-murekkep-soluk md:mt-1 md:block">yönetim masası</p>
        </div>
        <Suspense fallback={<AdminNavView pathname={null} />}>
          <AdminNav />
        </Suspense>
        <form action={logoutAction} className="hidden px-5 pt-8 pb-6 md:block">
          <button type="submit" className="text-sm text-murekkep-soluk underline-offset-2 hover:text-kiremit-koyu hover:underline">
            Çıkış yap
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 md:py-8">{children}</main>
    </div>
  );
}
