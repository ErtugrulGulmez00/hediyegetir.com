import "dotenv/config";
import { defineConfig } from "prisma/config";

// CLI (migrate) havuzlanmamış doğrudan bağlantıyı kullanır; uygulama çalışırken
// src/lib/db.ts havuzlu DATABASE_URL ile bağlanır.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
