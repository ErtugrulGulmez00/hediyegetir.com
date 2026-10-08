import { expect, test, type Page } from "@playwright/test";
import { hedisGorulmus } from "./yardim";

// Çalıştırmak için: E2E_ADMIN_PASSWORD="..." npm run test:e2e
const USER = process.env.E2E_ADMIN_USER || "admin";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

// 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe.configure({ mode: "serial" });
test.beforeEach(async ({ page }) => {
  await hedisGorulmus(page);
  // Gerçek yapay zeka modeline gitme (yavaş ve günlük kotalı); varsayılan olarak "meşgul" cevabı
  await page.route("**/api/admin/ai-oneri", (route) =>
    route.fulfill({ status: 502, json: { error: "Ücretsiz modeller şu an meşgul, birazdan tekrar dene" } }),
  );
});

async function login(page: Page) {
  await page.goto("/admin/giris");
  await page.getByLabel("Kullanıcı adı").fill(USER);
  await page.getByLabel("Şifre").fill(PASSWORD!);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.getByRole("heading", { name: "Merhaba" })).toBeVisible();
}

test("oturumsuz erişim engellenir", async ({ page, request }) => {
  await page.goto("/admin/urunler");
  await expect(page).toHaveURL(/\/admin\/giris$/);
  const res = await request.post("/api/admin/upload-local");
  expect(res.status()).toBe(401);
});

test("hatalı şifre reddedilir", async ({ browser }) => {
  // Her çalıştırmada farklı "IP" ki deneme sınırına takılmasın
  const ctx = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": `10.0.0.${Date.now() % 250}` } });
  const page = await ctx.newPage();
  await page.goto("/admin/giris");
  await page.getByLabel("Kullanıcı adı").fill(USER);
  await page.getByLabel("Şifre").fill("yanlis-sifre-123");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /hatalı/ })).toBeVisible();
  await ctx.close();
});

