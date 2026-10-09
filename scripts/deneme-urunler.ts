// Test için deneme ürünleri: her kategoriye birkaç ürün ekler ya da hepsini siler.
// Görseller placehold.co yer tutucuları (sitenin renklerinde, üstünde ürün adı). Adresleri "deneme-" ile başlar.
// Gerçek ürünlerin altında kalsınlar diye oluşturulma tarihleri gerçek ürünlerden eskidir (öne çıkan değiller).
// Tekrar çalıştırılabilir: aynı adresli ürün varsa atlanır.
//
//   npm run deneme-urunler          # ekle
//   npm run deneme-urunler -- --sil # "deneme-" ile başlayan bütün ürünleri sil
//
// Veritabanına doğrudan yazar: sitede en geç bir saatte görünür; hemen görmek için dev sunucusunu yeniden başlat
// (yayında: Redeploy).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type GalleryLayout, type Gender } from "../src/generated/prisma/client";
import { HOBBIES, OCCASIONS, RECIPIENTS } from "../src/lib/hedis/config";

const PREFIX = "deneme-";
const CREATED_AT = new Date("2026-10-01T09:00:00+03:00");

/** Sitenin renkleri: [arka plan, yazı] */
const PALETTE = [
  ["D9C3A0", "2B2420"],
  ["B5523B", "FBF7F0"],
  ["6B7344", "FBF7F0"],
  ["D9A441", "2B2420"],
  ["EADFCB", "2B2420"],
] as const;

type Demo = {
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  /** undefined = sipariş üzerine */
  stock?: number;
  stamps?: string[];
  layout?: GalleryLayout;
  /** Kaç yer tutucu görsel */
  photos?: number;
  description: string;
  features: string[];
  recipients: string[];
  gender?: Gender;
  hobbies: string[];
  occasions: string[];
  tags: string[];
};

