"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HEDIS_SEEN_KEY, useHedisDialog } from "@/store/hedis";
import { HedisChat } from "./HedisChat";
import { Mascot } from "./Mascot";

/**
 * Site genelindeki Hediş penceresi. Yerel <dialog> kullanır: odak pencere içinde kalır,
 * Esc ve arka plana tıklama kapatır, kapanınca odak açan düğmeye döner.
 */
export function HedisDialog() {
  const open = useHedisDialog((s) => s.open);
  const closeHedis = useHedisDialog((s) => s.closeHedis);
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  // Sohbet ilk açılışta kurulur, sonra kapatıp açınca kaldığı yerden devam eder
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setMounted(true);
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Başka sayfaya geçilince (ör. önerilen ürüne tıklanınca) kapan
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    closeHedis();
  }, [pathname, closeHedis]);

  const browseShop = useCallback(() => {
    closeHedis();
    if (pathname !== "/") router.push("/#urunler");
    else document.getElementById("urunler")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [closeHedis, pathname, router]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="hedis-pencere-baslik"
      onClose={closeHedis}
      // Yalnızca arka plana (dialog'un kendisine) tıklanınca kapan
      onClick={(e) => {
        if (e.target === e.currentTarget) closeHedis();
      }}
      className="hedis-pencere m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-murekkep/55 sm:m-auto sm:h-fit sm:max-h-[92dvh] sm:w-[calc(100%-3rem)] sm:max-w-4xl"
    >
      <div className="relative min-h-full bg-krem px-4 pt-4 pb-10 sm:rounded-sm sm:border-2 sm:border-murekkep sm:px-8 sm:pt-6 sm:shadow-baski">
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-3 border-b-2 border-dashed border-kraft-koyu bg-krem px-4 py-2 sm:-mx-8 sm:px-8">
          {/* Açılışta odak başlığa gelsin: ekran okuyucu pencereyi duyurur, Kapat butonunda göze batan çerçeve çıkmaz */}
          <p
            id="hedis-pencere-baslik"
            tabIndex={-1}
            autoFocus
            className="flex items-center gap-2 font-el text-2xl text-kiremit-koyu outline-none"
          >
            <Mascot mood="idle" decorative className="size-9" />
            Hediş&apos;e sor
          </p>
          <button
            type="button"
            onClick={closeHedis}
            className="rounded-md border-2 border-murekkep bg-kagit px-3 py-1.5 text-sm font-bold shadow-baski-sm hover:bg-krem-koyu"
          >
            Kapat <span aria-hidden>✕</span>
          </button>
        </div>
        {mounted && <HedisChat onBrowseShop={browseShop} />}
      </div>
    </dialog>
  );
}

/** Ana sayfaya gelen ziyaretçiye, oturum başına bir kez Hediş'i açar. */
export function HedisAutoOpen() {
  const openHedis = useHedisDialog((s) => s.openHedis);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(HEDIS_SEEN_KEY) === "1") return;
    } catch {
      // depolama kapalıysa yine de aç
    }
    // İşaret pencere gerçekten açılırken konur; zamanlayıcı iptal edilirse (ör. hızlı sayfa
    // değişimi ya da geliştirmede efektin çift çalışması) bir sonraki sefere kalır.
    const id = setTimeout(() => {
      try {
        sessionStorage.setItem(HEDIS_SEEN_KEY, "1");
      } catch {
        // yoksay
      }
      openHedis();
    }, 700);
    return () => clearTimeout(id);
  }, [openHedis]);
  return null;
}

/** Sağ altta duran, Hediş'i yeniden açan küçük maskot düğmesi. */
export function HedisLauncher() {
  const open = useHedisDialog((s) => s.open);
  const openHedis = useHedisDialog((s) => s.openHedis);
  if (open) return null;
  return (
    <button
      type="button"
      onClick={openHedis}
      className="group fixed right-3 bottom-3 z-40 flex items-center gap-2 rounded-full border-2 border-murekkep bg-kagit py-1 pr-4 pl-1 font-bold shadow-baski transition-transform hover:-translate-y-0.5 sm:right-5 sm:bottom-5"
    >
      <Mascot mood="idle" decorative className="size-11 transition-transform group-hover:-rotate-6" />
      <span className="text-[0.95rem]">Hediş&apos;e sor</span>
    </button>
  );
}

/** Menü ve alt bilgi gibi yerlerde Hediş'i açan metin düğmesi. */
export function HedisOpenButton({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const openHedis = useHedisDialog((s) => s.openHedis);
  return (
    <button type="button" onClick={openHedis} className={className}>
      {children}
    </button>
  );
}
