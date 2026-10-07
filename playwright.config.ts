import { defineConfig, devices } from "@playwright/test";

// Varsayılan olarak çalışan dev sunucusunu kullanır (npm run dev). Yoksa kendisi başlatır.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    locale: "tr-TR",
  },
  projects: [
    // Admin testleri veritabanını değiştirir (geçici ürün ekler, fiyat değiştirir); paralel çalışan
    // vitrin testlerini bozmasın diye onlar bittikten sonra ayrı çalışır.
    { name: "masaustu", use: { ...devices["Desktop Chrome"] }, testIgnore: /admin\.spec/ },
    { name: "mobil", use: { ...devices["Pixel 7"] }, testIgnore: /admin\.spec/ },
    {
      name: "admin",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /admin\.spec/,
      dependencies: ["masaustu", "mobil"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
