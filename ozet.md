# hediyegetir.com — Proje özeti ve konuşma geçmişi

Bu dosya, siteyi geliştirirken yaptığımız konuşmaların ve alınan kararların özetidir. Yeni bir sohbet (ya da yeni bir çalışma oturumu) buradan okuyup kaldığımız yerden devam edebilsin diye yazıldı.

- **Repo:** https://github.com/ErtugrulGulmez00/hediyegetir.com
  - `main` ve `demo-cilasi` aynı yerde: `3084c1b`. Bütün çalışma `main`'de.
- **Plan dosyası:** [ProjeMimarisi.md](ProjeMimarisi.md)
- **Kurulum ve yayına alma:** [README.md](README.md)
- **Son güncelleme:** 8 Ekim 2026, akşam

---

## Yeni sohbete not (önce bunu oku)

- **Proje:** El örgüsü çanta, giysi ve küçük hediyeler satan bir dükkânın sitesi.
  - Online ödeme yok; sepet WhatsApp mesajına dönüşüyor.
  - Hediş adlı hediye asistanı ürün öneriyor.
  - Ürünler admin panelinden ekleniyor.
- **Amaç şu an:** Siteyi **site sahibine demo** olarak göstermek. Henüz yayında değil, yerelde çalışıyor.
- **Kullanıcıyla çalışma biçimi:**
  - Rahat Türkçe konuşuyor ("kanka").
  - Onayladığı işleri soru sormadan sırayla bitirmeni istiyor; bitince siteyi Chrome'da açıp göster.
  - Uzun seçenek listeleriyle soru sormaktan hoşlanmıyor. Bir şey belirsizse kısa sor ya da makul varsayımla ilerleyip söyle.
- **Değişmeyecek kararlar:**
  - Hediş'in ana sayfada **tam ekran kendiliğinden açılması bilinçli**. Sorun olarak gösterme, değiştirme.
  - Ürün sayısının azlığından ya da çeşitsizliğinden doğan sorunlar konu dışı; ürünler zamanla eklenecek.
  - Tasarım sıcak paletle (kraft, krem, kiremit, hardal, zeytin) kalacak. "AI" efektleri için mor-mavi gradyan kullanılmıyor (istisna: Hediş robotunun kendi mor/turkuaz renkleri, kullanıcının kararı).
- **Gizli bilgiler:**
  - Supabase şifresi, admin şifresi ve OpenAI anahtarı **yalnızca `.env`'de** duruyor; `.env` git'e girmiyor.
  - Bunları hiçbir dosyaya, commit'e ya da bu özete yazma.
  - OpenAI anahtarı daha önce sohbette paylaşıldı. Kullanıcı bunun sorun olmadığını, **anahtarı yenilemeyeceğini** açıkça söyledi; tekrar önerme.
- **Bu bilgisayardaki (Windows) tuzaklar:** 6. bölümde.

---

## 0. Nerede kaldık? (8 Ekim 2026, akşam)

**Durum:**

- Site demoya hazır. Bütün testler geçiyor (6. bölüm).
- Veritabanı **Supabase** (proje `nwxpmjwbzryuyzmopgue`, Frankfurt). Yerel site doğrudan Supabase'e bağlanıyor.
- `.env`'de OpenAI anahtarı var:
  - Hediş **sohbet modunda** çalışıyor.
  - Admin'de **fotoğraftan doldurma** açık. Fotoğraf yüklenince ad, kategori, açıklama, özellikler ve Hediş etiketleri yaklaşık 7 sn'de doluyor; fiyat ve stok bilerek boş kalıyor.
- 7 ürün var:
  - Hepsinin Hediş etiketleri gözden geçirilip onaylandı.
  - Stokları "sipariş üzerine" (boş).
  - Açıklamalar "sen" diliyle yazılı.
- Ziyaret istatistikleri 8 Ekim akşamı sıfırlandı. Sonrasında yerel gezinti ve testler yeniden sayılıyor.

**Kaldığımız soru:**

- Yapay zekanın yazdığı ürün açıklamaları **"siz"** diliyle ("stilinize"), sitenin geri kalanı **"sen"** diliyle.
- Kullanıcı "siz yapabilirsin istersen" dedi, ama sonra konuyu açmadan push istedi. Karar netleşmedi.
- Seçenekler:
  - Yapay zeka talimatına "sen diye hitap et" eklemek: tek satır, `src/lib/ai/product-vision.ts` içindeki `aciklama` tarifi.
  - Bütün siteyi "siz" yapmak: büyük bir metin değişikliği.

**Demo günü kontrol listesi:**

1. **Siteyi prod modunda göster:** `npm run build && npm start`.
   - Dev modunda sol altta Next.js'in "N" rozeti çıkıyor.
   - Dev modunda her sayfa ilk açılışta birkaç saniye derleniyor.
2. **Ziyaret sayacını demodan hemen önce tekrar sıfırla.** `DailyStat` ve `VisitorDay` tablolarını boşaltmak yeterli.
3. **WhatsApp numarasını doğrula:** Ayarlar'da 905050434796 var. Sahibin numarası mı, telefondan gerçek bir "sepet → WhatsApp" denemesi yap.
4. **Telefondan göster:** Aynı Wi-Fi'de bilgisayarın yerel IP'siyle (ör. `http://192.168.1.101:3000`).
5. **Önerilen 5 dakikalık akış:**
   - Ana sayfada Hediş karşılar → "Anne" → öneriler → sepete ekle.
   - Sepette not ve hediye paketi → WhatsApp'ta hazır mesaj.
   - Telefondan admin'e gir, fotoğraf çekip ürün ekle (yapay zeka doldurur) → ürün sitede görünür.
