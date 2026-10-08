# hediyegetir.com — Proje özeti ve konuşma geçmişi

Bu dosya, siteyi geliştirirken yaptığımız konuşmanın ve alınan kararların özetidir. Bir sonraki çalışma oturumunda kaldığımız yerden devam etmek için yazıldı.

- **Repo:** https://github.com/ErtugrulGulmez00/hediyegetir.com
  - `main`: 8 Ekim sabahki sürüm.
  - `demo-cilasi`: bu oturumun bütün değişiklikleri. İnceleyip `main`'e birleştirilecek.
- **Plan dosyası:** [ProjeMimarisi.md](ProjeMimarisi.md)
- **Kurulum ve yayına alma:** [README.md](README.md)
- **Son güncelleme:** 8 Ekim 2026, öğleden sonra

---

## 0. Nerede kaldık? (8 Ekim 2026, öğleden sonra)

**Durum:**
- Site **site sahibine demo** olarak gösterilecek.
- Bu oturumda seçtiğin bütün iyileştirmeler yapıldı ve test edildi. Ayrıntılar 3. bölümde, 13–18. maddelerde.
- Veritabanı artık **Supabase** (proje `nwxpmjwbzryuyzmopgue`, Frankfurt). Yerel site de doğrudan Supabase'e bağlanıyor, yerelde ayrıca veritabanı çalıştırmaya gerek yok.
- Hediş şu an **rehber modunda** çalışıyor (seçeneklerle öneri), çünkü bu bilgisayarın `.env`'inde yapay zeka anahtarı yok. Sohbet modu için `OPENAI_API_KEY` eklemek yeterli.
- Ürünler: ikas'tan bir kez çekilen 7 ürün; adları ve açıklamaları düzeltildi. Yeni ürünler admin'den elle eklenecek.

**Akşam devam ederken:**

```bash
git pull                 # demo-cilasi dalındasın
npm install              # yalnızca paketler değiştiyse
npm run dev              # http://localhost:3000 · admin: /admin
```

Gerekli dosyalar bu bilgisayarda duruyor, git'e girmiyor:
- `.env`: Supabase adresi ve şifresi, admin şifre hash'i ve anahtarlar.
- `public/uploads`: ürün fotoğrafları.

Başka bir bilgisayarda devam edeceksen bu ikisini de taşıman gerekir.

**Sıradaki işler (öncelik sırasıyla):**
1. **Supabase veritabanı şifresini yenile.** Şifre sohbette açıkça paylaşıldı. Supabase → Project Settings → Database → Reset password; yeni şifreyi `.env`'deki iki adrese yaz.
2. **Fotoğrafların yeri:** Supabase'de `/uploads/...` adresiyle kayıtlı; Vercel'de bu klasör olmayacak. Vercel Blob mu, Supabase Storage mı? Karar verince fotoğrafları yükleyip adresleri güncelleyen adımı yazacağım.
3. **Site sahibinden alınacak bilgiler:**
    - Kargo ücreti: `src/lib/site.ts` → `ORDER_INFO.shipping`
    - Ödeme yöntemleri ve iade/değişim koşulları: `src/app/(site)/nasil-siparis-verilir/page.tsx`
    - KVKK'daki işletme adı, adres ve e-posta
4. **Yayına alma (Vercel):** README'deki adımlar. Supabase'de **Connect → ORMs → Prisma** ekranındaki iki pooler adresi kullanılacak; doğrudan adres Vercel'de çalışmaz.
5. `demo-cilasi` dalını inceleyip `main`'e birleştir.
6. Admin → Ürünler → "Etiketi onaysız" filtresinden Hediş etiketlerini gözden geçir. 7 ürünün hepsinde aynı tahmini etiketler var.

---

## 1. Şu an site ne yapıyor?

**Ziyaretçi tarafı**
- **Ana sayfa = ürün vitrini.**
  - Yatay kaydırılan kategori çipleri, aramalı "Tüm kategoriler" penceresi, bütçe ve sıralama seçicileri.
  - **Ürün araması:** ad, açıklama, kategori ve etiketlerde arar. Türkçe harfleri katlar, yani "canta" yazınca "Çanta" da bulunur.
  - Üst bantta "3 iş gününde kargoda", hero'da "rengini sen seç, senin için örelim".
  - Ürünlerin altında KOSGEB vurgulu "bu dükkânın hikâyesi" şeridi var.
  - Masaüstünde geniş düzen: 1440 px'te neredeyse tam genişlik, 1920 px'te 1600 px.
