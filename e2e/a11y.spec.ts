import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { hedisGorulmus, ornekUrun } from "./yardim";

// Kontrast animasyonun ortasında (yarı saydamken) ölçülmesin; "hareketi azalt" modu da böylece test edilir
test.use({ reducedMotion: "reduce" });

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const PAGES = [
  "/",
  "/kategori/canta",
  "/urun/kapakli-orgu-omuz-cantasi",
  "/sepet",
  "/nasil-siparis-verilir",
  "/hakkimizda",
  "/kvkk",
  "/olmayan-sayfa",
  "/admin/giris",
];

async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
}

for (const path of PAGES) {
  test(`erişilebilirlik: ${path}`, async ({ page }) => {
    await hedisGorulmus(page);
    await page.goto(path, { waitUntil: "networkidle" });
    const v = await violations(page);
    expect(v, v.join("\n")).toEqual([]);
  });
}

test("Hediş penceresi ve öneri ekranı erişilebilir", async ({ page }) => {
  const urun = await ornekUrun("kapakli-orgu-omuz-cantasi");
  await page.route("**/api/hedis/sohbet", (route) =>
    route.fulfill({
      json: {
        message: "Annen için bunları seçtim.",
        quickReplies: ["Başka seçenek göster", "Daha uygun fiyatlı"],
        stage: "recommend",
        profile: { recipient: "anne", recipientText: "annem", gender: null, budgetMaxKurus: 100_000, occasion: "dogum-gunu", hobbies: [] },
        products: [{ ...urun, reasons: ["El örgüsü ve günlük kullanışlı."] }],
        catalogSize: 8,
      },
    }),
  );
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await expect(dialog).toBeVisible();
  expect(await violations(page)).toEqual([]);

  await dialog.getByRole("button", { name: "Anne", exact: true }).click();
  await expect(dialog.getByText("El örgüsü ve günlük kullanışlı.")).toBeVisible();
  expect(await violations(page)).toEqual([]);
});

test("Hediş klavyeyle kullanılabilir; cevaptan sonra odak yazı alanına döner", async ({ page }) => {
  await page.route("**/api/hedis/sohbet", (route) =>
    route.fulfill({
      json: { message: "Hangi özel gün için?", quickReplies: ["Doğum günü"], stage: "question", profile: {}, products: [], catalogSize: 8 },
    }),
  );
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  const input = dialog.getByLabel("Hediş'e yaz");
  await input.focus();
  await page.keyboard.type("Eşim için hediye arıyorum");
  await page.keyboard.press("Enter");
  await expect(dialog.getByText("Hangi özel gün için?")).toBeVisible();
  await expect(input).toBeFocused();
  // Esc kapatır
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
