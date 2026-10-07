import { describe, expect, it } from "vitest";
import { hashVisitor, isBot, isTrackablePath, isValidVisitorId, istanbulDay, lastDays } from "./analytics";

describe("istanbulDay", () => {
  it("UTC gece yarısından önce İstanbul'da ertesi gündür (UTC+3)", () => {
    expect(istanbulDay(new Date("2026-10-07T21:30:00Z"))).toBe("2026-10-08");
    expect(istanbulDay(new Date("2026-10-07T20:59:00Z"))).toBe("2026-10-07");
  });
});

describe("lastDays", () => {
  it("bugün dahil eskiden yeniye sıralı gün listesi", () => {
    expect(lastDays(new Date("2026-10-07T09:00:00Z"), 3)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07"]);
  });
});

describe("isBot", () => {
  it.each([
    ["Mozilla/5.0 (compatible; Googlebot/2.1)", true],
    ["facebookexternalhit/1.1", true],
    ["WhatsApp/2.23", true],
    ["Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0", true],
    ["", true],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1", false],
  ])("%s -> %s", (ua, expected) => {
    expect(isBot(ua)).toBe(expected);
  });
});

describe("diğer", () => {
  it("hash tuza bağlı ve sabit uzunlukta", () => {
    const id = "3f2b8c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f";
    expect(hashVisitor(id, "a")).toHaveLength(32);
    expect(hashVisitor(id, "a")).not.toBe(hashVisitor(id, "b"));
    expect(isValidVisitorId(id)).toBe(true);
    expect(isValidVisitorId("x")).toBe(false);
  });
  it("admin ve api yolları sayılmaz", () => {
    expect(isTrackablePath("/magaza")).toBe(true);
    expect(isTrackablePath("/admin/urunler")).toBe(false);
    expect(isTrackablePath("/api/ziyaret")).toBe(false);
    expect(isTrackablePath("https://x")).toBe(false);
  });
});