- **Kategori sayfaları:** `/kategori/canta`, `/kategori/giyim`. Kendi başlıkları, açıklamaları ve canonical adresleri var, sitemap'te yer alıyorlar. Eski `/?kategori=` ve `/magaza` linkleri buraya yönleniyor.
- **Hediş, hediye asistanı.**
  - Ana sayfaya gelen ziyaretçiye oturum başına bir kez **tam ekran** açılıyor. Bu bilinçli bir karar, değişmeyecek.
  - **Sohbet modu** (yapay zeka anahtarı varsa): çip ya da serbest metin; her turda tek bir soru ve hazır cevaplar; öneri ve her ürün için "neden" cümlesi.
  - **Rehber modu** (anahtar yoksa, bakiye bittiyse ya da sınır dolduysa kendiliğinden): kime → bütçe → ilgi alanları seçenekleri; kural tabanlı motor öneri yapar. Sohbette seçilen kişi rehbere taşınır.
  - Önerilen ürünler sepete eklenebiliyor; sepette ürün varken "Sepete git (N) →" çıkıyor.
  - Üst menüde "Hediş · hediye asistanı" düğmesi var. Sağ alttaki yüzen düğme yalnızca sayfa aşağı kayınca görünüyor, sepette gizli.
- **Ürün sayfası:**
  - Kaydırılabilen galeri; dokununca tam ekran görüntüleyici (oklar, Esc, tıklayınca büyütme).
  - Fiyat, adet, sepete ekle, "WhatsApp'tan sor", "Öne çıkanlar", benzer ürünler, JSON-LD.
  - "Sepete ekle"nin altında sipariş bilgisi: elde ve istediğin renkte örülür, 3 iş gününde kargoda, ödeme ve kargo WhatsApp'ta netleşir.
  - Mobilde aşağı inince alttan yapışkan "Sepete ekle" çubuğu açılıyor.
- **Sepet → WhatsApp.** Online ödeme yok.
  - "Hediye olarak paketlensin" kutusu ve not alanı (renk, beden, hediye notu) mesaja ekleniyor.
  - Buton metni "Siparişi WhatsApp'tan gönder". "Sepeti boşalt" düğmesi var.
  - Mesaj 905050434796 numarasına gidiyor.
- **Diğer sayfalar:**
  - `/nasil-siparis-verilir`: 3 adım ve SSS.
  - `/hakkimizda`: KOSGEB desteğiyle kendi ayakları üzerinde duran bir kadın girişimcinin hikâyesi.
  - KVKK/çerez (işletme bilgileri hâlâ yer tutucu), 404 (artık header, footer ve sepetle), hata sayfaları, sitemap, robots.

**Admin paneli (`/admin`)**
- **Giriş:** Tek admin, şifre bcrypt ile saklanıyor, oturum JWT çerezinde. Hatalı giriş denemeleri sınırlı.
- **Özet:** Ziyaret kutuları (bugün / 7 / 30 gün), 30 günlük grafik, etiketi onaylanmamış ürün uyarısı.
- **Ürün ekleme/düzenleme ekranı:**
  - Sürükle-bırak çoklu fotoğraf yükleme.
  - Fotoğraftan ya da addan yapay zeka önerisi; yalnızca boş alanları doldurur, doldurduğu alanlarda "AI" rozeti çıkar.
  - Eşleşmeyen kategori için "Kategoriyi oluştur" önerisi.
  - **Kaydedilmemiş değişiklik varken sayfadan çıkmaya çalışınca uyarı veriyor.**
- **Ürün listesi:** Arama, filtreler, hızlı yayın aç/kapa, "AI ile eksikleri doldur".
- **Kategoriler** ve **Ayarlar** (WhatsApp numarası, mesajın ilk cümlesi, Instagram, yapay zeka modeli).

**Kalite (8 Ekim öğleden sonra)**
- 91 birim testi (vitest), tip denetimi ve lint temiz.
- 36 uçtan uca test (masaüstü + mobil) Supabase üzerinde geçti. Bunlara erişilebilirlik (axe) taramaları dahil; yeni sayfalar da tarandı.
- Admin E2E testleri bu oturumda çalıştırılmadı, çünkü veritabanına geçici ürün yazıyorlar.

