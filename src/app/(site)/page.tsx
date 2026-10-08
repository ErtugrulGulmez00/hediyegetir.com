import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HedisAutoOpen, HedisOpenButton } from "@/components/hedis/HedisDialog";
import { ShopContent, ShopSkeleton } from "@/components/site/ShopSection";
import { NotePaper } from "@/components/ui/NotePaper";
import { Scribble } from "@/components/ui/Scribble";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage(props: PageProps<"/">) {
  return (
    <div className="sayfa pt-6">
      {/* Ziyaretçiye oturum başına bir kez Hediş penceresini açar */}
      <HedisAutoOpen />
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h1 className="max-w-2xl text-[2.1rem] leading-[1.08] sm:text-5xl">
            Elde örülen, <Scribble>sevgiyle</Scribble> paketlenen hediyeler
          </h1>
          <p className="mt-4 font-el text-2xl text-murekkep-soluk">rengini sen seç, senin için örelim</p>
        </div>
        <div className="max-w-xs">
          <p className="text-[0.95rem] text-murekkep-soluk">Kime ne alacağını bilemiyor musun? Hediş birkaç soruda seçsin.</p>
          <HedisOpenButton className="btn btn-ikincil mt-3">Hediş&apos;e sor</HedisOpenButton>
        </div>
      </div>
      <Suspense fallback={<ShopSkeleton />}>
        <ShopContent searchParams={props.searchParams} />
      </Suspense>

      <section aria-labelledby="hikaye-baslik" className="mt-20">
        <NotePaper className="mx-auto max-w-3xl" tilt={-0.4} tape="hardal">
          <p className="font-el text-xl text-kiremit-koyu">bu dükkânın hikâyesi</p>
          <h2 id="hikaye-baslik" className="mt-1 text-2xl sm:text-3xl">
            Her ilmekte, kendi ayakları üzerinde duran bir kadının emeği var
          </h2>
          <p className="mt-3">
            hediyegetir, el emeğini kendi işine dönüştürmeye karar veren bir kadın girişimcinin, KOSGEB desteğiyle kurduğu küçük bir
            atölye. Sipariş verdiğin her parça onun ellerinde, senin için örülüyor.
          </p>
          <Link href="/hakkimizda" className="link-el mt-4 inline-block font-semibold">
            Hikâyemizi oku →
          </Link>
        </NotePaper>
      </section>
    </div>
  );
}
