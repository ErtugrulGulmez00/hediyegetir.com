import type { Metadata } from "next";
import Link from "next/link";
import { HedisOpenButton } from "@/components/hedis/HedisDialog";
import { NotePaper } from "@/components/ui/NotePaper";
import { Scribble } from "@/components/ui/Scribble";
import { getSettings } from "@/lib/catalog";
import { ORDER_INFO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nasıl sipariş verilir?",
  description: `Online ödeme yok: sepetini WhatsApp'tan gönderirsin, renk ve ödemeyi birlikte netleştiririz, ${ORDER_INFO.leadTimeDays} iş gününde kargoda.`,
  alternates: { canonical: "/nasil-siparis-verilir" },
};

const STEPS = [
  {
    title: "Beğendiğin parçayı sepete ekle",
    text: "Kararsızsan Hediş birkaç soruyla sana uygun hediyeleri bulur.",
  },
  {
    title: "Siparişini WhatsApp'tan gönder",
    text: "Sepetin hazır bir mesaj olarak açılır. Renk tercihini ve hediye notunu sepette yazabilirsin.",
  },
  {
    title: "Birlikte netleştirelim",
    text: `Ödemeyi ve kargoyu WhatsApp'ta konuşuruz; parçan elde örülür ve ${ORDER_INFO.leadTimeDays} iş günü içinde kargoya verilir.`,
  },
];

// Yayından önce site sahibiyle netleştir: ödeme yöntemleri, kargo ücreti (ORDER_INFO.shipping), iade/değişim koşulları.
const FAQ = [
  {
    q: "Ödemeyi nasıl yapıyorum?",
    a: "Sitede kart bilgisi istemiyoruz. Ödeme yöntemini sipariş sırasında WhatsApp'ta birlikte netleştiriyoruz.",
  },
  {
    q: "Siparişim ne zaman kargoya verilir?",
    a: `Siparişin netleştikten sonra parçan elde örülür ve ${ORDER_INFO.leadTimeDays} iş günü içinde kargoya verilir.`,
  },
  { q: "Kargo ücreti ne kadar?", a: `${ORDER_INFO.shipping}.` },
  {
    q: "Renk seçebilir miyim?",
    a: "Evet. Parçaların çoğunu istediğin renkte örebiliyoruz; renk tercihini sepette not olarak yazman yeterli.",
  },
  {
    q: "Hediye paketi yapıyor musunuz?",
    a: "Evet. Sepette “Hediye olarak paketlensin” kutusunu işaretle; istersen pakete eklenecek notunu da yaz.",
  },
  {
    q: "İade ya da değişim yapabilir miyim?",
    a: "Parçalar senin için, istediğin renkte örüldüğünden iade ve değişim koşullarını sipariş sırasında WhatsApp'ta açıkça konuşuyoruz.",
  },
];

export default async function HowToOrderPage() {
  const settings = await getSettings();
  return (
    <article className="sayfa pt-6">
      <h1 className="text-4xl sm:text-5xl">
        Nasıl <Scribble>sipariş</Scribble> verilir?
      </h1>
      <p className="mt-3 font-el text-2xl text-murekkep-soluk">online ödeme yok, üç adımda tamam</p>

      <ol className="mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <NotePaper className="h-full" tilt={i % 2 ? 0.6 : -0.6} tape={(["gul", "hardal", "zeytin"] as const)[i]}>
              <p className="font-el text-3xl text-kiremit-koyu">{i + 1}.</p>
              <h2 className="mt-1 text-xl">{s.title}</h2>
              <p className="mt-2 text-murekkep/90">{s.text}</p>
            </NotePaper>
          </li>
        ))}
      </ol>

      <section aria-labelledby="sss-baslik" className="mt-16 max-w-3xl">
        <h2 id="sss-baslik" className="text-3xl">
          Sık sorulanlar
        </h2>
        <div className="mt-5 divide-y-2 divide-dashed divide-kraft-koyu border-y-2 border-dashed border-kraft-koyu">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="text-xl text-kiremit transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-4 text-murekkep/90">{f.a}</p>
            </details>
          ))}
          <details className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
              Sorum var, size nasıl ulaşırım?
              <span aria-hidden className="text-xl text-kiremit transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-4 text-murekkep/90">
              {settings.whatsappNumber ? (
                <>
                  <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener" className="link-el font-semibold">
                    WhatsApp&apos;tan yaz
                  </a>
                  ; sorularını birebir yanıtlıyoruz.
                </>
              ) : (
                "Ürün sayfalarındaki “WhatsApp'tan sor” düğmesiyle bize yazabilirsin."
              )}
              {settings.instagramUrl && (
                <>
                  {" "}
                  Instagram&apos;da da{" "}
                  <a href={settings.instagramUrl} target="_blank" rel="noopener" className="link-el font-semibold">
                    bizi takip edebilirsin
                  </a>
                  .
                </>
              )}
            </p>
          </details>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-ana">
          Mağazaya göz at
        </Link>
        <HedisOpenButton className="btn btn-ikincil">Hediş&apos;e sor</HedisOpenButton>
      </div>
    </article>
  );
}
