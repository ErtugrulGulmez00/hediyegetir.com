import { cacheLife } from "next/cache";
import Link from "next/link";
import { getSettings } from "@/lib/catalog";
import { HedisOpenButton } from "@/components/hedis/HedisDialog";
import { GiftIcon } from "@/components/ui/Logo";

export async function SiteFooter() {
  const settings = await getSettings();
  return (
    <footer className="relative mt-20 bg-kraft text-murekkep">
      {/* Yırtık kağıt kenarı */}
      <svg aria-hidden viewBox="0 0 1200 24" preserveAspectRatio="none" className="absolute -top-[23px] left-0 h-6 w-full text-kraft">
        <path
          fill="currentColor"
          d="M0 24V14l18-6 22 7 25-9 19 8 28-10 21 9 30-6 17 7 26-11 24 10 20-5 29 8 23-9 18 6 31-8 22 9 19-6 27 8 24-10 20 7 28-6 21 9 26-8 18 5 30-9 22 8 25-6 19 9 27-10 23 7 20-5 29 8 21-9 24 6 18-4 28 9 22-8 26 7 19-6 30 8 21-10 25 9 20-5 23 7 27-8 19 6 24-9 22 8 30-7 18 6 26-9 21 8V24Z"
        />
      </svg>
      <div className="sayfa grid gap-8 pt-10 pb-8 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2 font-baslik text-xl font-semibold">
            <GiftIcon className="size-7" /> hediyegetir
          </p>
          <p className="mt-2 max-w-sm text-[0.95rem] text-murekkep">
            Sevdiklerin için özenle seçilmiş hediyeler. Online ödeme yok; siparişini WhatsApp&apos;tan birlikte
            netleştiriyoruz.
          </p>
        </div>
        <nav aria-label="Alt menü" className="flex flex-col gap-1.5">
          <span className="font-el text-xl text-murekkep">Gezin</span>
          <Link href="/" className="hover:underline">Mağaza</Link>
          <HedisOpenButton className="text-left hover:underline">Hediş · hediye asistanı</HedisOpenButton>
          <Link href="/nasil-siparis-verilir" className="hover:underline">Nasıl sipariş verilir?</Link>
          <Link href="/hakkimizda" className="hover:underline">Hikâyemiz</Link>
          <Link href="/sepet" className="hover:underline">Sepet</Link>
        </nav>
        <div className="flex flex-col gap-1.5">
          <span className="font-el text-xl text-murekkep">Bize ulaş</span>
          {settings.whatsappNumber && (
            <a href={`https://wa.me/${settings.whatsappNumber}`} className="hover:underline" rel="noopener" target="_blank">
              WhatsApp
            </a>
          )}
          {settings.instagramUrl && (
            <a href={settings.instagramUrl} className="hover:underline" rel="noopener" target="_blank">
              Instagram
            </a>
          )}
          <Link href="/kvkk" className="hover:underline">KVKK ve çerezler</Link>
        </div>
      </div>
      {/* Mobilde alttaki boşluk: sağ alttaki yüzen Hediş düğmesi bu satırın üstüne binmesin */}
      <p className="border-t border-murekkep/20 px-4 pt-4 pb-20 text-center text-sm text-murekkep sm:pb-4">
        © <CopyrightYear /> hediyegetir
      </p>
    </footer>
  );
}

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
