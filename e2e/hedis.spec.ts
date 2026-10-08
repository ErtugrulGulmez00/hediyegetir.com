import { expect, test, type Page } from "@playwright/test";
import { hatadaDus, ornekUrun } from "./yardim";

// Gerçek yapay zekaya gitmeyiz (ücretli ve değişken); sohbet uç noktasını taklit ederiz.
test.beforeEach(({ page }) => hatadaDus(page));

const profil = { recipient: "anne", recipientText: "annem", gender: null, budgetMaxKurus: 100_000, occasion: "dogum-gunu", hobbies: [] };

async function sohbetiTaklitEt(page: Page) {
  const urun = await ornekUrun("kapakli-orgu-omuz-cantasi");
  const istekler: { turns: { role: string; text: string }[] }[] = [];
  await page.route("**/api/hedis/sohbet", async (route) => {
    const body = route.request().postDataJSON();
    istekler.push(body);
    if (istekler.length === 1) {
      await route.fulfill({
        json: {
          message: "Annen kullanışlı hediyeleri mi sever, yoksa duygusal olanları mı?",
          quickReplies: ["Kullanışlı", "Duygusal"],
          stage: "question",
          profile: profil,
          products: [],
          catalogSize: 8,
        },
      });
    } else {
      await route.fulfill({
        json: {
          message: "Annen için bunu seçtim.",
          quickReplies: ["Başka seçenek göster"],
          stage: "recommend",
          profile: profil,
          products: [{ ...urun, reasons: ["Günlük kullanışlı ve el yapımı."] }],
          catalogSize: 8,
        },
      });
    }
  });
  return { urun, istekler };
}

test("Hediş penceresi ana sayfada kendiliğinden açılır; yenileyince tekrar açılmaz", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Merhaba, ben Hediş!")).toBeVisible();
  await expect(dialog.getByLabel("Hediş'e yaz")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.reload();
  await page.waitForTimeout(1200);
  await expect(dialog).toBeHidden();

  await page.getByRole("navigation", { name: "Ana menü" }).getByRole("button", { name: /Hediş/ }).click();
  await expect(dialog).toBeVisible();
  // Çerçeve yok: Hediş ve kutuları dışında boş bir yere tıklayınca kapanır
  await page.mouse.click(8, 8);
  await expect(dialog).toBeHidden();

  // Yüzen düğme üst menü görünürken gizli (aynı düğme iki kez durmasın); aşağı inince çıkar
  const launcher = page.getByRole("button", { name: "Hediş, hediye asistanı", exact: true });
  await expect(launcher).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await launcher.click();
  await expect(dialog).toBeVisible();
});

test("Yapay zeka çevrim dışıyken Hediş seçeneklerle öneri yapar", async ({ page }) => {
  await page.route("**/api/hedis/sohbet", (route) => route.fulfill({ status: 503, json: { error: "Hediş şu an çevrim dışı." } }));
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await dialog.getByRole("button", { name: "Anne", exact: true }).click();

  // Seçilen kişi korunur; sıradaki soru bütçe
  await expect(dialog.getByText("Annene ne kadar ayırmayı düşünüyorsun?")).toBeVisible();
  await dialog.getByRole("button", { name: "Fark etmez" }).click();
  await expect(dialog.getByText("Annen nelerden hoşlanır?")).toBeVisible();
  await dialog.getByRole("button", { name: "Emin değilim" }).click();

  await expect(dialog.getByText("Senin için seçtim", { exact: true })).toBeVisible({ timeout: 10_000 });
  await dialog.locator("article").first().getByRole("button", { name: "Sepete ekle" }).click();
  await dialog.getByRole("link", { name: /Sepete git \(1\)/ }).click();
  await expect(page).toHaveURL(/\/sepet$/);
  await expect(dialog).toBeHidden();
});

