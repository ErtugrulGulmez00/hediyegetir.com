import Link from "next/link";
import { NotePaper } from "@/components/ui/NotePaper";
import { Scribble } from "@/components/ui/Scribble";

// Geçici giriş sayfası: Aşama 7'de Hediş asistanıyla değiştirilecek.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="max-w-2xl text-4xl sm:text-6xl">
        Kime hediye alacağını <Scribble>biz düşünelim</Scribble>.
      </h1>
      <NotePaper className="mt-12 max-w-md" lined>
        <p className="font-el text-2xl">Hediş yakında burada olacak.</p>
        <p className="mt-2">
          Şimdilik{" "}
          <Link href="/magaza" className="link-el font-semibold">
            mağazaya göz atabilirsin
          </Link>
          .
        </p>
      </NotePaper>
    </div>
  );
}
