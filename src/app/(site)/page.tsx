import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HedisAutoOpen } from "@/components/hedis/HedisDialog";
import { HomeHero } from "@/components/site/HomeHero";
import { ShopContent, ShopSkeleton } from "@/components/site/ShopSection";
import { NotePaper } from "@/components/ui/NotePaper";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage(props: PageProps<"/">) {
  return (
    <div className="sayfa pt-6">
      {/* Ziyaretçiye oturum başına bir kez Hediş penceresini açar */}
      <HedisAutoOpen />
      <HomeHero />
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