test.describe("girişli", () => {
  test.skip(!PASSWORD, "E2E_ADMIN_PASSWORD tanımlı değil");

  test("fotoğraflı yeni ürün ekle → mağazada görünür → sil", async ({ page }) => {
    await login(page);
    const name = `E2E Test Ürünü ${Date.now()}`;
    await page.goto("/admin/urunler/yeni");
    await page.getByLabel("Ürün adı").fill(name);
    await page.getByLabel("Satış fiyatı (₺)").fill("349,90");
    await page.locator('input[type="file"]').setInputFiles({ name: "deneme foto.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByText("kapak", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tüm kadınlar" }).click();
    await page.getByRole("button", { name: "Kahve & çay" }).click();
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText("Kaydedildi.")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Kadın" })).toBeChecked();

    await page.goto("/?butce=0-500");
    await expect(page.getByRole("heading", { name })).toBeVisible();

    await page.goto("/admin/urunler?q=E2E");
    await page.getByRole("link", { name }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Ürünü sil" }).click();
    await expect(page.getByText("Ürün silindi.")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { name })).toHaveCount(0);
  });

  test("fiyat değişikliği ürün sayfasında hemen görünür", async ({ page }) => {
    await login(page);
    await page.goto("/admin/urunler?q=Kol");
    await page.getByRole("link", { name: "Handmade Kol Çantası" }).click();
    await page.getByLabel("Satış fiyatı (₺)").waitFor();
    const editUrl = page.url();
    const original = await page.getByLabel("Satış fiyatı (₺)").inputValue();

    const save = async (value: string) => {
      await page.goto(editUrl);
      await page.getByLabel("Satış fiyatı (₺)").fill(value);
      await page.getByRole("button", { name: "Kaydet" }).click();
      // Kayıt bitince ?kaydedildi=1 adresine yönlenir
      await page.waitForURL(/kaydedildi=1/);
    };

    try {
      // Eski (üstü çizili) fiyat 1.100 ₺; satış fiyatı ondan düşük olmalı
      await save("987");
      await page.goto("/urun/handmade-kol-cantasi");
      await expect(page.getByText("₺987").first()).toBeVisible();
    } finally {
      await save(original);
    }
  });

  test("AI analizi boş alanları doldurur, admin'in yazdığına dokunmaz", async ({ page }) => {
    await login(page);
    await page.goto("/admin/urunler/yeni", { waitUntil: "networkidle" });
    const catId = await page.getByLabel("Kategori").locator("option").nth(1).getAttribute("value");
    const suggestion = {
      name: "Önerilen Ad",
      description: "Önerilen açıklama.",
      features: ["Pamuk ip", "Elde örüldü"],
      categoryId: catId,
      gender: "KADIN",
      recipients: ["anne", "teyze"],
      hobbies: ["moda"],
      occasions: ["dogum-gunu", "anneler-gunu"],
      tags: ["el örgüsü", "romantik"],
      alts: ["Önerilen fotoğraf açıklaması"],
    };
    let calls = 0;
    await page.route("**/api/admin/ai-oneri", async (route) => {
      calls++;
      const body = route.request().postDataJSON();
      await route.fulfill({ json: { model: "test/model", suggestion, analyzedImages: body.imageUrls } });
    });
    await page.getByLabel("Ürün adı").fill("Benim adım");
    await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: PNG });
    const done = page.locator("text=Hazırladıklarım >> visible=true");
    await expect(done).toBeVisible();

    await expect(page.getByLabel("Ürün adı")).toHaveValue("Benim adım");
    await expect(page.getByLabel("Kategori")).toHaveValue(catId!);
    await expect(page.getByLabel("Fotoğraf açıklaması")).toHaveValue("Önerilen fotoğraf açıklaması");
    await expect(page.getByRole("radio", { name: "Kadın" })).toBeChecked();
    await expect(page.getByRole("button", { name: "Teyze", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Anneler Günü" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "romantik etiketini kaldır" })).toBeVisible();
    await expect(page.getByLabel("1. özellik")).toHaveValue("Pamuk ip");
    await expect(page.getByLabel("Etiketleri kontrol ettim")).not.toBeChecked();

    // Admin açıklamayı kendisi yazarsa yeniden analiz onu ezmez, geliştirilmiş hali öneri olarak sunar
    await page.locator("textarea").fill("Benim açıklamam.");
    await page.getByRole("button", { name: "Yeniden analiz et" }).click();
    await expect(page.getByRole("button", { name: "Bunu kullan" })).toBeVisible();
    await expect(page.locator("textarea")).toHaveValue("Benim açıklamam.");
    expect(calls).toBe(2);
  });

  test("AI eşleşmeyen kategori önerince oluşturmayı teklif eder", async ({ page }) => {
    await login(page);
    await page.goto("/admin/urunler/yeni", { waitUntil: "networkidle" });
    const yeniKategori = `E2E Kategori ${Date.now()}`;
    await page.route("**/api/admin/ai-oneri", (route) =>
      route.fulfill({
        json: {
          model: "test/model",
          analyzedImages: [],
          suggestion: { name: "Ahşap kalem", newCategoryName: yeniKategori, features: [], recipients: [], hobbies: [], occasions: [], tags: [], alts: [] },
        },
      }),
    );
    // Fotoğraf yokken ürün adı yazılınca kendiliğinden analiz eder
    await page.getByLabel("Ürün adı").fill("Kişiye özel ahşap kalem");
    await expect(page.locator("text=mevcut kategorilerinle tam olarak eşleşmiyor >> visible=true")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Kategoriyi oluştur" }).click();
    await expect(page.getByLabel("Kategori").locator("option:checked")).toHaveText(yeniKategori);

    // Temizlik: oluşturulan kategoriyi sil
    await page.goto("/admin/kategoriler");
    page.once("dialog", (d) => d.accept());
    await page.locator("li").filter({ has: page.locator(`input[value="${yeniKategori}"]`) }).getByRole("button", { name: "Sil" }).click();
    await expect(page.locator(`input[value="${yeniKategori}"]`)).toHaveCount(0);
  });

  test("ayarlar: WhatsApp numarası normalize edilir", async ({ page }) => {
    await login(page);
    await page.goto("/admin/ayarlar");
    const input = page.getByLabel("WhatsApp numarası");
    const before = await input.inputValue();
    await input.fill("12");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /geçersiz/ })).toBeVisible();
    await input.fill("0505 043 47 96");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByRole("status")).toHaveText("Kaydedildi.");
    await page.reload();
    await expect(page.getByLabel("WhatsApp numarası")).toHaveValue("905050434796");
    expect(before === "" || before === "905050434796").toBe(true);
  });
});
