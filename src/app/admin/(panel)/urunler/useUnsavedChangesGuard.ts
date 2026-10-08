"use client";

import { useEffect } from "react";

const MESSAGE = "Kaydedilmemiş değişikliklerin var. Sayfadan çıkarsan kaybolacak. Yine de çıkılsın mı?";

/**
 * Kaydedilmemiş değişiklik varken sayfadan ayrılmadan önce sorar: sekme kapatma/yenileme
 * (beforeunload) ve site içi bağlantı tıklamaları. Tarayıcının geri tuşu yakalanamaz.
 */
export function useUnsavedChangesGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Eski tarayıcılar uyarıyı ancak returnValue doluysa gösterir
      e.returnValue = "";
    };

    // Yakalama aşamasında: Next'in <Link> yönlendirmesinden önce çalışır
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      // Dış bağlantıda beforeunload devreye girer; aynı sayfadaki çapa bağlantıları sorun değil
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (!confirm(MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active]);
}
