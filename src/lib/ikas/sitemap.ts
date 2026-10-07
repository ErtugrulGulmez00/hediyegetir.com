export type SitemapEntry = { url: string; lastmod: string | null };

/** products.xml içeriğinden ürün URL'lerini çıkarır (mağaza ana sayfası hariç). */
export function parseProductsSitemap(xml: string, baseUrl: string): SitemapEntry[] {
  const base = baseUrl.replace(/\/+$/, "");
  const entries: SitemapEntry[] = [];
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block[1].match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
    if (!loc) continue;
    const url = decodeXml(loc).replace(/\/+$/, "");
    if (url === base || !url.startsWith(base + "/")) continue;
    const lastmod = block[1].match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1] ?? null;
    entries.push({ url, lastmod });
  }
  return entries;
}

export async function fetchProductUrls(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SitemapEntry[]> {
  const res = await fetchImpl(`${baseUrl.replace(/\/+$/, "")}/products.xml`, {
    headers: { "user-agent": IKAS_USER_AGENT },
  });
  if (!res.ok) throw new Error(`products.xml alınamadı (HTTP ${res.status})`);
  return parseProductsSitemap(await res.text(), baseUrl);
}

export const IKAS_USER_AGENT = "hediyegetir-sync/1.0 (+https://hediyegetir.com)";

function decodeXml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
