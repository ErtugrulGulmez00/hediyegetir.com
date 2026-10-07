import type { Page } from "@playwright/test";

/** Ana sayfada Hediş penceresi kendiliğinden açılmasın (Hediş'i test etmeyen testler için). */
export async function hedisGorulmus(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("hg_hedis_goruldu", "1");
    } catch {
      // yoksay
    }
  });
}

/** Tarayıcı hatası (ör. hydration, persist) testi düşürsün */
export function hatadaDus(page: Page) {
  page.on("pageerror", (err) => {
    throw err;
  });
}
