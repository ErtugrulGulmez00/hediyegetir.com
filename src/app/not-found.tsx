import Link from "next/link";
import { GiftIcon, Logo } from "@/components/ui/Logo";
import { NotePaper } from "@/components/ui/NotePaper";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
      <Logo />
      <div className="mt-16 grid items-center gap-10 sm:grid-cols-[auto_1fr]">
        <GiftIcon className="size-32 -rotate-12 opacity-80" />
        <NotePaper lined tilt={0.8}>
          <p className="font-el text-xl text-kiremit-koyu">404 · iade edildi</p>
          <h1 className="mt-1 text-3xl">Bu paket adrese ulaşamadı.</h1>
          <p className="mt-3">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="btn btn-ana">
              Mağazaya dön
            </Link>
          </div>
        </NotePaper>
      </div>
    </div>
  );
}
