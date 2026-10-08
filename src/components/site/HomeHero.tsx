import Image from "next/image";
import Link from "next/link";
import { HedisOpenButton } from "@/components/hedis/HedisDialog";
import { Mascot } from "@/components/hedis/Mascot";
import { Scribble } from "@/components/ui/Scribble";
import { Tape } from "@/components/ui/Tape";
import { getHeroProducts } from "@/lib/catalog";
import { ORDER_INFO } from "@/lib/site";

// Kolajdaki polaroidlerin yeri ve eğimi (sırası öne çıkan ürünlere göre)
const POLAROIDS = [
  { place: "left-[1%] top-[9%] w-[45%] -rotate-[7deg]", tape: "hardal", tapeAt: "-top-3 left-1/2 -translate-x-1/2" },
  { place: "right-[1%] top-0 w-[43%] rotate-[6deg]", tape: "gul", tapeAt: "-top-3 right-4" },
  { place: "left-[29%] bottom-[1%] z-20 w-[43%] -rotate-[2deg]", tape: "zeytin", tapeAt: "-top-3 left-3" },
] as const;

const icon = "size-5 shrink-0 text-kiremit";

/** Ana sayfanın başı: solda vaat ve düğmeler, sağda ürün fotoğraflarından polaroid kolaj. */
export async function HomeHero() {
  const products = await getHeroProducts();

  return (
    <section className="grid items-center gap-x-8 gap-y-10 pt-4 lg:grid-cols-[1.1fr_1fr] lg:pt-8">
      <div>
        <p className="inline-flex -rotate-2 items-center gap-2 rounded-full border-2 border-dashed border-kiremit/60 bg-kagit px-3.5 py-1 font-el text-xl text-kiremit-koyu">
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            <path d="M12 21s-7.5-4.6-7.5-10.2C4.5 7.6 6.9 5.5 9.4 5.5c1.3 0 2.2.6 2.6 1.4.4-.8 1.3-1.4 2.6-1.4 2.5 0 4.9 2.1 4.9 5.3C19.5 16.4 12 21 12 21Z" />
          </svg>
          özenle seçilir · sevgiyle paketlenir
        </p>
        <h1 className="mt-5 max-w-2xl text-[2.35rem] leading-[1.06] sm:text-6xl sm:leading-[1.04]">
          Sevdiklerin için <Scribble>sevgiyle</Scribble> paketlenen hediyeler
        </h1>
        <p className="mt-5 font-el text-2xl text-murekkep-soluk sm:text-3xl">kime ne alacağını bilemiyorsan Hediş&apos;e sor</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#urunler" className="btn btn-ana">
            Ürünlere göz at <span aria-hidden>↓</span>
          </a>
          <HedisOpenButton className="btn btn-ikincil">
            <Mascot mood="idle" decorative className="-my-2 size-8" />
            Hediş&apos;e sor
          </HedisOpenButton>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-[0.95rem] font-semibold text-murekkep-soluk">
          <li className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
              <rect x="3.5" y="9" width="17" height="11" rx="1" />
              <path d="M2.5 9h19M12 9v11M12 9c-1.5-3.5-6-4-6-1.5S10 9 12 9Zm0 0c1.5-3.5 6-4 6-1.5S14 9 12 9Z" />
            </svg>
            Hediye paketi seçeneği
          </li>
          <li className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
              <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" />
              <path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9" />
            </svg>
            {ORDER_INFO.leadTimeDays} iş gününde kargoda
          </li>
          <li className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
              <path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5H4.5v-10Z" />
            </svg>
            WhatsApp&apos;tan kolay sipariş
          </li>
        </ul>
      </div>

      {products.length > 0 && (
        <div className="relative mx-auto aspect-[1/0.92] w-full max-w-[21rem] sm:max-w-[30rem] lg:max-w-[34rem]">
          {/* zemin: yumuşak daire, hediye kutusu, kalpler ve kıvrılan kurdele */}
          <span aria-hidden className="absolute inset-[9%] rounded-full bg-hardal/20" />
          <svg aria-hidden viewBox="0 0 400 370" className="absolute inset-0 size-full overflow-visible">
            <path
              d="M18 300c40-30 70 10 110-20s30-80 80-90 80 40 120 10 40-90 70-110"
              fill="none"
              stroke="var(--color-kiremit)"
              strokeWidth="2.5"
              strokeDasharray="2 9"
              strokeLinecap="round"
              opacity=".55"
            />
            <g transform="translate(330 300) rotate(-10)" stroke="var(--color-murekkep)" strokeWidth="2.5" strokeLinejoin="round">
              <rect x="-24" y="-14" width="48" height="36" rx="2" fill="var(--color-gul)" />
              <rect x="-28" y="-24" width="56" height="12" rx="2" fill="var(--color-gul)" />
              <path d="M0-24v46" fill="none" />
              <path d="M0-24c-6-14-22-14-18-4 3 6 18 4 18 4Zm0 0c6-14 22-14 18-4-3 6-18 4-18 4Z" fill="var(--color-hardal)" />
            </g>
            <path d="M190 18c0-5 6-7 8.5-2.5 2.5-4.5 8.5-2.5 8.5 2.5 0 6-8.5 11-8.5 11s-8.5-5-8.5-11Z" fill="var(--color-kiremit)" opacity=".75" />
            <path d="M372 150c0-3.6 4.3-5 6-1.8 1.8-3.2 6-1.8 6 1.8 0 4.3-6 7.8-6 7.8s-6-3.5-6-7.8Z" fill="var(--color-gul)" />
            <path d="M14 120l2.6 6.4 6.4 2.6-6.4 2.6-2.6 6.4-2.6-6.4-6.4-2.6 6.4-2.6Z" fill="var(--color-hardal)" />
          </svg>

          {products.map((p, i) => {
            const spot = POLAROIDS[i];
            const img = p.images[0];
            return (
              <Link
                key={p.slug}
                href={`/urun/${p.slug}`}
                className={`kagit absolute block p-2 pb-9 transition-[rotate,translate] duration-300 hover:z-30 hover:-translate-y-1.5 hover:rotate-0 ${spot.place}`}
              >
                <Tape color={spot.tape} rotate={i % 2 ? 6 : -5} className={spot.tapeAt} />
                <span className="relative block aspect-[4/5] overflow-hidden bg-krem-koyu">
                  {img && (
                    <Image
                      src={img.url}
                      alt={img.alt || p.name}
                      fill
                      sizes="(min-width: 1024px) 15rem, (min-width: 640px) 13rem, 9rem"
                      className="object-cover"
                      priority={i === 0}
                    />
                  )}
                </span>
                <span className="absolute inset-x-2 bottom-1.5 truncate text-center font-el text-lg leading-tight sm:text-xl">
                  {p.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