---

## 2. Teknik yapı (kısaca)

- **Çatı:** Next.js 16 (App Router, Cache Components, `proxy.ts`), TypeScript, Tailwind v4.
- **Veritabanı:** Prisma 7 + PostgreSQL, **Supabase** üzerinde.
  - Yerelde doğrudan bağlantı kullanılıyor (`db.<proje>.supabase.co:5432`). Bu adres yalnızca IPv6 destekliyor; bu bilgisayarda çalışıyor.
  - Vercel'de pooler adresleri kullanılacak (README'de anlatılıyor).
  - Şema Prisma migration'larıyla kuruluyor; Supabase CLI gerekmiyor.
  - `npx prisma dev` (Docker'sız yerel Postgres) denendi; eşzamanlı bağlantılarda kopup kilitlendiği için bırakıldı. Eski yerel veri o sunucuda yedek olarak duruyor.
- **Fotoğraflar:** Vercel Blob planlanıyor. Anahtar yokken yerelde `public/uploads` kullanılıyor; bu klasör gitignore'da.
- **Yapay zeka:** OpenAI, varsayılan model `gpt-6-luna`.
  - Ürün analizi yaklaşık 3–5 sn, ürün başına yaklaşık 0,00015 $.
  - Model Ayarlar'dan değiştirilebiliyor; adında "/" olan modeller OpenRouter üzerinden çağrılıyor.
  - Hediş sohbeti de aynı modeli kullanıyor.
  - Anahtar yoksa ya da kalıcı bir hata olursa (bakiye, geçersiz anahtar) sohbet uç noktası 503 döner, Hediş rehber moduna geçer.
- **Sipariş/teslimat metinleri tek yerde:** `src/lib/site.ts` → `ORDER_INFO`. Üst bant, ürün sayfası ve SSS buradan okuyor.
- **Önemli klasörler:**
  - `src/lib/ai/`: AI istemcisi, ürün analizi, öneri birleştirme.
  - `src/lib/hedis/`: sohbet, kural tabanlı öneri motoru, rehber metinleri (`messages.ts`), sınıflandırma.
  - `src/components/hedis/`: `HedisChat` (sohbet), `HedisRehber` (seçenekli mod), `HedisParts` (ortak parçalar).
  - `src/components/site/`: `SiteShell` (header/footer/Hediş kabuğu; 404 de kullanıyor), `ShopSection`, `OrderInfo`, galeri.
  - `src/app/admin/`: Admin paneli.
  - `src/app/(site)/`: Vitrin.
  - `e2e/`: Uçtan uca testler.
- **Tasarım dili:** Kraft kağıt, krem, kiremit, zeytin, hardal; Fraunces + Caveat + Karla fontları; washi bant, delikli fiyat etiketi, el çizimi alt çizgi. AI efektleri bilerek bu sıcak paletle yapıldı (mor-mavi "AI" gradyanı kullanılmadı).

---

## 3. Konuşma geçmişi ve alınan kararlar

**Başlangıç ve kurulum**
1. **Başlangıç:** `ProjeMimarisi.md`'deki planı aşama aşama uygulamam istendi.
2. **İlk kararlar:**
   - Yerel veritabanı Docker'da çalışacak. Docker başta açılmadı; sen düzelttin.
   - Marka adı "hediyegetir" olacak.
   - Her aşama sonunda GitHub'a commit + push yapılacak.
3. **GitHub yetkisi:** İlk push 403 verdi. `umitcan246` hesabı repoya collaborator olarak eklendi ve sorun çözüldü.

**İlk sürüm (Aşama 0–9)**

4. **Aşama 0–9:** Kurulum, veri modeli, ikas'tan ürün aktarma, tasarım sistemi, mağaza, sepet + WhatsApp, admin, Hediş (kural tabanlı ilk sürüm), ziyaret istatistikleri, cilalama.
   - Arada tarayıcıda çıkan bir sepet hatası düzeltildi: depolama tanımı sırası yüzünden `useCart.persist` undefined oluyordu.
5. **WhatsApp numarası:** 0505 043 47 96 verildi, 905050434796 olarak kaydedildi.
6. **Çerez kararı:** Ziyaret istatistiği çerezi için "planlandığı gibi kalsın" dendi: onay bandı yok, sadece bilgilendirme sayfası var. Hukuki sorumluluk sende.
7. **KVKK işletme bilgileri:** Sonra verilecek; sayfada sarı vurgulu yer tutucular var.

**Sonraki değişiklikler**

8. **ikas kaldırıldı:** "ikas ile işimiz kalmadı, ürünleri biz ekleyeceğiz" dendi.
   - Senkron kodu, admin sayfası ve ilgili veritabanı alanları silindi.
   - ikas'taki fotoğraflar yerel diske indirildi.
   - Yayına ilk geçiş için `npm run urun-aktar` betiği yazıldı.
9. **Hediş açılır pencereye taşındı:** "Hediş ana sayfada popup olarak çıksın" dendi. Ana sayfa vitrin oldu, Hediş açılır pencereye taşındı.
10. **Fotoğraftan yapay zeka önerisi:**
    - Önce OpenRouter anahtarı denendi. Kredisiz hesapta yalnızca ücretsiz modeller çalıştı; fotoğraf başına 25–40 sn sürdü, sık sık meşgul oldu, Türkçesi hatalıydı.
    - Sonra OpenAI anahtarı verildi (4 $ bakiye). gpt-6-luna, gpt-5-nano ve gpt-4.1-nano karşılaştırıldı.
    - En hızlı, en ucuz ve Türkçesi en iyi olan **gpt-6-luna** seçildi: yaklaşık 2,7 sn, yaklaşık 0,00015 $.
    - Kararlar: "Önce ücretsizle başla, model ayarlardan değişebilsin" ve "Yalnızca boş alanları doldursun".
11. **Büyük UI/UX ve AI isteği:**
    - **A.** Geniş sayfa düzeni ve ölçeklenebilir filtre alanı.
    - **B.** Admin ürün ekranı baştan; AI analizi, animasyon, kategori önerisi, toplu zenginleştirme.
    - **C.** Hediş'in AI ile konuşması.
    - Tek tek gerçek modelle denendi ve test edildi.
12. **Talimat:** "Soru sorma, emin olmadıklarını sonraki mesaja bırak, bitince her şeyi ve bu özet dosyasını pushla."

**8 Ekim öğleden sonra: yeni bilgisayar, demo cilası, Supabase**

13. **Yeni bilgisayar:**
    - Proje GitHub'dan zip olarak indirildi (`C:\DEVPACKS\hediyegetir.com-main`).
    - Bu bilgisayarda Docker ve WSL yok. Önce `npx prisma dev` ile yerel bir veritabanı kuruldu, örnek verilerle açıldı.
    - "Docker kuralım" fikri, eksik bağımlılık olmadığı (sorun demo verisiydi) anlaşılınca ertelendi.
14. **Ürünler ikas'tan bir kez çekildi:**
    - "Ürünleri bir kere çek, görselleri dosyamıza indir, sonra ikasla işimiz kalmasın" dendi.
    - 7 ürün ve 9 fotoğraf alındı (`public/uploads`). Geçici betik çalıştırılıp silindi; projede ikas'a bağ kalmadı.
    - Diğer ürünler zamanla admin'den eklenecek.
15. **Acımasız ama yapıcı inceleme:** Dört başlıkta (mantık/akış, UI/UX, metinler, eksikler) Kritik/Orta/Düşük olarak 48 maddelik bir rapor hazırlandı. Kararların:
    - Site **demo**; demo için önemsiz konuların kavgası verilmeyecek.
    - Ürün azlığından ya da çeşitsizliğinden doğan sorunlar konu dışı, çünkü ürünler eklenecek.
    - **Hediş'in ilk sayfada tam ekran açılması bilinçli bir karar; değişmeyecek.**
    - Rapordan beğendiğin maddeler seçildi ve sırayla uygulandı.
16. **Uygulanan maddeler:**
    - **Hediş:**
        - Yapay zekasız rehber modu (eski kural tabanlı akış geri getirildi).
        - "Sepete git (N)" bağlantısı.
        - Butonlar sadeleşti, etiket "Hediş · hediye asistanı" oldu.
    - **Sepet:**
        - Not alanı ve hediye paketi seçeneği.
        - "Siparişi WhatsApp'tan gönder" butonu.
        - "Sepeti boşalt".
    - **Ürün sayfası:**
        - Sipariş bilgisi bloğu.
        - Kaydırmalı galeri ve tam ekran görüntüleyici.
        - Mobilde yapışkan "Sepete ekle".
    - **Ürün verisi:**
        - Adlar düzeltildi (ör. "Handmade Kol Çantası" → "Kapaklı Örgü Omuz Çantası"), adresler de buna göre değişti.
        - Açıklamalar "sen" diliyle yeniden yazıldı, "Öne çıkanlar" dolduruldu.
        - "Kadın Giyim (Handmade)" kategorisi "Giyim" oldu.
    - **Metin:** Üst bant ve hero'ya "3 iş gününde kargoda" ve "rengini sen seç" vaadi taşındı.
    - **Yeni sayfalar:** "Nasıl sipariş verilir?" + SSS, Hakkımızda (KOSGEB vurgulu), kategori sayfaları; ana sayfaya hikâye şeridi.
    - **Vitrin araması.**
    - **404:** artık header ve footer'la açılıyor.
    - **Admin:** kaydedilmemiş değişiklik uyarısı.
17. **Supabase'e geçiş:**
    - "Database için Supabase kullanacağız" dendi ve bağlantı bilgileri verildi.
    - Supabase boştu. Şema Prisma migration'larıyla kuruldu, ürünler `urun-aktar --blob-yok` ile taşındı, yerel `.env` Supabase'e çevrildi.
    - `urun-aktar` betiğinde bir hata düzeltildi: özel günler, etiketler, "öne çıkanlar" ve yapay zeka modeli ayarı taşınmıyordu.
    - README ve KVKK metni Neon yerine Supabase'e göre güncellendi.
18. **GitHub:** Bu oturumun değişiklikleri `demo-cilasi` dalına pushlandı. `main`'e birleştirme senin onayına bırakıldı.

---

## 4. Açık konular

1. **Şifre ve anahtarları yenile (güvenlik, acil):**
   - **Supabase veritabanı şifresi** bu oturumda sohbette paylaşıldı. Yenile ve `.env`'deki `DATABASE_URL` ile `DIRECT_URL`'e yaz.
   - OpenAI (`sk-proj-…`) ve OpenRouter (`sk-or-…`) anahtarları önceki oturumda sohbette paylaşılmıştı. İptal edip yenilerini oluştur; OpenAI projesine aylık harcama limiti koy. OpenRouter artık kullanılmıyor.
   - Bu bilgisayarın `.env`'inde yapay zeka anahtarı yok. Yeni `OPENAI_API_KEY`'i eklersen Hediş sohbet moduna döner, admin'deki fotoğraftan öneri de açılır.
2. **Fotoğraflar:**
   - Supabase'de `/uploads/...` adresiyle duruyorlar ve yalnızca bu bilgisayarda (`public/uploads`, git'e girmiyor).
   - Vercel'e çıkmadan önce Vercel Blob'a ya da Supabase Storage'a yüklenmeleri gerekiyor. Bu bilgisayar giderse fotoğraflar da gider; istersen GitHub'a eklenebilir (yaklaşık 1,2 MB).
