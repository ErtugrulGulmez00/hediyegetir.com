import "server-only";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./auth-token";
import { db } from "./db";

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;

// Kullanıcı yoksa da bcrypt karşılaştırması yapılsın (zamanlama farkı olmasın)
const DUMMY_HASH = "$2b$12$.7klDnS9/KPtHOpGw.LRwO6eaQU4V/GdsFnPij.hPspvNphe2vjoS";

export async function getAdminSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Sayfalar ve server action'lar için: oturum yoksa giriş sayfasına yönlendirir. */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/giris");
  return session;
}

/** Route handler'lar için: oturum yoksa null döner (çağıran 401 verir). */
export async function adminOrNull() {
  return getAdminSession();
}

async function clientKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "yerel";
  return createHash("sha256").update(`giris:${ip}`).digest("hex");
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(username: string, password: string): Promise<LoginResult> {
  const key = await clientKey();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const failures = await db.loginAttempt.count({ where: { key, success: false, createdAt: { gte: since } } });
  if (failures >= MAX_FAILURES) {
    return { ok: false, error: `Çok fazla hatalı deneme. ${WINDOW_MINUTES} dakika sonra tekrar dene.` };
  }

  const expectedUser = process.env.ADMIN_USERNAME;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUser || !hash) return { ok: false, error: "Admin hesabı ayarlanmamış (.env)." };

  const userOk = username === expectedUser;
  const passOk = await bcrypt.compare(password, userOk ? hash : DUMMY_HASH);
  const success = userOk && passOk;

  await db.loginAttempt.create({ data: { key, success } });
  // Eski kayıtları ara ara temizle
  if (Math.random() < 0.05) {
    await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 86_400_000) } } });
  }
  if (!success) return { ok: false, error: "Kullanıcı adı ya da şifre hatalı." };

  (await cookies()).set(SESSION_COOKIE, await signSession(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}
