"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HEDIS_SEEN_KEY, useHedisDialog } from "@/store/hedis";
import { useStickyBuyBar } from "@/store/ui";
import { HedisChat } from "./HedisChat";
import { HedisRehber } from "./HedisRehber";
import { Mascot } from "./Mascot";

type Mode = { kind: "ai" } | { kind: "rehber"; recipient: string | null; switched: boolean };

/** Pencere bundan uzun kapalı kaldıysa yeniden açılınca "devam edelim mi?" diye sorulur */
const ASK_RESUME_AFTER_MS = 2 * 60_000;
/** Bundan uzun kapalı kaldıysa sohbet kendiliğinden baştan başlar */
const RESET_AFTER_MS = 30 * 60_000;

const startMode = (aiOnline: boolean): Mode => (aiOnline ? { kind: "ai" } : { kind: "rehber", recipient: null, switched: false });

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
  const [mode, setMode] = useState<Mode>(() => startMode(aiOnline));
  // Sohbetin anahtarı: değişince sohbet sıfırdan kurulur
  const [session, setSession] = useState(0);
  const [askResume, setAskResume] = useState(false);
  const closedAt = useRef<number | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      const away = closedAt.current == null ? 0 : Date.now() - closedAt.current;
      if (away > RESET_AFTER_MS) {
        setSession((n) => n + 1);
        setMode(startMode(aiOnline));
        setAskResume(false);
      } else {
        setAskResume(away > ASK_RESUME_AFTER_MS);
      }
      setMounted(true);
      d.showModal();
    } else if (!open) {
      // Esc ya da dışarı tıklamayla pencere zaten kapanmış olabilir; kapanma anı her durumda kaydedilir
      closedAt.current = Date.now();
      if (d.open) d.close();
    }
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open, aiOnline]);

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
      // Çerçeve yok: Hediş, balonlar, düğmeler ve kartlar dışında bir yere tıklanınca kapan
      onClick={(e) => {
        const target = e.target as Element;
        if (!target.closest("button, a, input, textarea, select, label, svg, [data-yuzey]")) closeHedis();
      }}
      className="hedis-pencere m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-transparent p-0 backdrop:bg-murekkep/85 backdrop:backdrop-blur-[3px]"
    >
      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        {/* Görünür başlık yok; ekran okuyucu pencereyi bu başlıkla duyurur, açılışta odak buraya gelir */}
        <h2 id="hedis-pencere-baslik" tabIndex={-1} autoFocus className="sr-only">
          Hediş&apos;e sor
        </h2>
        {/* Yalnızca klavyeyle odaklanınca görünür; fareyle dışarı tıklamak ya da Esc de kapatır */}
        <button
          type="button"
          onClick={closeHedis}
          className="sr-only rounded-md border-2 border-murekkep bg-kagit px-3 py-1.5 text-sm font-bold focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-30"
        >
          Kapat <span aria-hidden>✕</span>
        </button>
        {mounted &&
          (mode.kind === "ai" ? (
            <HedisChat
              key={session}
              onBrowseShop={browseShop}
              onFallback={(recipient) => setMode({ kind: "rehber", recipient, switched: true })}
              askResume={askResume}
              onResumeAnswered={() => setAskResume(false)}
            />
          ) : (
            <HedisRehber key={session} onBrowseShop={browseShop} initialRecipient={mode.recipient} switched={mode.switched} />
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