const PRODUCTS: Demo[] = [
  // ---- Çanta ----
  {
    slug: "orgu-mini-omuz-cantasi",
    name: "Örgü Mini Omuz Çantası",
    category: "canta",
    price: 690,
    stamps: ["El yapımı"],
    layout: "UCLU",
    photos: 3,
    description: "Telefonun, cüzdanın ve anahtarların sığacağı kadar küçük, günlük kullanıma uygun bir örgü çanta. İstediğin renkte örülür.",
    features: ["Pamuk ip", "Ayarlanabilir askı", "Mıknatıslı kapak"],
    recipients: ["anne", "kiz-kardes", "arkadas", "sevgili"],
    gender: "KADIN",
    hobbies: ["moda", "el-isi"],
    occasions: ["dogum-gunu", "sebepsiz"],
    tags: ["örgü", "mini çanta", "omuz çantası"],
  },
  {
    slug: "deri-gorunumlu-sirt-cantasi",
    name: "Deri Görünümlü Sırt Çantası",
    category: "canta",
    price: 1150,
    stock: 6,
    layout: "IKILI",
    photos: 2,
    description: "Okula, işe ya da kısa gezilere: dizüstü bölmeli, su itici yüzeyli şık bir sırt çantası.",
    features: ["15,6 inç dizüstü bölmesi", "Su itici yüzey", "Gizli fermuarlı cep"],
    recipients: ["arkadas", "erkek-kardes", "kiz-kardes", "is-arkadasi", "kuzen"],
    hobbies: ["seyahat", "teknoloji"],
    occasions: ["mezuniyet", "yeni-is", "dogum-gunu"],
    tags: ["sırt çantası", "laptop", "okul"],
  },
  {
    slug: "papatya-baskili-kanvas-canta",
    name: "Papatya Baskılı Kanvas Çanta",
    category: "canta",
    price: 320,
    compareAt: 380,
    stock: 15,
    description: "Pazara, kitapçıya, plaja… Her yere sığan, yıkanabilir kalın kanvas bez çanta.",
    features: ["%100 pamuk kanvas", "Yıkanabilir", "İç cep"],
    recipients: ["arkadas", "is-arkadasi", "ogretmen", "kuzen"],
    hobbies: ["okuma", "bahce"],
    occasions: ["tesekkur", "sebepsiz", "ogretmenler-gunu"],
    tags: ["bez çanta", "papatya", "kanvas"],
  },
  {
    slug: "makrome-bel-cantasi",
    name: "Makrome Bel Çantası",
    category: "canta",
    price: 540,
    stock: 0,
    stamps: ["El işi", "Kadın emeği"],
    description: "Festivalde, yürüyüşte ellerin serbest kalsın: makrome örgülü, püsküllü bel çantası.",
    features: ["Makrome ip", "Ayarlanabilir kemer", "Fermuarlı iç bölme"],
    recipients: ["kiz-kardes", "arkadas", "sevgili"],
    gender: "KADIN",
    hobbies: ["moda", "seyahat", "muzik"],
    occasions: ["dogum-gunu", "sebepsiz"],
    tags: ["makrome", "bel çantası", "boho"],
  },
  {
    slug: "hasir-sepet-canta",
    name: "Hasır Sepet Çanta",
    category: "canta",
    price: 1890,
    stamps: ["El yapımı"],
    layout: "IKILI",
    photos: 2,
    description: "Deri saplı, iç astarlı geniş hasır sepet çanta. Yaz alışverişinden pikniğe her yere yakışır.",
    features: ["Doğal hasır", "Deri sap", "Bezli iç astar"],
    recipients: ["anne", "teyze", "hala", "buyukanne", "es"],
    gender: "KADIN",
    hobbies: ["bahce", "moda", "dekorasyon"],
    occasions: ["anneler-gunu", "yildonumu", "yeni-ev"],
    tags: ["hasır", "sepet", "yazlık"],
  },
  // ---- Giyim ----
  {
    slug: "yun-bere-atki-takimi",
    name: "Yün Bere ve Atkı Takımı",
    category: "giyim",
    price: 850,
    stamps: ["El yapımı", "Kadın işi"],
    layout: "UCLU",
    photos: 3,
    description: "Soğuk günler için yumuşacık yün bere ve atkı takımı. Renk kombinasyonunu sen seç, senin için örelim.",
    features: ["Yün karışımı ip", "Ponponlu bere", "180 cm atkı"],
    recipients: ["anne", "baba", "sevgili", "es", "buyukanne", "buyukbaba", "arkadas"],
    hobbies: ["spor-doga", "moda"],
    occasions: ["yilbasi", "dogum-gunu", "sebepsiz"],
    tags: ["bere", "atkı", "kışlık", "yün"],
  },
  {
    slug: "pamuklu-oversize-tisort",
    name: "Pamuklu Oversize Tişört",
    category: "giyim",
    price: 450,
    stock: 25,
    layout: "IKILI",
    photos: 2,
    description: "Bol kesim, kalın dokulu pamuklu tişört. Yıkadıkça yumuşar, formunu korur.",
    features: ["%100 pamuk", "Oversize kesim", "S–XL beden"],
    recipients: ["arkadas", "erkek-kardes", "kiz-kardes", "kuzen", "sevgili"],
    hobbies: ["moda", "muzik"],
    occasions: ["dogum-gunu", "sebepsiz"],
    tags: ["tişört", "oversize", "basic"],
  },
  {
    slug: "orgu-hirka-krem",
    name: "Örgü Hırka – Krem",
    category: "giyim",
    price: 2400,
    compareAt: 2700,
    stamps: ["El yapımı"],
    description: "Düğmeli, cepli, rahat kesim el örgüsü hırka. Krem dışında istediğin renkte de örülür.",
    features: ["Akrilik-yün karışım", "Ahşap düğme", "İki cep"],
    recipients: ["anne", "es", "teyze", "buyukanne", "sevgili"],
    gender: "KADIN",
    hobbies: ["moda", "okuma"],
    occasions: ["anneler-gunu", "yilbasi", "yildonumu"],
    tags: ["hırka", "örgü", "kışlık"],
  },
  {
    slug: "erkek-keten-gomlek",
    name: "Erkek Keten Gömlek",
    category: "giyim",
    price: 990,
    stock: 8,
    description: "Yaz için nefes alan keten gömlek. Ütü istemeyen dokusuyla tatilde de işte de rahat.",
    features: ["Keten-pamuk karışım", "Regular fit", "M–XXL beden"],
    recipients: ["baba", "es", "sevgili", "erkek-kardes", "amca", "dayi"],
    gender: "ERKEK",
    hobbies: ["seyahat", "moda"],
    occasions: ["babalar-gunu", "dogum-gunu", "yildonumu"],
    tags: ["gömlek", "keten", "yazlık"],
  },
  {
    slug: "bebek-patik-bere-seti",
    name: "Bebek Patik ve Bere Seti",
    category: "giyim",
    price: 380,
    stamps: ["El yapımı", "Ev yapımı"],
    layout: "IKILI",
    photos: 2,
    description: "Yeni doğan için yumuşak, kaşındırmayan bebek ipinden patik ve bere seti. Hediye kutusunda gönderilir.",
    features: ["Bebek ipi", "0–6 ay", "Hediye kutulu"],
    recipients: ["cocuk", "arkadas", "kuzen", "kiz-kardes"],
    hobbies: [],
    occasions: ["yeni-bebek"],
    tags: ["bebek", "patik", "bere", "yenidoğan"],
  },
  // ---- Ayakkabı ----
  {
    slug: "orgu-ev-botu",
    name: "Örgü Ev Botu",
    category: "ayakkabi",
    price: 520,
    stamps: ["El yapımı"],
    layout: "IKILI",
    photos: 2,
    description: "Kaydırmaz tabanlı, sıcacık örgü ev botu. Ayak numaranı sepette not olarak yazman yeterli.",
    features: ["Kaydırmaz taban", "Yün karışımı", "36–44 numara"],
    recipients: ["anne", "buyukanne", "buyukbaba", "es", "baba"],
    hobbies: ["okuma", "kahve-cay"],
    occasions: ["yilbasi", "gecmis-olsun", "sebepsiz"],
    tags: ["ev botu", "patik", "kışlık"],
  },
  {
    slug: "hasir-espadril",
    name: "Hasır Espadril",
    category: "ayakkabi",
    price: 780,
    stock: 10,
    layout: "IKILI",
    photos: 2,
    description: "Jüt tabanlı, kanvas yüzlü hafif espadril. Yazın şehirde de sahilde de rahat.",
    features: ["Jüt taban", "Kanvas yüz", "36–41 numara"],
    recipients: ["kiz-kardes", "arkadas", "sevgili", "es"],
    gender: "KADIN",
    hobbies: ["seyahat", "moda"],
    occasions: ["dogum-gunu", "sebepsiz"],
    tags: ["espadril", "yazlık", "hasır"],
  },
  {
    slug: "deri-sandalet",
    name: "Deri Sandalet",
    category: "ayakkabi",
    price: 1350,
    stock: 4,
    description: "Hakiki deri, tokalı, anatomik tabanlı yazlık sandalet.",
    features: ["Hakiki deri", "Anatomik taban", "Ayarlanabilir toka"],
    recipients: ["baba", "es", "amca", "dayi", "erkek-kardes"],
    gender: "ERKEK",
    hobbies: ["seyahat", "spor-doga"],
    occasions: ["babalar-gunu", "dogum-gunu"],
    tags: ["sandalet", "deri", "yazlık"],
  },
  {
    slug: "kislik-panduf",
    name: "Kışlık Panduf",
    category: "ayakkabi",
    price: 290,
    compareAt: 340,
    stock: 12,
    description: "Peluş içli, yumuşak tabanlı ev pandufu. Soğuk kış akşamları için küçük bir mutluluk.",
    features: ["Peluş iç", "Yumuşak taban", "Makinede yıkanabilir"],
    recipients: ["arkadas", "anne", "kiz-kardes", "is-arkadasi", "cocuk"],
    hobbies: ["kahve-cay", "okuma"],
    occasions: ["yilbasi", "sebepsiz", "tesekkur"],
    tags: ["panduf", "ev ayakkabısı", "kışlık"],
  },
];

