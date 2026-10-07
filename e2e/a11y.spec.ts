import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { hedisGorulmus } from "./yardim";

// Kontrast animasyonun ortasında (yarı saydamken) ölçülmesin; "hareketi azalt" modu da böylece test edilir
test.use({ reducedMotion: "reduce" });

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const PAGES = ["/", "/urun/handmade-kol-cantasi", "/sepet", "/kvkk", "/olmayan-sayfa", "/admin/giris"];

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

test("Hediş penceresi ve sonuç ekranı erişilebilir", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await expect(dialog).toBeVisible();
  expect(await violations(page)).toEqual([]);

  await dialog.getByRole("button", { name: "Anne", exact: true }).click();
  await dialog.getByRole("button", { name: "500 – 1.000 ₺" }).click();
  await dialog.getByRole("button", { name: "Emin değilim, sen seç" }).click();
  await dialog.getByRole("heading", { name: /özel/ }).waitFor({ timeout: 10_000 });
  expect(await violations(page)).toEqual([]);
});

test("Hediş klavyeyle kullanılabilir; odak yeni soruya taşınır", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Hediş'e sor" });
  await dialog.getByRole("button", { name: "Anne", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("heading", { name: /Annene ne kadar/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("heading", { name: /Annen nelerden/ })).toBeFocused();
  // Esc kapatır, odak sayfaya döner
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
