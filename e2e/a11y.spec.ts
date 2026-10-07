import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/magaza", "/urun/handmade-kol-cantasi", "/sepet", "/kvkk", "/olmayan-sayfa", "/admin/giris"];

for (const path of PAGES) {
  test(`erişilebilirlik: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
    expect(summary, summary.join("\n")).toEqual([]);
  });
}

test("Hediş sonuç ekranı erişilebilir", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Anne", exact: true }).click();
  await page.getByRole("button", { name: "500 – 1.000 ₺" }).click();
  await page.getByRole("button", { name: "Emin değilim, sen seç" }).click();
  await page.getByRole("heading", { name: /özel/ }).waitFor({ timeout: 10_000 });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
});

test("Hediş klavyeyle baştan sona kullanılabilir", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Anne", exact: true }).focus();
  await page.keyboard.press("Enter");
  // Odak yeni soruya taşınır
  await expect(page.getByRole("heading", { name: /Annene ne kadar/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: /Annen nelerden/ })).toBeFocused();
});