3. **Yayına alma (Aşama 10):**
    - Vercel hesabı (repoyu bağla + Blob deposu).
    - Supabase pooler adresleri: `DATABASE_URL` = Transaction pooler (6543), `DIRECT_URL` = Session pooler (5432).
    - Yayında kullanılacak admin şifresi.
    - hediyegetir.com DNS erişimi.
    - Ortam değişkenleri: `OPENAI_API_KEY`, `HEDIS_DAILY_LIMIT` (isteğe bağlı).

    Adımlar README'de.
4. **Site sahibinden alınacaklar:**
    - KVKK: işletme adı, adres, e-posta (`src/app/(site)/kvkk/page.tsx`).
    - Kargo ücreti (`src/lib/site.ts` → `ORDER_INFO.shipping`).
    - Ödeme yöntemleri ve iade/değişim koşulları (SSS). Şu an dürüstçe "WhatsApp'ta netleştiriyoruz" yazıyor.

    Metinleri bir hukukçuya da göstermeni öneririm; özellikle yapay zeka, yurt dışı aktarım ve mesafeli satış kısımlarını.
5. **Hediş etiketleri:** 7 ürünün hepsinde aynı tahmini "kime uygun" listesi var ve hiçbiri onaylı değil. Admin'de "Etiketi onaysız" filtresiyle gözden geçirilmeli.
6. **Hediş maliyeti:** Herkese açık sohbet, tur başına küçük de olsa bakiye harcıyor. IP başına 10 dakikada 30 istek ve günde toplam 1500 istek sınırı var (`HEDIS_DAILY_LIMIT`). Bakiye bitse bile Hediş artık rehber moduna geçiyor.
7. **Admin şifresi:** Bu bilgisayardaki yerel şifre yalnızca `.env`'de (hash olarak) duruyor ve sohbette sana iletildi; bu dosyaya bilerek yazılmadı. Yayında farklı bir şifre kullanılmalı.
8. **Admin E2E testleri:** Bu oturumda çalıştırılmadı. Veritabanına geçici ürün yazdıkları için demo veritabanında değil, ayrı bir test veritabanında çalıştırmak daha doğru olur.

