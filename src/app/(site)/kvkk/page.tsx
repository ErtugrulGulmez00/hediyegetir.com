import type { Metadata } from "next";
import { Scribble } from "@/components/ui/Scribble";

export const metadata: Metadata = {
  title: "KVKK ve çerezler",
  description: "hediyegetir.com kişisel verilerin korunması aydınlatma metni ve çerez bilgilendirmesi.",
  alternates: { canonical: "/kvkk" },
};

// Yayından önce doldurulacak işletme bilgileri. Boş kalan alanlar sayfada sarı vurguyla görünür.
const VERI_SORUMLUSU = {
  unvan: "[İŞLETME ADI / UNVANI]",
  adres: "[İŞLETME ADRESİ]",
  eposta: "[E-POSTA ADRESİ]",
};

function Bilgi({ children }: { children: string }) {
  return children.startsWith("[") ? <mark className="bg-hardal/60 px-1">{children}</mark> : <>{children}</>;
}

const STORAGE_ROWS = [
  ["hg_vid", "Çerez", "Anonim ziyaret istatistiği (tekil ziyaretçi sayımı). Rastgele bir kimliktir; kim olduğunu göstermez.", "1 yıl"],
  ["hg_admin", "Çerez", "Yalnızca site yöneticisinin oturumu. Ziyaretçilere konmaz.", "7 gün"],
  ["hg-sepet", "Tarayıcı deposu", "Sepetindeki ürünler ve adetleri. Sunucuya kaydedilmez.", "Sen silene kadar"],
  ["hg_hedis_son", "Tarayıcı deposu", "Hediş'te en son kime hediye baktığın (tekrar geldiğinde selam vermek için).", "Sen silene kadar"],
  ["hg_ziyaret", "Oturum deposu", "Aynı sekmedeki gezintiyi tek ziyaret saymak için.", "Sekme kapanınca"],
];

export default function KvkkPage() {
  return (
    <article className="sayfa pt-6">
      <h1 className="text-4xl sm:text-5xl">
        <Scribble>KVKK</Scribble> ve çerezler
      </h1>
      <p className="mt-3 font-el text-2xl text-murekkep-soluk">kısaca: üyelik yok, ödeme yok, az veri</p>

      <div className="mt-10 max-w-3xl space-y-8 leading-relaxed [&_h2]:mb-2 [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc">
        <section>
          <h2>Veri sorumlusu</h2>
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu: <Bilgi>{VERI_SORUMLUSU.unvan}</Bilgi>,{" "}
            <Bilgi>{VERI_SORUMLUSU.adres}</Bilgi>. İletişim: <Bilgi>{VERI_SORUMLUSU.eposta}</Bilgi>.
          </p>
        </section>

        <section>
          <h2>Hangi verileri işliyoruz?</h2>
          <ul>
            <li>
              <strong>Site üzerinde:</strong> Üyelik, ödeme ya da adres formu yoktur. Sepetin yalnızca kendi tarayıcında tutulur.
            </li>
            <li>
              <strong>Ziyaret istatistiği:</strong> Hangi sayfaların kaç kez görüntülendiğini ve kaç farklı ziyaretçi geldiğini
              anonim olarak sayarız. IP adresini kaydetmeyiz. Tarayıcına konan rastgele kimlik, tek yönlü şifrelenmiş (hash) halde
              en fazla 90 gün saklanır ve seninle eşleştirilemez.
            </li>
            <li>
              <strong>WhatsApp ile iletişim:</strong> &quot;WhatsApp ile bilgi al&quot; butonu, sepetindeki ürünleri içeren bir
              mesaj taslağı açar; mesajı sen gönderirsin. Gönderdiğinde telefon numaran, adın ve yazdıkların siparişini
              görüşmek, ödeme ve kargo sürecini yürütmek amacıyla işlenir (KVKK m.5/2-c: sözleşmenin kurulması ve ifası).
            </li>
            <li>
              <strong>Hediş (yapay zeka asistanı):</strong> Hediş&apos;e yazdıkların, sana hediye önerebilmek için yapay zeka
              hizmet sağlayıcımıza (OpenAI) iletilir. Konuşmalar bizim sunucularımızda saklanmaz; kötüye kullanımı önlemek için
              yalnızca IP adresinin tek yönlü şifrelenmiş hali ve istek zamanı en fazla 2 gün tutulur. Lütfen Hediş&apos;e ad,
              telefon, adres gibi kişisel bilgiler yazma.
            </li>
          </ul>
        </section>

        <section>
          <h2>Çerezler ve tarayıcı deposu</h2>
          <p>Reklam ya da üçüncü taraf takip çerezi kullanmıyoruz. Kullandıklarımız:</p>
          {/* Dar ekranda yatay kaydırılır; klavyeyle de kaydırılabilsin diye odaklanabilir bölge */}
          <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Çerezler tablosu">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[0.95rem]">
              <thead>
                <tr className="border-b-2 border-murekkep">
                  <th className="py-2 pr-3">Ad</th>
                  <th className="py-2 pr-3">Tür</th>
                  <th className="py-2 pr-3">Ne için?</th>
                  <th className="py-2">Süre</th>
                </tr>
              </thead>
              <tbody>
                {STORAGE_ROWS.map(([name, type, why, ttl]) => (
                  <tr key={name} className="border-b border-kraft align-top">
                    <td className="py-2 pr-3 font-mono text-sm">{name}</td>
                    <td className="py-2 pr-3">{type}</td>
                    <td className="py-2 pr-3">{why}</td>
                    <td className="py-2">{ttl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">Tarayıcı ayarlarından çerezleri ve site verilerini dilediğin zaman silebilirsin; site çalışmaya devam eder.</p>
        </section>

        <section>
          <h2>Verilerin aktarımı ve saklanması</h2>
          <p>
            Site Vercel, veritabanı Neon, görseller Vercel Blob altyapısında barındırılır; bu hizmetlerin sunucuları yurt dışında
            bulunabilir. Hediş sohbeti OpenAI altyapısında işlenir. WhatsApp yazışmaları WhatsApp (Meta) altyapısı üzerinden
            yürür. Kişisel verileri satmaz, reklam amacıyla
            paylaşmayız.
          </p>
        </section>

        <section>
          <h2>Hakların</h2>
          <p>KVKK&apos;nın 11. maddesi uyarınca; verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, düzeltilmesini ya da silinmesini isteme ve işlemeye itiraz etme hakkın vardır. Başvurularını <Bilgi>{VERI_SORUMLUSU.eposta}</Bilgi> adresine iletebilirsin; en geç 30 gün içinde yanıtlarız.</p>
        </section>

        <p className="text-sm text-murekkep-soluk">Son güncelleme: <Bilgi>[TARİH]</Bilgi></p>
      </div>
    </article>
  );
}
