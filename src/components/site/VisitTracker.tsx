"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SESSION_FLAG = "hg_ziyaret";

// Aynı yolun art arda iki kez bildirilmesini önler (geliştirmede React efektleri çift çalıştırır;
// iki çerezsiz istek iki ayrı "tekil ziyaretçi" yaratırdı).
let lastSent: { path: string; at: number } | null = null;

/** Her sayfa görüntülemesini anonim olarak bildirir. Yeni sekme/oturum = yeni ziyaret. */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const now = Date.now();
    if (lastSent && lastSent.path === pathname && now - lastSent.at < 2000) return;
    lastSent = { path: pathname, at: now };

    let newVisit = false;
    try {
      if (!sessionStorage.getItem(SESSION_FLAG)) {
        sessionStorage.setItem(SESSION_FLAG, "1");
        newVisit = true;
      }
    } catch {
      newVisit = true;
    }
    // keepalive: sayfa kapanırken bile gönderilsin; sendBeacon'dan farklı olarak çerez yanıtı da işlenir
    fetch("/api/ziyaret", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname, newVisit }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
