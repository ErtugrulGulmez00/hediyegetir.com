// Kullanım: npm run ikas:sync
import "dotenv/config";
import { db } from "@/lib/db";
import { syncFromIkas } from "@/lib/ikas/sync";

async function main() {
  const baseUrl = process.env.IKAS_BASE_URL || "https://hediyeyolla.ikas.shop";
  console.log(`ikas senkronu başlıyor: ${baseUrl}\n`);
  const report = await syncFromIkas({ db, baseUrl, onProgress: (line) => console.log("  " + line) });
  console.log(
    `\n${report.status}: ${report.added} eklendi, ${report.updated} güncellendi, ` +
      `${report.deactivated} pasife alındı, ${report.failed} hatalı`,
  );
  if (report.added > 0) {
    console.log("Yeni ürünlerin Hediş etiketleri öneridir; admin panelinden onaylamayı unutma.");
  }
  if (report.status === "FAILED") process.exitCode = 1;
}

main().finally(() => db.$disconnect());
