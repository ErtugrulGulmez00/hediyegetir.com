"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { confirmDialog } from "@/store/confirm";

/**
 * Kaydedilmemiş değişiklik varken sayfadan ayrılmadan önce sorar. Site içi bağlantılarda sitenin kendi
 * onay penceresi çıkar; sekme kapatma/yenilemede (beforeunload) tarayıcı kendi uyarısını gösterir,
 * onun görünümü değiştirilemez. Tarayıcının geri tuşu yakalanamaz.
 */
export function useUnsavedChangesGuard(active: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Eski tarayıcılar uyarıyı ancak returnValue doluysa gösterir
      e.returnValue = "";
    };

    // Yakalama aşamasında: Next'in <Link> yönlendirmesinden önce çalışır. Gezinme durdurulur,
    // onay gelirse elle yönlendirilir.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      // Dış bağlantıda beforeunload devreye girer; aynı sayfadaki çapa bağlantıları sorun değil
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      e.stopPropagation();
      void confirmDialog({
        title: "Kaydedilmemiş değişiklikler var",
        message: "Sayfadan çıkarsan yaptığın değişiklikler kaybolacak.",
        confirmLabel: "Kaydetmeden çık",
        cancelLabel: "Sayfada kal",
        danger: true,
      }).then((ok) => {
        if (!ok) return;
        window.removeEventListener("beforeunload", onBeforeUnload);
        router.push(url.pathname + url.search + url.hash);
      });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active, router]);
}