6. **Teslimde sahibe yeni admin şifresi ver.** Şu anki şifre testlerde ve sohbette geçti.

**Site sahibine sorulacaklar:**

- **Üstü çizili eski fiyatlar:** 7 ürünün hepsinde var (ikas'tan geldi, hepsi yaklaşık %10 indirimli).
  - Gerçek bir kampanya yoksa kaldırılmalı: sürekli indirim inandırıcı değil.
  - Mevzuat da indirimden önceki fiyatın gerçekten uygulanmış olmasını istiyor (son 30 gün kuralı).
- **Instagram adresi:** Ayarlar'da boş, sitede sosyal bağlantı yok.
- **Kargo ücreti** (`src/lib/site.ts` → `ORDER_INFO.shipping`).
- **Ödeme yöntemleri ve iade/değişim koşulları** (`src/app/(site)/nasil-siparis-verilir/page.tsx`).
- **KVKK'daki işletme adı, adres ve e-posta** (`src/app/(site)/kvkk/page.tsx`; şu an sarı yer tutucular var).

**Sonraki büyük işler:**

1. **Fotoğrafların yeri ve yedeği:**
   - Ürün fotoğrafları yalnızca bu bilgisayarda (`public/uploads`, gitignore'da). ikas'la işimiz bittiği için başka kopya yok.
   - Vercel'e çıkmadan önce Vercel Blob'a ya da Supabase Storage'a taşınmalı. Karar verilince fotoğrafları yükleyip adresleri güncelleyen adım yazılacak.
2. **Yayına alma (Vercel):**
   - README'deki adımlar izlenecek.
   - Supabase'de **Connect → ORMs → Prisma** ekranındaki iki pooler adresi kullanılacak; doğrudan adres Vercel'de çalışmaz.
   - `OPENAI_API_KEY` Vercel ortam değişkenlerine de eklenmeli.
3. **Supabase veritabanı şifresi:** Sohbette paylaşıldı. Yenilemek önerildi; kullanıcı henüz bir şey demedi.
4. **Supabase ücretsiz plan:** 7 gün hiç kullanılmazsa proje duraklatılıyor. Panelden tekrar başlatılabilir.

---

## 1. Site şu an ne yapıyor?

**Ziyaretçi tarafı**

- **Üst kısım:**
  - Koyu bant: "3 iş gününde kargoda · sipariş ve ödeme WhatsApp'tan".
  - Logo, hap biçimli **menü çubuğu** (Mağaza · Hediş · Nasıl sipariş verilir? · Hikâyemiz) ve "Sepet" düğmesi. Mobilde menü logonun altına iner, sığmazsa yana kayar.
- **Ana sayfa:**
  - **Hero:**
    - Başlık "Elde örülen, sevgiyle paketlenen hediyeler", alt satır "rengini sen seç, senin için örelim".
    - Düğmeler, üç güven maddesi.
    - Sağda öne çıkan ürünlerden polaroid kolajı. (Köşedeki maskot ve "Kime hediye arıyorsun?" balonu kullanıcının isteğiyle kaldırıldı.)
  - Altında ürün vitrini: kategori çipleri, arama, bütçe ve sıralama.
  - En altta KOSGEB vurgulu "bu dükkânın hikâyesi" şeridi.
- **Ürün araması:** Ad, açıklama, kategori ve etiketlerde arar. Türkçe harfleri katlar: "canta" yazınca "Çanta" da bulunur, "yelek" yazınca süveterler çıkar.
- **Kategori sayfaları:** `/kategori/canta`, `/kategori/giyim`. Eski `/?kategori=` ve `/magaza` adresleri buraya yönleniyor.
- **Hediş, hediye asistanı:**
  - Ana sayfaya gelen ziyaretçiye oturum başına bir kez tam ekran açılıyor.
  - Görünüm **çerçevesiz ve saydam**: koyu bulanık bir arka plan üstünde ortada sallanan maskot, konuşma balonu ve seçenek etiketleri. Başlık ya da "Kapat" yazısı yok.
  - Kutuların dışına tıklayınca ya da Esc'e basınca kapanıyor. Ekran okuyucular için gizli bir başlık ve "Kapat" düğmesi var.
  - **Sohbet modu** (anahtar varsa): Çip ya da serbest metinle başlıyor. Her turda tek bir soru soruyor ve hazır cevaplar sunuyor. Önerdiği her ürün için bir "neden" cümlesi yazıyor.
  - **Rehber modu** (anahtar yoksa, bakiye bittiyse ya da sınır dolduysa kendiliğinden): Kime → bütçe → ilgi alanları seçeneklerinden sonra kural tabanlı motor öneri yapıyor.
  - Öneriler sepete eklenebiliyor; sepette ürün varken büyük, hardal renkli "Sepete git (N) →" düğmesi çıkıyor.
  - Gösterilen ürünler hakkında soru sorulunca (fiyat, ölçü…) yalnızca yazıyla cevap veriyor; aynı ürün kartları tekrar açılmıyor, mesajın altında küçük bağlantı olarak anılıyor.
  - Kapandıktan sonra 15 saniye içinde açılırsa sohbet kaldığı yerden devam ediyor (yanlışlıkla dışarı tıklayan geri dönebilsin); 15 saniyeden sonra açılınca baştan başlıyor (`RESET_AFTER_MS`).
  - Sağ alttaki yüzen düğme yalnızca sayfa aşağı kayınca görünüyor ve sepette gizleniyor.
- **Ürün sayfası:**
  - Galeri admin'de seçilen düzende: **Tek** (kaydırmalı), **İkili** (iki sütun) ya da **Üçlü** (bir büyük + iki küçük). Fotoğraf yetmezse bir alt düzene düşer. Fotoğraf sütunu dar (masaüstünde 26–30rem), sayfa kaydırmadan görünüyor.
  - Masaüstünde fotoğrafın üstüne gelince imlecin olduğu yer büyüyor. Tıklayınca görüntüleyici açılıyor: tekerlek/tıklama/+− ile yakınlaştırma, sürükleyerek gezme, altta küçük resimler; mobilde çift dokunuş ve iki parmakla büyütme, kaydırarak geçiş. Dışarı tıklayınca ya da Esc ile kapanıyor.
  - Masaüstünde fotoğraf ekran yüksekliğine göre boyutlanıyor; bilgiler iki sütun (satın alma | açıklama, özellikler, özel günler) ve sipariş bilgisi fotoğrafla aynı hizada bitiyor. Mobilde alt alta.
  - Fotoğrafın sağ üst köşesinde (mobilde de) ürüne göre en fazla 3 damga: hazırlar ("El yapımı", "Ev yapımı", "El işi", "Kadın işi", "Kadın emeği") ya da serbest yazı (en çok 20 karakter); hiç yoksa damga görünmüyor.
  - Fiyat, adet, "Sepete ekle", "WhatsApp'tan sor".
  - Sipariş bilgisi kutusu: elde ve istediğin renkte örülür · 3 iş gününde kargoda · ödeme ve kargo WhatsApp'ta netleşir.
  - "Öne çıkanlar", benzer ürünler.
  - Mobilde aşağı inince alttan yapışkan "Sepete ekle" çubuğu açılıyor.
- **Sepet → WhatsApp:**
  - "Hediye olarak paketlensin" kutusu ve not alanı mesaja ekleniyor.
  - Düğmeler: "Siparişi WhatsApp'tan gönder", "Sepeti boşalt".
- **Diğer sayfalar:**
  - `/nasil-siparis-verilir`: 3 adım ve SSS.
  - `/hakkimizda`: KOSGEB desteğiyle kendi ayakları üzerinde duran bir kadın girişimcinin hikâyesi ve **atölye videosu**. Video sesiz döngüde, görününce oynuyor; hareket azaltma tercihine uyuyor.
  - KVKK/çerez, 404 (header ve footer'la), sitemap, robots.
  - iPhone ana ekran ikonu (`src/app/apple-icon.png`).

**Admin paneli (`/admin`)**

- **Giriş:** Tek admin. Şifre bcrypt ile saklanıyor, oturum JWT çerezinde, hatalı denemeler sınırlı.
- **Menü:** Masaüstünde solda. Mobilde dört bağlantı tek satırda; "Siteyi aç ↗" ve "Çıkış" logonun yanında.
- **Özet:** Ziyaret kutuları (bugün / 7 / 30 gün), 30 günlük grafik, etiketi onaysız ürün uyarısı.
- **Ürün ekranı:**
  - Tek ekranlık düzen: üst çubukta Yayında / Öne çıkan ve Kaydet. Geniş ekranda üç sütun: (1) küçük fotoğraf alanı + "Ürün sayfasında görünüm" (fotoğraf düzeni seçici, eldeki fotoğraflarla önizleme; çoklu damga seçici, canlı önizleme), (2) ürün bilgileri, (3) yapışık ve kendi içinde kayan AI asistanı + Hediş etiketleri.
  - Önce fotoğraf (sürükle-bırak, çoklu).
  - Yapay zeka asistanı: Fotoğraftan ya da addan öneri getiriyor ve yalnızca boş alanları dolduruyor. Doldurduğu alanlarda "AI" rozeti çıkıyor.
  - Eşleşmeyen kategori önerilirse "Kategoriyi oluştur" teklif ediyor.
  - Kaydedilmemiş değişiklik varken sayfadan çıkmaya çalışınca uyarıyor.
- **Ürün listesi:** Kart ızgarası (fotoğraf, öne çıkan / etiket onaysız rozetleri, fiyat, kategori · stok). Fotoğrafın sağ üst köşesinde sil düğmesi (onay penceresiyle; masaüstünde karta gelince görünür). Arama, filtreler (Yayında / Pasif / Etiketi onaysız), hızlı yayın aç/kapa, "AI ile eksikleri doldur".
- **Kategoriler:** Kart görünümü. Her kartta ürün küçük resimleri, ürün ve yayındaki ürün sayısı, "mağazada gizli" rozeti ve "Sitede gör ↗" bağlantısı var.
- **Ayarlar:**
  - WhatsApp numarası, mesajın ilk cümlesi, Instagram.
  - Yapay zeka modeli seçimi:
    - Anahtar varken kapalı bir "Gelişmiş" bölümünde duruyor.
    - Anahtar yoksa hiç görünmüyor.
    - Alan formda yoksa kayıtlı model korunuyor.

---

## 2. Teknik yapı (kısaca)

- **Çatı:** Next.js 16 (App Router, Cache Components, `proxy.ts`), TypeScript, Tailwind v4.
  - Bu Next sürümü eğitim verisindekinden farklı. Kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili rehbere bak (`AGENTS.md`).
- **Veritabanı:** Prisma 7 + PostgreSQL, **Supabase** üzerinde.
  - **Yerel bağlantı:**
    - Doğrudan adres `db.<proje>.supabase.co:5432`; yalnızca IPv6 destekliyor, bu bilgisayarda çalışıyor.
    - `DATABASE_URL` uygulamanın kendisi için, `sslmode=no-verify` ile.
    - `DIRECT_URL` Prisma CLI ve migration'lar için, `sslmode=require` ile.
  - **Güvenlik:** Supabase'de bütün tablolarda RLS açık ve hiç politika yok. Yani Supabase'in herkese açık REST API'si veri döndürmüyor; uygulama yalnızca Prisma üzerinden erişiyor.
  - Şema Prisma migration'larıyla kuruluyor; Supabase CLI gerekmiyor.
  - Vercel'de pooler adresleri kullanılacak (README).
- **Katalog önbelleği:** `"use cache"` + `cacheTag(CATALOG_TAG)`.
  - Admin işlemleri önbelleği kendisi tazeliyor.
  - Veritabanına betikle doğrudan yazılırsa değişiklik en geç bir saatte görünür; hemen görmek için dev sunucusunu yeniden başlat.
- **Fotoğraflar:** Vercel Blob için kod hazır. Blob anahtarı yokken yerelde `public/uploads` kullanılıyor (gitignore'da).
- **Video:** `public/videos/hakkimizda.mp4` (4,8 MB, 1280×720, 10 sn) ve kapak resmi `hakkimizda-kapak.jpg`. İkisi de git'te.
- **Yapay zeka:** OpenAI, varsayılan model `gpt-6-luna`.
  - Ürün analizi yaklaşık 3–7 sn sürüyor; fotoğraf başına maliyet yaklaşık 0,00015 $.
  - Adında "/" olan modeller OpenRouter üzerinden çağrılıyor (artık kullanılmıyor).
  - Hediş sohbeti de aynı anahtarı kullanıyor.
    - Sınır: IP başına 10 dakikada 30 istek, günde toplam 1500 (`HEDIS_DAILY_LIMIT`).
    - Kalıcı hata olursa (anahtar yok, bakiye bitti) sohbet uç noktası 503 dönüyor ve Hediş rehber moduna geçiyor.
- **Sipariş/teslimat metinleri tek yerde:** `src/lib/site.ts` → `ORDER_INFO`.
- **Önemli klasörler:**
  - `src/lib/ai/`: AI istemcisi, ürün analizi (`product-vision.ts`), öneri birleştirme.
  - `src/lib/hedis/`: sohbet, kural tabanlı öneri motoru (`recommend.ts`), sınıflandırma (`config.ts`), rehber metinleri.
  - `src/components/hedis/`:
    - `HedisDialog`: saydam tam ekran pencere ve yüzen düğme. Tıklanınca kapanmaması gereken yüzeyler `data-yuzey` ile işaretli.
    - `HedisChat`, `HedisRehber`, `HedisParts`.
  - `src/components/site/`:
    - Kabuk: `SiteShell`, `SiteHeader`, `NavLinks`, `CartLink`.
    - Sayfa parçaları: `HomeHero`, `ShopSection`, `OrderInfo`, `ProductGallery`, `AddToCart`, `AtolyeVideo`.
  - `src/app/(site)/`: vitrin. `src/app/admin/`: admin paneli. `e2e/`: uçtan uca testler.
- **Tasarım dili:**
  - Renkler: kraft kağıt, krem, kiremit, zeytin, hardal, gül.
  - Fontlar: Fraunces, Caveat, Karla.
  - Süsler: washi bant, delikli fiyat etiketi, el çizimi alt çizgi.

---

## 3. Konuşma geçmişi ve alınan kararlar

**İlk sürüm (önceki bilgisayar)**

1. `ProjeMimarisi.md`'deki plan aşama aşama uygulandı (Aşama 0–9):
   - Kurulum, veri modeli, ikas'tan aktarma, tasarım sistemi.
   - Mağaza, sepet + WhatsApp, admin.
   - Hediş (kural tabanlı), ziyaret istatistikleri, SEO ve erişilebilirlik.
   - Marka adı "hediyegetir". GitHub'a ilk push 403 verdi; `umitcan246` hesabı collaborator olarak eklenince çözüldü.
2. **WhatsApp:** 0505 043 47 96, `905050434796` olarak kayıtlı.
3. **Çerez kararı:** Onay bandı yok, yalnızca bilgilendirme sayfası var. Hukuki sorumluluk kullanıcıda.
4. **ikas kaldırıldı:** Senkron kodu silindi; yayına ilk geçiş için `npm run urun-aktar` betiği yazıldı.
5. **Hediş açılır pencereye taşındı.** Ana sayfa artık vitrin.
6. **Fotoğraftan yapay zeka önerisi:**
   - OpenRouter'ın ücretsiz modelleri yavaş ve hatalıydı.
   - OpenAI'da karşılaştırma yapıldı; **gpt-6-luna** seçildi (hızlı, ucuz, Türkçesi iyi).
   - Kural: yapay zeka yalnızca boş alanları doldurur.
7. **Büyük UI/AI turu:** Geniş düzen ve filtre alanı, admin ürün ekranı baştan, Hediş'in yapay zekayla konuşması.

**8 Ekim öğleden sonra: yeni bilgisayar, demo cilası, Supabase**

8. **Yeni bilgisayar:**
   - Proje zip olarak indirildi (`C:\DEVPACKS\hediyegetir.com-main`).
   - Bu bilgisayarda Docker ve WSL yok. "Docker kuralım" fikri, eksik bağımlılık olmadığı anlaşılınca bırakıldı.
9. **Ürünler ikas'tan son kez çekildi:** 7 ürün ve 9 fotoğraf alındı. Projede ikas'a bağ kalmadı.
10. **48 maddelik acımasız inceleme yapıldı.** Kullanıcı demo için önemli maddeleri seçti. Uygulananlar:
    - **Hediş:** Rehber modu (yapay zekasız), "Sepete git", sade düğmeler.
    - **Sepet:** Not ve hediye paketi, "Siparişi WhatsApp'tan gönder", "Sepeti boşalt".
    - **Ürün sayfası:** Sipariş bilgisi, kaydırmalı galeri, mobil yapışkan çubuk.
    - **Ürün verisi:** Adlar düzeltildi (ör. "Handmade Kol Çantası" → "Kapaklı Örgü Omuz Çantası"). Açıklamalar "sen" diliyle yazıldı. Kategori "Giyim" oldu.
    - **Yeni sayfalar:** "Nasıl sipariş verilir?", Hakkımızda, kategori sayfaları.
    - **Diğer:** Vitrin araması, 404'e header/footer, admin'de kaydedilmemiş değişiklik uyarısı.
11. **Supabase'e geçildi.** `npx prisma dev` eşzamanlı bağlantılarda kopup kilitlendiği için bırakıldı. Şema migration'larla kuruldu, ürünler `urun-aktar --blob-yok` ile taşındı.

**8 Ekim akşamı: testler, arayüz turu, teslim öncesi inceleme**

12. **Bütün testler baştan sona çalıştırıldı.** Bulunan ve düzeltilenler:
    - **Admin girişi bozuktu:** `.env`'deki bcrypt hash'inde `$` işaretleri kaçışsızdı (bkz. 6. bölüm).
    - **Yapışkan çubuk:** Ani kaydırmada açılmıyordu.
    - **Hediş düğmesi:** Footer'ın üstüne biniyordu.
    - **Kontrast:** Erişilebilirlik taramasında yetersiz çıkan yerler vardı.
13. **Arayüz turu (commit `c8582f7`):**
    - Admin Kategoriler sayfası kart görünümüne geçti.
    - Hediş ortalandı ve tatlılaştı: sallanan maskot, konuşma balonu, etiket biçimli seçenekler.
    - Kullanıcının isteğiyle Hediş **tamamen çerçevesiz ve saydam** yapıldı: kare panel yok, başlık ya da "Kapat" yazısı yok, dışarı tıklayınca kapanıyor.
    - Ana sayfaya yeni hero geldi (polaroid kolaj + maskot balonu).
    - Hakkımızda'ya atölye videosu yerleştirildi.
    - Footer'daki "Gezin" bağlantıları üstte hap biçimli bir **menü çubuğuna** da taşındı. Footer'dakiler şimdilik duruyor.
14. **Teslim öncesi inceleme:** Daha önce önerilmemiş 15 madde çıkarıldı. Kullanıcı 2, 3, 4, 6, 14 ve 15'i seçti; yapıldı (commit `3084c1b` + veritabanı):
    - **(2)** 7 ürünün Hediş etiketleri gözden geçirilip onaylandı:
      - Özel günler ve anahtar kelimeler eklendi.
      - Kıyafetlerden "iş arkadaşı" ve "öğretmen", elbise ile granny süveterden "büyükanne" çıkarıldı.
    - **(3)** Admin'deki teknik yazılar kaldırıldı ("yerel mod: public/uploads", anahtar uyarısı). Model alanı "Gelişmiş"e taşındı.
    - **(4)** Ürün sayfasında üç kez tekrar eden "renk tercihini sepette not olarak yaz" bilgisi teke indi.
    - **(6)** Bütün stoklar "sipariş üzerine" yapıldı.
    - **(14)** Admin mobil menüsü düzeltildi: "Çıkış" artık görünüyor, menü 320 px'e sığıyor.
    - **(15)** iPhone ana ekran ikonu eklendi.
    - **Seçilmeyen ya da sahibine bağlı maddeler:** Prod modda demo, indirimli fiyatlar, Instagram, WhatsApp numarasını doğrulama, telefondan gösterme, demo akışı, yeni admin şifresi, fotoğraf yedeği. 0. bölümde listelendi.
15. **Ziyaret istatistikleri sıfırlandı.** Testler sayacı 500'ün üstüne çıkarmıştı.
16. **OpenAI anahtarı:** Kullanıcı eski anahtarı `.env`'e kendisi ekledi; anahtar iptal edilmemiş, kullanılmaya devam ediyor. Hediş sohbeti ve admin'de fotoğraftan doldurma gerçek modelle denendi, çalışıyor.
17. **GitHub:** Her şey `demo-cilasi`'ye pushlandı, ardından `main`'e fast-forward ile birleştirildi (`3084c1b`).

**8 Ekim gecesi: bu bilgisayar (IPv6 yok)**

18. **Supabase bağlantısı:** Bu bilgisayarda IPv6 olmadığı için doğrudan adres çalışmıyor. `.env` pooler adreslerine geçirildi (`aws-1-eu-central-1.pooler.supabase.com`, uygulama 6543, CLI 5432).
19. **Ana sayfa:** Polaroid kolajın köşesindeki maskot ve "Kime hediye arıyorsun?" balonu kaldırıldı.
20. **Ürün ekranı baştan + yeni alanlar:** `Product.galleryLayout` (TEK/IKILI/UCLU) ve `Product.stampText` eklendi (migration `20261008190000_urun_galeri_damga`), aynı akşam çoklu damga için `Product.stamps` listesine çevrildi (`20261008210000_urun_coklu_damga`, eski değerler taşındı). İkisi de Supabase'e uygulandı. Mevcut ürünler TEK ve "El yapımı" ile aynı görünüyor.
21. **Admin oturumu:** `getAdminSession` jeton doğrulamadan önce `await connection()` çağırıyor; Next'in "prerender sırasında new Date()" uyarısı bu yüzden çıkıyordu.
22. **Hediş ve ürün sayfası turu:** Büyük "Sepete git", devam et / baştan başla, gereksiz katalog tekrarı yok; yeni fotoğraf görüntüleyici ve küçülen fotoğraf sütunu; admin ürün listesi kartlara geçti.
23. **Onay pencereleri:** Tarayıcının `confirm()` kutuları yerine sitenin tarzında tek pencere (`confirmDialog` + `ConfirmHost`, kök yerleşimde): sepeti boşalt, ürün/kategori sil, kaydedilmemiş değişiklik. Sekme kapatma/yenilemedeki uyarı tarayıcının kendisi, değiştirilemez.
24. **Genel mağaza dili:** Site artık yalnızca el işi değil, hazır ürün de satıyor. Genel metinlerde (ana sayfa başı, alt bilgi, kategori sayfaları, sipariş adımları, site başlığı, yapay zeka talimatları) el yapımı/örgü vurgusu kaldırıldı. El yapımı vurgusu yalnızca **damgalı** ürünlerde: ürün sayfasında "Senin için elde yapılır" satırı damga varsa çıkıyor. Yeni ürünler damgasız başlıyor (`20261008230000_damga_varsayilan_bos`). Hakkımızda'daki kurucu hikâyesi korundu, "her parça elde örülür" gibi iddialar düzeltildi.
25. **Sepet:** "Siparişi WhatsApp'tan gönder"e basınca sepet (not ve hediye paketi dahil) boşalıyor; yerine "Siparişin WhatsApp'ta hazır!" notu ve "Sepetini geri getir" bağlantısı çıkıyor.
26. **Fiyat filtresi:** Vitrindeki sabit "Bütçe" seçimi (3 aralık) yerine sade bir "Fiyat" düğmesi: küçük panelde "En az / En çok" kutuları (ipucu: kategorideki en düşük/yüksek fiyat), Uygula ve Temizle. Grafikli/kaydırıcılı sürüm denendi, kullanıcı abartılı buldu. Adres `?fiyat=500-1200` (TL; tek uç da olur); eski `?butce=` adresleri aralığa çevriliyor. Hediş'in rehber modundaki bütçe seçenekleri aynı kaldı.
27. **Hediş en fazla 2 soru:** İlk öneriden önce en fazla 2 soru (`MAX_QUESTIONS`). Talimatta yazıyor; ayrıca sunucu sayıyor (`mustRecommend`): sınır dolduysa modele "artık öner" uyarısı gidiyor, yine ürün seçmezse kural tabanlı motor öneriyor (kişi bilinmiyorsa "diğer"). Öneriden sonra serbest sohbet.
28. **Hediş alt düğmeleri:** "Sepete git (N)" (hardal) ve "Diğer ürünlere göz at" (zeytin) yan yana büyük düğmeler; "Baştan başla" altta küçük.
29. **Yayın kararı (9 Ekim):** Vercel'de, **alan adı şimdilik alınmıyor**; site `*.vercel.app` adresinde yayınlanacak. Adres yalnızca `NEXT_PUBLIC_SITE_URL`'den geliyor; kodda sabit "hediyegetir.com" metinleri marka adına ("hediyegetir") çevrildi, WhatsApp karşılama cümlesi de (`20261009090000_karsilama_alan_adsiz`). Fotoğrafları Blob'a taşımak için `npm run foto-blob` yazıldı (14 fotoğraf, ~1,5 MB).
30. **Vercel'e geçiş (9 Ekim):** Yayın reposu `umitcan246/hediyegetir` (yerelde `vercel` adlı uzak depo; `origin` Ertuğrul'un reposu, ikisine de gönderilmeli). Blob deposu **Public** olmalı (ilk açılan Private depo yükleme kabul etmedi, silindi). `npm run foto-blob` ile 14 fotoğrafın hepsi Blob'a taşındı; veritabanında `/uploads/` adresi kalmadı. Blob anahtarı yerel `.env`'de de var, yerelde yüklenen fotoğraflar da Blob'a gidiyor.
31. **Deneme ürünleri (9 Ekim):** Test için `npm run deneme-urunler` ile 14 ürün eklendi (Çanta 5, Giyim 5, Ayakkabı 4). Adresleri `deneme-` ile başlıyor, görselleri `npm run deneme-fotograf` ile yapay zekayla üretildi (gpt-image-1-mini, 24 görsel, Blob'da; ilk çekim önden, sonrakiler kullanımda / yakın çekim); el yapımı/hazır, indirimli, tükenmiş (Makrome Bel Çantası), stoklu ve sipariş üzerine karışık; Tek/İkili/Üçlü düzenler ve çoklu damga var. Gerçek ürünlerin altında kalsınlar diye oluşturulma tarihleri eski. **Yayından önce sil:** `npm run deneme-urunler -- --sil`.
32. **Hediş'in yeni görünümü (9 Ekim):** Kutu maskotu yerine elinde hediye kutusu tutan robot (kullanıcının getirdiği `animasyonvekarakter/` paketinden). Görseller `public/hedis/{idle,wink,thinking,celebrate}.webp` (512 px, ~30 KB). `Mascot.tsx` aynı props'la: normal/konuşurken gülümser ve 3,5–6,5 sn'de bir göz kırpar, düşünürken halka + tarama ışığı, öneri bulunca zıplama + kalpler; süzülme ve ışıma CSS'te (`globals.css` → `.hedis-robot*`). Karşılamadaki büyük robot `rich` modunda (demo sayfasındaki gibi): mor→beyaz→mavi parlak çerçeve, antende yanıp sönen turkuaz ışık, sağ altta durum rozeti (✨ / 😉 / dönen ⚙️ / 🎁), fareyle 3B eğilme. Ses ve canvas parçacıkları bilerek alınmadı. Robot her yerde: logo (üst ve alt bilgi), Hakkımızda, 404 (düşünen robot), sekme ikonu (`src/app/icon.png`, robotun yüzü) ve iPhone ikonu (`apple-icon.png`); eski kutu ikonu (`GiftIcon`, `icon.svg`) kaldırıldı. Sohbet başlayınca da robot büyük kalıyor. Robot mor/turkuaz; "mor-mavi yok" kuralının istisnası, kullanıcının kararı. Kaynak klasör git ve lint dışında.

---

## 4. Açık konular

1. **Sen/siz dili:** Yapay zeka açıklamaları "siz", site "sen" diliyle. Karar bekleniyor (0. bölüm).
2. **Fotoğraflar:** Yedeksiz ve yalnızca bu bilgisayarda. Yayından önce Blob ya da Supabase Storage'a taşınmalı.
3. **Yayına alma (Aşama 10):**
   - Vercel hesabı (repoyu bağla + Blob deposu).
   - Supabase pooler adresleri: `DATABASE_URL` = Transaction pooler (6543), `DIRECT_URL` = Session pooler (5432).
   - Ortam değişkenleri: `OPENAI_API_KEY`, `HEDIS_DAILY_LIMIT` (isteğe bağlı).
   - Yayında farklı bir admin şifresi; hediyegetir.com DNS erişimi.
   - Adımlar README'de.
4. **Site sahibinden alınacaklar:** KVKK işletme bilgileri, kargo ücreti, ödeme ve iade koşulları, Instagram, indirimli fiyatlar hakkında karar. Metinleri bir hukukçuya da göstermek iyi olur; özellikle yapay zeka, yurt dışı aktarım ve mesafeli satış kısımlarını.
5. **Supabase veritabanı şifresi:** Sohbette paylaşıldı. Yenilenmesi önerildi, karar kullanıcıda.
6. **Küçük şeyler:**
   - 320 px'lik çok dar telefonlarda ürün sayfasında süs bandı yüzünden 2–3 px yatay taşma var.
   - Footer'daki "Gezin" bağlantıları üst menüyle tekrar ediyor; kaldırılabilir.
   - Hakkımızda videosu mobil veri için biraz ağır (4,8 MB). Yalnızca oynatılınca iniyor; istenirse sıkıştırılmış bir sürüm yapılabilir.

---

## 5. Commit geçmişi

| Commit      | Ne yapıldı                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `cd5005e` | Aşama 0: kurulum (Next.js 16, Tailwind v4, Prisma 7, Docker Postgres)                            |
| `657f585` | Aşama 1: veri modeli, Hediş sınıflandırması, seed                                           |
| `02c7999` | Aşama 2: ikas içe aktarma (sonradan kaldırıldı)                                              |
| `12d0f24` | Aşama 3: tasarım sistemi ve ortak bileşenler                                                   |
| `20b2bb3` | Aşama 4: mağaza ve ürün detay                                                                 |
| `38a9599` | Sepet depolama hatası düzeltmesi                                                                |
| `dcf38ef` | Aşama 5: sepet ve WhatsApp                                                                       |
| `32e740d` | Aşama 6: admin paneli                                                                            |
| `5080893` | Aşama 7: Hediş (kural tabanlı ilk sürüm)                                                     |
| `44e03c1` | Aşama 8: ziyaret kaydı ve admin özeti                                                          |
| `6058f9d` | Aşama 9: SEO, erişilebilirlik, hata sayfaları                                                  |
| `5f3ccf2` | Yayına alma hazırlığı                                                                        |
| `444a22e` | ikas kaldırıldı, ürün aktarma betiği                                                        |
| `20a892f` | Hediş açılır pencere, ana sayfa = mağaza                                                     |
| `1003bfa` | Admin'de fotoğraftan AI önerisi                                                                 |
| `853304f` | Varsayılan model OpenAI gpt-6-luna                                                               |
| `5e76d49` | Geniş düzen ve yeni filtre alanı                                                               |
| `b770cbe` | Admin ürün ekranı baştan, AI destekli                                                         |
| `66a5233` | Hediş yapay zekayla konuşuyor                                                                   |
| `9eadbe4` | KVKK'ya Hediş/OpenAI bilgisi + bu özet                                                          |
| `fdb6678` | Demo cilası: Hediş rehber modu, arama, kategori sayfaları, sepet notu, yeni sayfalar, Supabase |
| `c8582f7` | Arayüz: üst menü çubuğu, yeni ana sayfa başı, çerçevesiz Hediş, Hakkımızda videosu    |
| `3084c1b` | Teslim öncesi admin cilası ve iPhone ikonu (`main`'in şu anki hâli)                         |

Veritabanında yapılan değişikliklerin (etiket onayı, stok, açıklamalar, ziyaret sıfırlama) commit karşılığı yok. Bunlar doğrudan Supabase'te yapıldı.

---

## 6. Yerelde çalıştırma, testler ve tuzaklar

```bash
npm install
npm run dev          # http://localhost:3000  ·  admin: /admin  (veritabanı: Supabase, .env'de)
npm test             # 91 birim testi (vitest)
npm run typecheck
npm run lint
```

**Gerekli dosyalar** bu bilgisayarda duruyor, git'e girmiyor:

- `.env`: Supabase adresleri, admin şifre hash'i, OpenAI anahtarı.
- `public/uploads`: ürün fotoğrafları.

Başka bir bilgisayarda devam edeceksen bu ikisini de taşıman gerekir.

**Uçtan uca testler (Playwright, 51 test: masaüstü + mobil + admin):**

- Son durum: 50 geçti, 1'i bilerek atlanıyor.
  - Sepet testi aynı anda çok sayfa derlenirken ara sıra zaman aşımına düşüyor; tek başına çalıştırınca geçiyor.
- **Yapay zeka testleri** modeli taklit ediyor, ama dev sunucusunda bir `OPENAI_API_KEY` tanımlı olmalı. Gerçek anahtar artık `.env`'de; yoksa sahte bir değerle başlat: `OPENAI_API_KEY=sahte npm run dev`.
- **Admin testleri:**
  - Şifre ister: `E2E_ADMIN_PASSWORD=... npx playwright test`.
  - Yalnızca admin testlerini çalıştırmak için: `--project=admin --no-deps`. Normalde vitrin testleri bitmeden admin testleri başlamıyor.
- **Testlerin yan etkileri:**
  - Ziyaret sayacını şişiriyorlar; demodan önce sıfırla.
  - `public/uploads`'a 200 bayttan küçük deneme PNG'leri bırakıyorlar; testten sonra sil.
  - Ayarlar'daki WhatsApp numarasını yeniden yazıyorlar.
  - Geçici ürünleri kendileri siliyorlar.

**Bu bilgisayardaki tuzaklar (Windows + Git Bash):**

- **`.env`'deki bcrypt hash'i** `$` işaretlerini `\$` olarak kaçışlı tutmalı. Yoksa Next'in env okuyucusu `$2b...` kısımlarını değişken sanıp bozuyor ve admin girişi çalışmıyor.
- **Git Bash yolları:** `/` ile başlayan argümanları Windows yoluna çeviriyor (ör. `/videos/...`). Gerekirse komutun başına `MSYS_NO_PATHCONV=1` ekle.
- **Takılı dev sunucusu:** "Another next dev server is already running" hatası çıkarsa, komut satırında `hediyegetir.com-main\node_modules` ve `next` geçen eski süreçleri kapat.
- **Şema değişikliği:** Prisma şeması değiştikten sonra dev sunucusunu yeniden başlat; eski veritabanı istemcisi bellekte kalıyor.
- **`globals.css` değişikliği:** Dev sunucusu bu dosyadaki değişiklikleri canlı almıyor (Turbopack + Tailwind yükleyicisi); eski CSS'i sunmaya devam ediyor. CSS değiştirince dev sunucusunu yeniden başlat. Üretim derlemesinde sorun yok.
- **npm gürültüsü:** `npm install` bazen `package-lock.json`'da yalnızca npm sürümünden kaynaklanan değişiklik bırakıyor. Gerçek bir paket değişikliği yoksa `git checkout package-lock.json` ile geri al.
