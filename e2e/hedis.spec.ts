import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (err) => {
    throw err;
  });
});

test("Hediş: anne → bütçe → hobi → sonuçlar → sepete ekle → WhatsApp linki", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hediye kime?" })).toBeVisible();
  await page.getByRole("button", { name: "Anne", exact: true }).click();

  // Annenin cinsiyeti belli: doğrudan bütçe sorulur
  await expect(page.getByRole("heading", { name: "Annene ne kadar ayırmayı düşünüyorsun?" })).toBeVisible();
  await page.getByRole("button", { name: "1.000 ₺ ve üzeri" }).click();

  await expect(page.getByRole("heading", { name: /Annen nelerden hoşlanır/ })).toBeVisible();
  const show = page.getByRole("button", { name: "Hediyeleri göster" });
  await expect(show).toBeDisabled();
  await page.getByRole("button", { name: "Moda & stil" }).click();
  await page.getByRole("button", { name: "Seyahat" }).click();
  await expect(page.getByText("2/3 seçildi")).toBeVisible();
  await show.click();

  // En az 1.5 sn düşünür, sonra sonuçlar
  await expect(page.getByText("Raflara bakıyorum…")).toBeVisible();
  const title = page.getByRole("heading", { name: /^Annene özel \d hediye$/ });
  await expect(title).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Annene uygun").first()).toBeVisible();

  // Geçmiş cevaplar etiket olarak görünür
  await expect(page.getByText("Moda & stil, Seyahat")).toBeVisible();

  const firstCard = page.locator("article").first();
  const name = (await firstCard.locator("h3").innerText()).trim();
  await firstCard.getByRole("button", { name: "Sepete ekle" }).click();
  await expect(firstCard.getByRole("button", { name: "Sepette" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Sepet, 1 ürün/ })).toBeVisible();

  await page.goto("/sepet");
  const href = (await page.getByRole("link", { name: "WhatsApp ile bilgi al" }).getAttribute("href"))!;
  expect(decodeURIComponent(href)).toContain(name);
});

test("Hediş: cinsiyeti belirsiz kişide cinsiyet sorulur; geri dönüp değiştirilebilir", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sevgili", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Sevgilin için kadın ürünlerine mi/ })).toBeVisible();
  await page.getByRole("button", { name: "Erkek", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sevgiline ne kadar ayırmayı düşünüyorsun?" })).toBeVisible();

  // Kişiyi değiştir
  await page.getByRole("button", { name: "değiştir" }).first().click();
  await expect(page.getByRole("heading", { name: "Hediye kime?" })).toBeVisible();
  await page.getByRole("button", { name: "Baba", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Babana ne kadar ayırmayı düşünüyorsun?" })).toBeVisible();
  await page.getByRole("button", { name: "500 ₺'ye kadar" }).click();
  await page.getByRole("button", { name: "Emin değilim, sen seç" }).click();

  // Ürünlerin hepsi kadın ürünü: dürüst mesaj + mağaza yönlendirmesi
  await expect(page.getByRole("button", { name: "Baştan başla" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("link", { name: "Diğer ürünlere göz at →" }).click();
  await expect(page).toHaveURL(/\/magaza$/);
});

test("Hediş: dönen ziyaretçi karşılanır", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("hg_hedis_son", JSON.stringify({ recipient: "anne", at: Date.now() })));
  await page.reload();
  await expect(page.getByText("Yine geldin! Geçen sefer annene bakıyorduk.")).toBeVisible();
});
