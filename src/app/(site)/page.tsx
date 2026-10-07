import type { Metadata } from "next";
import { HedisChat } from "@/components/hedis/HedisChat";
import { Scribble } from "@/components/ui/Scribble";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <h1 className="max-w-3xl text-[2.1rem] leading-[1.08] sm:text-6xl">
        Kime ne alacağını bilemedin mi? <Scribble>Hediş&apos;e sor</Scribble>.
      </h1>
      <p className="mt-4 max-w-xl text-murekkep-soluk sm:text-lg">
        Birkaç soruya cevap ver, el yapımı ürünlerimiz arasından sana uygun beş hediye seçsin.
      </p>
      <div className="mt-10 sm:mt-14">
        <HedisChat />
      </div>
    </div>
  );
}