function placeholders(p: Demo, index: number) {
  const count = p.photos ?? 1;
  return Array.from({ length: count }, (_, i) => {
    const [bg, fg] = PALETTE[(index + i) % PALETTE.length];
    const text = count > 1 ? `${p.name}\\n${i + 1}/${count}` : p.name;
    return {
      url: `https://placehold.co/1080x1350/${bg}/${fg}.png?text=${encodeURIComponent(text)}&font=lora`,
      alt: `${p.name} (deneme görseli${count > 1 ? ` ${i + 1}` : ""})`,
      sortOrder: i,
    };
  });
}

/** Hediş etiketlerinde bilinmeyen anahtar olmasın (admin formu da bunları kabul etmez) */
function checkKeys() {
  const sets = { recipients: RECIPIENTS, hobbies: HOBBIES, occasions: OCCASIONS };
  for (const p of PRODUCTS)
    for (const [field, list] of Object.entries(sets)) {
      const known = new Set(list.map((x) => x.key));
      const bad = p[field as keyof typeof sets].filter((k) => !known.has(k));
      if (bad.length) throw new Error(`${p.name}: bilinmeyen ${field} anahtarı: ${bad.join(", ")}`);
    }
}

async function main() {
  checkKeys();
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    if (process.argv.includes("--sil")) {
      const { count } = await db.product.deleteMany({ where: { slug: { startsWith: PREFIX } } });
      console.log(`${count} deneme ürünü silindi.`);
      return;
    }

    const categories = new Map((await db.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
    let added = 0;
    for (const [i, p] of PRODUCTS.entries()) {
      const slug = PREFIX + p.slug;
      const categoryId = categories.get(p.category);
      if (!categoryId) {
        console.log(`  - ${p.name}: "${p.category}" kategorisi yok, atlandı`);
        continue;
      }
      if (await db.product.findUnique({ where: { slug }, select: { id: true } })) {
        console.log(`  · ${p.name}: zaten var`);
        continue;
      }
      await db.product.create({
        data: {
          slug,
          name: p.name,
          categoryId,
          priceKurus: p.price * 100,
          compareAtPriceKurus: p.compareAt ? p.compareAt * 100 : null,
          stock: p.stock ?? null,
          stamps: p.stamps ?? [],
          galleryLayout: p.layout ?? "TEK",
          description: p.description,
          features: p.features,
          recipients: p.recipients,
          gender: p.gender ?? "UNISEX",
          hobbies: p.hobbies,
          occasions: p.occasions,
          tags: p.tags,
          hedisReviewed: true,
          isActive: true,
          isFeatured: false,
          createdAt: new Date(CREATED_AT.getTime() + i * 60_000),
          images: { create: placeholders(p, i) },
        },
      });
      added++;
      console.log(`  ✓ ${p.name} (${p.category}, ₺${p.price})`);
    }
    console.log(`\n${added} deneme ürünü eklendi.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
