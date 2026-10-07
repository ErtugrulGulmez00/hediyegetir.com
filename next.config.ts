import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    qualities: [75],
    remotePatterns: [
      // Vercel Blob (admin yüklemeleri ve ikas'tan aktarılan görseller)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Blob token'ı yokken ikas CDN'i doğrudan kullanılır
      new URL("https://cdn.myikas.com/images/**"),
      // Demo seed yer tutucuları
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  turbopack: {
    // Kullanıcı klasöründeki başka bir package-lock.json kök sanılmasın
    root: path.resolve("."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
