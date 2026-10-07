"use client";

import Link from "next/link";
import { NotePaper } from "@/components/ui/NotePaper";

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <NotePaper className="max-w-md" lined tilt={-0.8} tape="kraft">
        <p className="font-el text-xl text-kiremit-koyu">kurdele düğüm oldu</p>
        <h1 className="mt-1 text-3xl">Bir şeyler ters gitti.</h1>
        <p className="mt-3">Sayfayı yüklerken bir sorun çıktı. Bir daha dener misin?</p>
        {error.digest && <p className="mt-2 text-xs text-murekkep-soluk">Hata kodu: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-ana" onClick={() => retry()}>
            Tekrar dene
          </button>
          <Link href="/" className="btn btn-ikincil">
            Mağazaya dön
          </Link>
        </div>
      </NotePaper>
    </div>
  );
}
