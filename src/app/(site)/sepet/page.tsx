import type { Metadata } from "next";
import { Scribble } from "@/components/ui/Scribble";
import { getSettings } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";
import { CartView } from "./CartView";

export const metadata: Metadata = {
  title: "Sepet",
  robots: { index: false },
};

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <div className="sayfa pt-6">
      <h1 className="text-4xl sm:text-5xl">
        <Scribble>Sepetin</Scribble>
      </h1>
      <p className="mt-3 font-el text-2xl text-murekkep-soluk">gönderilmeyi bekleyen küçük bir paket</p>
      <CartView whatsappNumber={settings.whatsappNumber} greeting={settings.whatsappGreeting} siteUrl={SITE_URL} />
    </div>
  );
}
