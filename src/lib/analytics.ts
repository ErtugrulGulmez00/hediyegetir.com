// Anonim ziyaret istatistikleri. IP saklanmaz; ziyaretçi çerezi tuzlu hash'le tutulur.
import { createHash } from "node:crypto";

export const VISITOR_COOKIE = "hg_vid";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** İstanbul saatine göre gün: "2026-10-07" */
export function istanbulDay(date: Date): string {
  return dayFormatter.format(date);
}

/** Bugünden geriye `count` günün listesi (eskiden yeniye). Türkiye 2016'dan beri yaz saati uygulamıyor. */
export function lastDays(today: Date, count: number): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    days.push(istanbulDay(d));
  }
  return [...new Set(days)];
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|preview|headless|lighthouse|pagespeed|curl|wget|python|axios|node-fetch|go-http|java\/|httpclient|monitor|uptime/i;

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

export function hashVisitor(visitorId: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${visitorId}`).digest("hex").slice(0, 32);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isValidVisitorId = (id: string | undefined): id is string => !!id && UUID.test(id);

/** Takip edilmeyecek yollar */
export function isTrackablePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("/admin") && !path.startsWith("/api") && path.length <= 300;
}
