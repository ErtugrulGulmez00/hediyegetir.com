import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site";

describe("resolveSiteUrl", () => {
  it("NEXT_PUBLIC_SITE_URL doluysa onu kullanır, sondaki / atılır", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://hediyegetir.com/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe(
      "https://hediyegetir.com",
    );
  });

  it("Vercel'de localhost girilmişse ya da boşsa Vercel'in adresine düşer", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000/", VERCEL_PROJECT_PRODUCTION_URL: "hediyegetir-abc.vercel.app" })).toBe(
      "https://hediyegetir-abc.vercel.app",
    );
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "hediyegetir-abc.vercel.app" })).toBe("https://hediyegetir-abc.vercel.app");
  });

  it("yerelde (Vercel dışında) localhost kalır", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000/" })).toBe("http://localhost:3000");
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