test("Hediş sohbeti: çip → AI sorusu → hazır cevap → öneri → sepete ekle → WhatsApp", async ({ page }) => {
  const { urun, istekler } = await sohbetiTaklitEt(page);
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await dialog.getByRole("button", { name: "Anne", exact: true }).click();

  // Çip doğal bir cümle olarak gönderilir; AI'ın sorusu ve hazır cevapları gelir
  await expect(dialog.getByText("Annem için hediye arıyorum.")).toBeVisible();
  await expect(dialog.getByText("Annen kullanışlı hediyeleri mi sever")).toBeVisible();
  await dialog.getByRole("button", { name: "Kullanışlı" }).click();

  await expect(dialog.getByText("Annen için bunu seçtim.")).toBeVisible();
  await expect(dialog.getByText("Günlük kullanışlı ve el yapımı.")).toBeVisible();
  await expect(dialog.getByText("8 ürün arasından senin için seçtim")).toBeVisible();
  await expect(dialog.getByText("Doğum günü", { exact: true })).toBeVisible();

  // Geçmişin tamamı gider; önerilen ürünler asistan mesajına eklenir
  expect(istekler[1].turns.map((t) => t.role)).toEqual(["user", "assistant", "user"]);

  await dialog.locator("article").first().getByRole("button", { name: "Sepete ekle" }).click();
  await expect(dialog.getByRole("button", { name: "Sepette" })).toBeVisible();

  // Ürüne tıklayınca pencere kapanır
  await dialog.locator("article h3 a").first().click();
  await expect(page).toHaveURL(new RegExp(`/urun/${urun.slug}`));
  await expect(dialog).toBeHidden();

  await page.goto("/sepet");
  const href = (await page.getByRole("link", { name: "Siparişi WhatsApp'tan gönder" }).getAttribute("href"))!;
  expect(decodeURIComponent(href)).toContain(urun.name);
});

test("Hediş serbest metinle başlar; hata olursa tekrar denenebilir", async ({ page }) => {
  let deneme = 0;
  await page.route("**/api/hedis/sohbet", async (route) => {
    deneme++;
    if (deneme === 1) return route.fulfill({ status: 502, json: { error: "Hediş şu an cevap veremiyor; birazdan tekrar dener misin?" } });
    return route.fulfill({
      json: { message: "Yeni işinde ona eşlik edecek bir şey bulalım.", quickReplies: [], stage: "question", profile: profil, products: [], catalogSize: 8 },
    });
  });
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await dialog.getByLabel("Hediş'e yaz").fill("Yeni işe başlayan kız arkadaşıma bir hediye almak istiyorum.");
  await dialog.getByLabel("Hediş'e yaz").press("Enter");
  await expect(dialog.getByRole("alert")).toContainText("cevap veremiyor");
  await dialog.getByRole("button", { name: "Tekrar dene" }).click();
  await expect(dialog.getByText("Yeni işinde ona eşlik edecek bir şey bulalım.")).toBeVisible();
  // Kullanıcının mesajı bir kez görünür (tekrar denemede çoğalmaz)
  await expect(dialog.getByText("Yeni işe başlayan kız arkadaşıma")).toHaveCount(1);
  await expect(dialog.getByLabel("Hediş'e yaz")).toBeFocused();
});

test("Hediş: dönen ziyaretçi karşılanır", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hg_hedis_son", JSON.stringify({ text: "annen", at: Date.now() })));
  await page.goto("/");
  await expect(page.getByRole("dialog").getByText("Yine hoş geldin! Geçen sefer annen için bakmıştık.")).toBeVisible();
});

test("sohbet uç noktası geçersiz istekleri reddeder", async ({ request }) => {
  expect((await request.post("/api/hedis/sohbet", { data: { turns: [] } })).status()).toBe(400);
  const sonAsistan = await request.post("/api/hedis/sohbet", { data: { turns: [{ role: "assistant", text: "merhaba" }] } });
  expect(sonAsistan.status()).toBe(400);
});

test("eski /magaza ve ?kategori= adresleri kategori sayfasına yönlenir", async ({ page }) => {
  await page.goto("/magaza?kategori=canta");
  await expect(page).toHaveURL(/\/kategori\/canta/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Çanta");
});
