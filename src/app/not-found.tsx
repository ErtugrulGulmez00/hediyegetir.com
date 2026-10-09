import type { Metadata } from "next";
import Link from "next/link";
import { HedisOpenButton } from "@/components/hedis/HedisDialog";
import { SiteShell } from "@/components/site/SiteShell";
import { Mascot } from "@/components/hedis/Mascot";
import { NotePaper } from "@/components/ui/NotePaper";

export const metadata: Metadata = { title: "Sayfa bulunamadı" };

// Kökteki 404, (site) layout'unun dışında render edilir; kabuğu (header, footer, sepet) kendisi kurar.
export default function NotFound() {
  return (
    <SiteShell>
      <div className="sayfa pt-6">
        <div className="mx-auto mt-6 grid max-w-3xl items-center gap-10 sm:mt-10 sm:grid-cols-[auto_1fr]">
          {/* Hediş düşünüyor: sayfayı bulamadı */}
          <Mascot mood="thinking" decorative rich className="mx-auto size-36" />
          <NotePaper lined tilt={0.8}>
            <p className="font-el text-xl text-kiremit-koyu">404 · iade edildi</p>
            <h1 className="mt-1 text-3xl">Bu paket adrese ulaşamadı.</h1>
            <p className="mt-3">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="btn btn-ana">
                Mağazaya dön
              </Link>
              <HedisOpenButton className="btn btn-ikincil">Hediş&apos;e sor</HedisOpenButton>
            </div>
          </NotePaper>
        </div>
      </div>
    </SiteShell>
  );
}
