"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HEDIS_SEEN_KEY, useHedisDialog } from "@/store/hedis";
import { useStickyBuyBar } from "@/store/ui";
import { HedisChat } from "./HedisChat";
import { HedisRehber } from "./HedisRehber";
import { Mascot } from "./Mascot";

type Mode = { kind: "ai" } | { kind: "rehber"; recipient: string | null; switched: boolean };

/**
 * Site genelindeki Hediş penceresi. Yerel <dialog> kullanır: odak pencere içinde kalır,
 * Esc ve arka plana tıklama kapatır, kapanınca odak açan düğmeye döner.
 * Yapay zeka yoksa (ya da sohbet bir sorun yüzünden açılamazsa) seçenekli rehber moda geçer.
 */
export function HedisDialog({ aiOnline }: { aiOnline: boolean }) {
  const open = useHedisDialog((s) => s.open);
  const closeHedis = useHedisDialog((s) => s.closeHedis);
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  // Sohbet ilk açılışta kurulur, sonra kapatıp açınca kaldığı yerden devam eder
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>(aiOnline ? { kind: "ai" } : { kind: "rehber", recipient: null, switched: false });

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
        {mounted &&
          (mode.kind === "ai" ? (
            <HedisChat onBrowseShop={browseShop} onFallback={(recipient) => setMode({ kind: "rehber", recipient, switched: true })} />
          ) : (
            <HedisRehber onBrowseShop={browseShop} initialRecipient={mode.recipient} switched={mode.switched} />
          ))}
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

/**
 * Sağ altta duran, Hediş'i yeniden açan maskot düğmesi. Üst menü (içinde Hediş düğmesi var) görünürken
 * gizlenir ki aynı düğme ekranda iki kez durmasın; sepette ödeme özetinin üstüne binmesin diye hiç çıkmaz.
 */
export function HedisLauncher() {
  const open = useHedisDialog((s) => s.open);
  const openHedis = useHedisDialog((s) => s.openHedis);
  const pathname = usePathname();
  const lifted = useStickyBuyBar((s) => s.visible);
  const [headerGone, setHeaderGone] = useState(false);

  useEffect(() => {
    const header = document.getElementById("site-ust");
    if (!header) return;
    const io = new IntersectionObserver(([entry]) => setHeaderGone(!entry.isIntersecting));
    io.observe(header);
    return () => io.disconnect();
  }, []);

  const visible = !open && headerGone && pathname !== "/sepet";
  return (
    <button
      type="button"
      onClick={openHedis}
      aria-label="Hediş, hediye asistanı"
      inert={!visible}
      // Gizliyken visibility:hidden (solma bitince devreye girer): odaklanılamaz, ekran okuyucu da görmez
      className={`group fixed right-3 z-40 flex items-center gap-2 rounded-full border-2 border-murekkep bg-kagit py-1 pr-4 pl-1 shadow-baski transition-[translate,opacity,bottom,visibility] duration-200 hover:-translate-y-0.5 sm:right-5 sm:bottom-5 ${
        lifted ? "bottom-[5.5rem]" : "bottom-3"
      } ${visible ? "visible opacity-100" : "invisible translate-y-3 opacity-0"}`}
    >
      <Mascot mood="idle" decorative className="size-11 transition-transform group-hover:-rotate-6" />
      <span className="flex flex-col items-start text-left leading-tight">
        <span className="text-[0.95rem] font-bold">Hediş</span>
        <span className="text-xs font-semibold text-murekkep-soluk">hediye asistanı</span>
      </span>
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
