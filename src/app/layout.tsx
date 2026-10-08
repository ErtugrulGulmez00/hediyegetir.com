import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Karla } from "next/font/google";
import { ConfirmHost } from "@/components/ui/ConfirmHost";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — sevdiklerine hediyeler`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Kime ne alacağını bilemedin mi? Hediş birkaç soruyla sana uygun hediyeyi önersin. Sipariş WhatsApp'tan, kolayca.",
  openGraph: { siteName: SITE_NAME, locale: "tr_TR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f4ecdf",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${fraunces.variable} ${caveat.variable} ${karla.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">
        {children}
        <ConfirmHost />
      </body>
    </html>
  );
}
