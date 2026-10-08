import { expect, test } from "@playwright/test";
import { hatadaDus, hedisGorulmus } from "./yardim";

test.beforeEach(async ({ page }) => {
  hatadaDus(page);
  await hedisGorulmus(page);
});

test("mağazadan ürün seç → sepete ekle → WhatsApp linki ürünü içeriyor", async ({ page }) => {
  await page.goto("/");
  // Tükenmiş ürünler sepete eklenemez; stokta olan ilk ürünü seç
  const firstCard = page.locator("article").filter({ hasNotText: "şu an tükendi" }).first();
  const name = (await firstCard.locator("h3").innerText()).trim();
  await firstCard.locator("h3 a").click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await page.getByRole("button", { name: "Bir artır" }).click();
  await page.getByRole("button", { name: "Sepete ekle" }).click();
  await expect(page.getByText("Sepete koyduk!")).toBeVisible();
  await expect(page.getByRole("link", { name: /Sepet, 2 ürün/ })).toBeVisible();

  await page.getByRole("link", { name: "Sepete git" }).click();
  await expect(page).toHaveURL(/\/sepet$/);
  const wa = page.getByRole("link", { name: "Siparişi WhatsApp'tan gönder" });
  await expect(wa).toBeVisible();

  const href = (await wa.getAttribute("href"))!;
  expect(href).toMatch(/^https:\/\/wa\.me\/90\d{10}\?text=/);
  const text = decodeURIComponent(href.split("text=")[1]);
  expect(text).toContain(name);
  expect(text).toContain("2 adet");
  expect(text).toContain("Ara toplam:");

  // Hediye paketi ve not mesaja eklenir
  await page.getByLabel("Hediye olarak paketlensin").check();
  await page.getByLabel(/Not ekle/).fill("Lacivert olsun");
  const withExtras = decodeURIComponent((await wa.getAttribute("href"))!.split("text=")[1]);
  expect(withExtras).toContain("Hediye paketi istiyorum.");
  expect(withExtras).toContain("Not: Lacivert olsun");

  // Sayfa yenilenince sepet (not dahil) korunuyor
  await page.reload();
  await expect(page.getByRole("link", { name: "Siparişi WhatsApp'tan gönder" })).toBeVisible();
  await expect(page.getByLabel(/Not ekle/)).toHaveValue("Lacivert olsun");

  // Çıkarınca boş sepet görünür
  await page.getByRole("button", { name: /sepetten çıkar/ }).click();
  await expect(page.getByText("Sepetin şimdilik boş.")).toBeVisible();
});

test("mobilde ürün sayfasının sonuna atlayınca yapışkan 'Sepete ekle' çıkar ve çalışır", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Çubuk yalnızca mobilde");
  await page.goto("/urun/kapakli-orgu-omuz-cantasi");
  const bar = page.getByRole("region", { name: "Hızlı sepete ekle" });
  await expect(bar).toHaveCount(0);

  // Ana düğme hiç görünmeden sayfanın sonuna atla (geri tuşuyla dönüşteki kaydırma gibi)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(bar).toBeVisible();

  // Yüzen Hediş düğmesi çubuğun üstüne kaymış olmalı (çakışmasın); kayma 200 ms'lik geçişle olur
  const launcher = page.getByRole("button", { name: "Hediş, hediye asistanı", exact: true });
  await expect(launcher).toBeVisible();
  await expect
    .poll(async () => {
      const [b, l] = [await bar.boundingBox(), await launcher.boundingBox()];
      return !!b && !!l && l.y + l.height <= b.y + 1;
    })
    .toBe(true);

  await bar.getByRole("button", { name: "Sepete ekle" }).click();
  await expect(page.getByRole("link", { name: /Sepet, 1 ürün/ })).toBeVisible();
  await bar.getByRole("link", { name: /Sepete git/ }).click();
  await expect(page).toHaveURL(/\/sepet$/);
});

test("sepeti boşalt onay ister, onaylanınca her şeyi temizler", async ({ page }) => {
  await page.goto("/");
  await page.locator("article").first().locator("h3 a").click();
  await page.getByRole("button", { name: "Sepete ekle" }).click();
  await page.goto("/sepet");
  await page.getByRole("button", { name: "Sepeti boşalt" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sepeti boşalt" }).click();
  await expect(page.getByText("Sepetin şimdilik boş.")).toBeVisible();
});

test("satıştan kalkan ürün sepetten uyarıyla düşer", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("hg-sepet", JSON.stringify({ state: { lines: [{ productId: "silinmis-urun", qty: 1 }] }, version: 1 })),
  );
  await page.goto("/sepet");
  await expect(page.getByText(/artık satışta olmadığı için sepetinden çıkarıldı/)).toBeVisible();
  await expect(page.getByText("Sepetin şimdilik boş.")).toBeVisible();
});
