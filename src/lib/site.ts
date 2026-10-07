export const SITE_NAME = "hediyegetir";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hediyegetir.com").replace(/\/+$/, "");

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
