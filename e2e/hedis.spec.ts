import { expect, test } from "@playwright/test";
import { hatadaDus } from "./yardim";

test.beforeEach(({ page }) => hatadaDus(page));

test("Hediş penceresi ana sayfada kendiliğinden açılır; yenileyince tekrar açılmaz", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Hediye kime?" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.reload();
  await page.waitForTimeout(1200);
  await expect(dialog).toBeHidden();

  // Menüden ve sağ alttaki düğmeden yeniden açılır
  await page.getByRole("navigation", { name: "Ana menü" }).getByRole("button", { name: /Hediş/ }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Kapat/ }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Hediş'e sor" }).last().click();
  await expect(dialog).toBeVisible();
});

test("Hediş: anne → bütçe → hobi → sonuçlar → sepete ekle → WhatsApp linki", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await dialog.getByRole("button", { name: "Anne", exact: true }).click();

  // Annenin cinsiyeti belli: doğrudan bütçe sorulur
  await expect(dialog.getByRole("heading", { name: "Annene ne kadar ayırmayı düşünüyorsun?" })).toBeVisible();
  await dialog.getByRole("button", { name: "1.000 ₺ ve üzeri" }).click();

  await expect(dialog.getByRole("heading", { name: /Annen nelerden hoşlanır/ })).toBeVisible();
  const show = dialog.getByRole("button", { name: "Hediyeleri göster" });
  await expect(show).toBeDisabled();
  await dialog.getByRole("button", { name: "Moda & stil" }).click();
  await dialog.getByRole("button", { name: "Seyahat" }).click();
  await expect(dialog.getByText("2/3 seçildi")).toBeVisible();
  await show.click();

  await expect(dialog.getByText("Raflara bakıyorum…")).toBeVisible();
  await expect(dialog.getByRole("heading", { name: /^Annene özel \d hediye$/ })).toBeVisible({ timeout: 10_000 });
  await expect(dialog.getByText("Annene uygun").first()).toBeVisible();
  await expect(dialog.getByText("Moda & stil, Seyahat")).toBeVisible();

  const firstCard = dialog.locator("article").first();
  const name = (await firstCard.locator("h3").innerText()).trim();
  await firstCard.getByRole("button", { name: "Sepete ekle" }).click();
  await expect(firstCard.getByRole("button", { name: "Sepette" })).toBeVisible();

  // Kapatıp yeniden açınca sonuçlar yerinde durur
  await dialog.getByRole("button", { name: /Kapat/ }).click();
  await expect(page.getByRole("link", { name: /Sepet, 1 ürün/ })).toBeVisible();
  await page.getByRole("button", { name: "Hediş'e sor" }).last().click();
  await expect(dialog.getByRole("heading", { name: /^Annene özel/ })).toBeVisible();

  // Önerilen ürüne tıklayınca pencere kapanır ve ürün sayfası açılır
  await dialog.locator("article h3 a").first().click();
  await expect(page).toHaveURL(/\/urun\//);
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);

  await page.goto("/sepet");
  const href = (await page.getByRole("link", { name: "WhatsApp ile bilgi al" }).getAttribute("href"))!;
  expect(decodeURIComponent(href)).toContain(name);
});

test("Hediş: cinsiyeti belirsiz kişide cinsiyet sorulur; geri dönüp değiştirilebilir; mağazaya döner", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await dialog.getByRole("button", { name: "Sevgili", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: /Sevgilin için kadın ürünlerine mi/ })).toBeVisible();
  await dialog.getByRole("button", { name: "Erkek", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Sevgiline ne kadar ayırmayı düşünüyorsun?" })).toBeVisible();

  await dialog.getByRole("button", { name: "değiştir" }).first().click();
  await expect(dialog.getByRole("heading", { name: "Hediye kime?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Baba", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Babana ne kadar ayırmayı düşünüyorsun?" })).toBeVisible();
  await dialog.getByRole("button", { name: "500 ₺'ye kadar" }).click();
  await dialog.getByRole("button", { name: "Emin değilim, sen seç" }).click();

  await expect(dialog.getByRole("button", { name: "Baştan başla" })).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole("button", { name: "Diğer ürünlere göz at →" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#urunler")).toBeInViewport();
});

test("Hediş: dönen ziyaretçi karşılanır", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hg_hedis_son", JSON.stringify({ recipient: "anne", at: Date.now() })));
  await page.goto("/");
  await expect(page.getByRole("dialog").getByText("Yine geldin! Geçen sefer annene bakıyorduk.")).toBeVisible();
});

test("eski /magaza adresi filtreleriyle birlikte ana sayfaya yönlenir", async ({ page }) => {
  await page.goto("/magaza?kategori=canta");
  await expect(page).toHaveURL(/\/\?kategori=canta$/);
});
