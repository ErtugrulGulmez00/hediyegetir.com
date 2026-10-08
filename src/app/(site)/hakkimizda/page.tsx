import type { Metadata } from "next";
import Link from "next/link";
import { HedisOpenButton } from "@/components/hedis/HedisDialog";
import { AtolyeVideo } from "@/components/site/AtolyeVideo";
import { GiftIcon } from "@/components/ui/Logo";
import { NotePaper } from "@/components/ui/NotePaper";
import { Scribble } from "@/components/ui/Scribble";
import { Stamp } from "@/components/ui/Stamp";
import { ORDER_INFO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hikâyemiz",
  description:
    "hediyegetir, KOSGEB desteğiyle kendi ayakları üzerinde durmaya çalışan bir kadın girişimcinin hediye dükkânı. Kendi ördüğü parçalar ve özenle seçilmiş hediyeler.",
  alternates: { canonical: "/hakkimizda" },
};

export default function AboutPage() {
  return (
    <article className="sayfa pt-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl">
          <Scribble>Hikâyemiz</Scribble>
        </h1>
        <p className="mt-3 font-el text-2xl text-murekkep-soluk">ilmek ilmek, kendi ayaklarımızın üzerinde</p>

        <div className="mt-10">
          <AtolyeVideo
            src="/videos/hakkimizda.mp4"
            poster="/videos/hakkimizda-kapak.jpg"
            label="Atölyeden kısa bir video: örgü ören kadın girişimci ve elde örülen ürünler"
            caption="atölyemizden bir an"
          />
        </div>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1fr_16rem]">
          <div className="space-y-10 text-[1.0625rem] leading-relaxed">
            <section>
              <h2 className="text-2xl sm:text-3xl">Bir kadın, bir yumak ve bir karar</h2>
              <p className="mt-3">
                hediyegetir, el emeğini kendi işine dönüştürmeye karar veren bir kadın girişimcinin hikâyesi. Çantalar, giysiler ve
                küçük güzellikler onun ellerinde, tek tek örülüyor; yanlarında da sevdiklerine gönül rahatlığıyla verebileceğin,
                özenle seçilmiş hediyeler var. El yapımı olanlar ürün sayfasındaki damgalarından tanınır.
              </p>
            </section>

            <NotePaper tilt={-0.5} tape="hardal">
              <h2 className="text-2xl sm:text-3xl">KOSGEB desteğiyle, kendi ayakları üzerinde</h2>
              <p className="mt-3">
                Bu küçük atölye, KOSGEB&apos;in girişimcilere verdiği destekle kuruldu. Amaç büyük bir fabrika olmak değil; emeğinin
                karşılığını alan, kendi ayakları üzerinde duran bir kadın olmak.
              </p>
              <p className="mt-3 font-semibold">
                Verdiğin her sipariş, bir kadının kendi işini büyütmesine doğrudan destek oluyor.
              </p>
            </NotePaper>

            <section>
              <h2 className="text-2xl sm:text-3xl">Nasıl çalışıyoruz?</h2>
              <ul className="mt-3 space-y-2">
                <li className="flex gap-2">
                  <span aria-hidden className="text-kiremit">
                    ✓
                  </span>
                  Siparişin gelince istediğin renkte örmeye başlıyoruz.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-kiremit">
                    ✓
                  </span>
                  Parçan {ORDER_INFO.leadTimeDays} iş günü içinde, özenle paketlenip kargoya veriliyor.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-kiremit">
                    ✓
                  </span>
                  Ödemeyi ve kargoyu WhatsApp&apos;ta birlikte netleştiriyoruz; sorularını birebir yanıtlıyoruz.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl sm:text-3xl">Bir hediye mi arıyorsun?</h2>
              <p className="mt-3">Rafları gezebilir ya da Hediş&apos;e kime hediye aldığını anlatabilirsin.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/" className="btn btn-ana">
                  Mağazaya göz at
                </Link>
                <HedisOpenButton className="btn btn-ikincil">Hediş&apos;e sor</HedisOpenButton>
              </div>
            </section>
          </div>

          <aside aria-hidden className="hidden flex-col items-center gap-6 pt-6 lg:flex">
            <GiftIcon className="size-32 -rotate-6 opacity-90" />
            <Stamp>kadın emeği</Stamp>
            <Stamp rotate={8}>El yapımı</Stamp>
          </aside>
        </div>
      </div>
    </article>
  );
}
