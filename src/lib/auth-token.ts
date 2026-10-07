// Proxy (edge benzeri ortam) ve sunucu kodu tarafından ortak kullanılır: Prisma/bcrypt içermez.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "hg_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET en az 32 karakter olmalı");
  return new TextEncoder().encode(secret);
}

export async function signSession(username: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<{ username: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.role !== "admin" || !payload.sub) return null;
    // Kullanıcı adı değiştirilirse eski oturumlar geçersiz olsun
    if (payload.sub !== process.env.ADMIN_USERNAME) return null;
    return { username: payload.sub };
  } catch {
    return null;
  }
}
