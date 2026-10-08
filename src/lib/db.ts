import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL tanımlı değil");
  // Yerel `prisma dev` (PGlite) aynı anda çok bağlantıda bağlantı düşürebiliyor; orada .env'de DATABASE_POOL_MAX=1.
  // Tanımsızsa pg'nin varsayılan havuzu (10) kullanılır.
  const max = Number(process.env.DATABASE_POOL_MAX) || undefined;
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max }) });
}

// Geliştirmede hot-reload her seferinde yeni bağlantı havuzu açmasın
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