---

## 5. Commit geçmişi

| Commit | Ne yapıldı |
| --- | --- |
| `cd5005e` | Aşama 0: kurulum (Next.js 16, Tailwind v4, Prisma 7, Docker Postgres) |
| `657f585` | Aşama 1: veri modeli, Hediş sınıflandırması, seed |
| `02c7999` | Aşama 2: ikas içe aktarma (sonradan kaldırıldı) |
| `12d0f24` | Aşama 3: tasarım sistemi ve ortak bileşenler |
| `20b2bb3` | Aşama 4: mağaza ve ürün detay |
| `38a9599` | Sepet depolama hatası düzeltmesi |
| `dcf38ef` | Aşama 5: sepet ve WhatsApp |
| `32e740d` | Aşama 6: admin paneli |
| `5080893` | Aşama 7: Hediş (kural tabanlı ilk sürüm) |
| `44e03c1` | Aşama 8: ziyaret kaydı ve admin özeti |
| `6058f9d` | Aşama 9: SEO, erişilebilirlik, hata sayfaları |
| `5f3ccf2` | Yayına alma hazırlığı |
| `444a22e` | ikas kaldırıldı, ürün aktarma betiği |
| `20a892f` | Hediş açılır pencere, ana sayfa = mağaza |
| `1003bfa` | Admin'de fotoğraftan AI önerisi |
| `853304f` | Varsayılan model OpenAI gpt-6-luna |
| `5e76d49` | Geniş düzen ve yeni filtre alanı |
| `b770cbe` | Admin ürün ekranı baştan, AI destekli |
| `66a5233` | Hediş yapay zekayla konuşuyor |
| `9eadbe4` | KVKK'ya Hediş/OpenAI bilgisi + bu özet (`main`'in son hâli) |
| (son, `demo-cilasi`) | Demo cilası: Hediş rehber modu, arama, kategori sayfaları, sepet notu, yeni sayfalar, Supabase |

---

## 6. Yerelde çalıştırma (hatırlatma)

```bash
npm install
npm run dev          # http://localhost:3000  ·  admin: /admin  (veritabanı: Supabase, .env'de)
npm test             # birim testleri
npm run typecheck
```

- **Uçtan uca testler:** `npx playwright test --project=masaustu --project=mobil`. Chromium bu bilgisayarda kurulu.
  - Hediş sohbet testleri yapay zekayı taklit eder ama dev sunucusunda bir `OPENAI_API_KEY` tanımlı olmalı; sahte bir değer yeter. Örnek: `OPENAI_API_KEY=sahte npm run dev`.
  - Admin testleri için `E2E_ADMIN_PASSWORD` gerekir.
- **Prisma şeması** değiştikten sonra çalışan dev sunucusunu yeniden başlatmak gerekir; eski veritabanı istemcisi bellekte kalıyor.
- **Veritabanına doğrudan yapılan değişiklikler** (betikler) katalog önbelleğinde en geç bir saat sonra görünür. Hemen görmek için dev sunucusunu yeniden başlat.
- **Docker'lı kurulum** (başka bir bilgisayarda) README'de anlatılıyor: `npm run db:up` + `npm run db:migrate`.
