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
  const wa = page.getByRole("link", { name: "WhatsApp ile bilgi al" });
  await expect(wa).toBeVisible();

  const href = (await wa.getAttribute("href"))!;
  expect(href).toMatch(/^https:\/\/wa\.me\/90\d{10}\?text=/);
  const text = decodeURIComponent(href.split("text=")[1]);
  expect(text).toContain(name);
  expect(text).toContain("2 adet");
  expect(text).toContain("Ara toplam:");

  // Sayfa yenilenince sepet korunuyor
  await page.reload();
  await expect(page.getByRole("link", { name: "WhatsApp ile bilgi al" })).toBeVisible();

  // Çıkarınca boş sepet görünür
  await page.getByRole("button", { name: /sepetten çıkar/ }).click();
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
