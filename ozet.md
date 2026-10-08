# hediyegetir.com — Proje özeti ve konuşma geçmişi

Bu dosya, siteyi geliştirirken yaptığımız konuşmanın ve alınan kararların özetidir. Bir sonraki çalışma oturumunda kaldığımız yerden devam etmek için yazıldı.

- **Repo:** https://github.com/ErtugrulGulmez00/hediyegetir.com (`main` dalı)
- **Plan dosyası:** [ProjeMimarisi.md](ProjeMimarisi.md)
- **Kurulum ve yayına alma:** [README.md](README.md)
- **Son güncelleme:** 8 Ekim 2026

---

## 1. Şu an site ne yapıyor?

**Ziyaretçi tarafı**
- **Ana sayfa = ürün vitrini.**
  - Yatay kaydırılan kategori çipleri, aramalı "Tüm kategoriler" penceresi (20+ kategoride de sıkışmıyor), kompakt bütçe ve sıralama seçicileri.
  - Masaüstünde geniş düzen: 1440 px'te neredeyse tam genişlik, 1920 px'te 1600 px.
  - Eski `/magaza` adresi filtreleriyle birlikte ana sayfaya yönleniyor.
- **Hediş, yapay zekalı hediye asistanı.**
  - Ana sayfaya gelen ziyaretçiye oturum başına bir kez açılır pencere olarak çıkıyor. Üst menüden, sağ alttaki maskot düğmesinden ve alt bilgiden yeniden açılabiliyor.
  - Ziyaretçi ya bir çipe dokunuyor (Anne, Baba, Sevgili…) ya da serbest yazıyor ("Yeni işe başlayan kız arkadaşıma…").
  - Her turda yapay zeka kişiye özel tek bir soru ve tıklanabilir hazır cevaplar üretiyor. Yeterince bilgi toplayınca katalogdan ürün seçiyor ve her ürün için "neden" cümlesi yazıyor.
  - Önerilen ürünler sepete eklenebiliyor.
- **Ürün sayfası:** Galeri, fiyat (üstü çizili eski fiyat), adet, sepete ekle, "WhatsApp'tan sor", AI'ın çıkardığı "Öne çıkanlar" ve "Şu günler için güzel bir hediye", benzer ürünler, JSON-LD.
- **Sepet → WhatsApp.** Online ödeme yok. Sepet, 905050434796 numarasına ürün listesi, linkler ve ara toplamla hazır bir mesaj olarak gönderiliyor.
- **Diğer sayfalar:** KVKK/çerez sayfası (işletme bilgileri yer tutucu, Hediş/OpenAI bilgisi dahil), 404, hata sayfaları, sitemap, robots.

**Admin paneli (`/admin`)**
- **Giriş:** Tek admin, şifre bcrypt ile saklanıyor, oturum JWT çerezinde. Hatalı giriş denemeleri sınırlı.
- **Özet:** Ziyaret kutuları (bugün / 7 / 30 gün), 30 günlük grafik, etiketi onaylanmamış ürün uyarısı.
- **Ürün ekleme/düzenleme ekranı (baştan tasarlandı):**
  - En üstte sürükle-bırak çoklu fotoğraf yükleme: anında önizleme, paralel yükleme ve ilerleme çubuğu, sıralama, silme. Kapak fotoğrafı büyük gösteriliyor.
  - Fotoğraf yüklenince ya da ürün adı yazılınca AI ürün asistanı kendiliğinden çalışıyor. Önerdikleri: ad, açıklama, ürün özellikleri, kategori, kime uygun, cinsiyet, ilgi alanları, özel günler, etiketler, her fotoğraf için açıklama.
  - Yalnızca boş alanları dolduruyor; admin'in yazdıklarına dokunmuyor. Doldurduğu alanlar "AI" rozetiyle işaretleniyor.
  - Analiz sırasında sitenin renklerinde dönen gradyan kenarlık ve adım adım analiz göstergesi var.
  - Eşleşmeyen kategoride "Kategoriyi oluştur / Vazgeç" önerisi çıkıyor. Admin kendi açıklamasını yazdıysa geliştirilmiş açıklama önerisi geliyor.
- **Ürün listesi:** Arama, filtreler, hızlı yayın aç/kapa, "AI ile eksikleri doldur" (toplu zenginleştirme).
- **Kategoriler:** Ekleme, düzenleme, silme.
- **Ayarlar:** WhatsApp numarası, mesajın ilk cümlesi, Instagram, yapay zeka modeli.

**Kalite**
- 80 birim testi (vitest).
- 39 uçtan uca test (Playwright): masaüstü + mobil, erişilebilirlik (axe) taraması, admin akışları. Testler yapay zekayı taklit ediyor, bakiye harcamıyor.
- Production build başarılı.

---

## 2. Teknik yapı (kısaca)

- **Çatı:** Next.js 16 (App Router, Cache Components, `proxy.ts`), TypeScript, Tailwind v4.
- **Veritabanı:** Prisma 7 + PostgreSQL. Yerelde Docker'da **5433** portu (makinede 5432'yi başka bir Postgres kullanıyor), yayında Neon olacak.
- **Fotoğraflar:** Vercel Blob. Anahtar yokken yerelde `public/uploads` kullanılıyor.
- **Yapay zeka:** OpenAI, varsayılan model `gpt-6-luna`.
  - Ürün analizi yaklaşık 3–5 sn, ürün başına yaklaşık 0,00015 $.
  - Hediş sohbeti tur başına yaklaşık 3 sn.
  - Model Ayarlar'dan değiştirilebilir. Adında "/" olan modeller OpenRouter üzerinden çağrılıyor.
- **Önemli klasörler:**
  - `src/lib/ai/`: AI istemcisi, ürün analizi, öneri birleştirme.
  - `src/lib/hedis/`: Hediş sohbeti, kural tabanlı yedek öneri motoru, sınıflandırma (kişiler, hobiler, özel günler, bütçe).
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
11. **Büyük UI/UX ve AI isteği (son istek):**
    - **A.** Geniş sayfa düzeni ve ölçeklenebilir filtre alanı.
    - **B.** Admin ürün ekranı baştan; AI analizi, animasyon, kategori önerisi, toplu zenginleştirme.
    - **C.** Hediş'in AI ile konuşması.
    - Tek tek gerçek modelle denendi ve test edildi.
12. **Son talimat:** "Soru sorma, emin olmadıklarını sonraki mesaja bırak, bitince her şeyi ve bu özet dosyasını pushla."

---

## 4. Açık konular (sonraki mesajda konuşulacak)

Bunları sana sormadan karar vermemek için bekletiyorum:

1. **Anahtarları yenile (güvenlik, acil):** OpenAI (`sk-proj-…`) ve OpenRouter (`sk-or-…`) anahtarları sohbette açıkça paylaşıldı.
   - İkisini de panellerden iptal edip yenilerini oluştur ve `.env`'ye sen yaz. Anahtarlar git'e hiç girmedi, yalnızca yerel `.env`'de duruyor.
   - OpenAI projesine aylık harcama limiti koy.
   - OpenRouter artık kullanılmıyor; istersen silebilirsin.
2. **Yayına alma (Aşama 10):** Gerekenler:
   - Vercel hesabı (repoyu bağla + Blob deposu)
   - Neon veritabanı (Frankfurt; havuzlu ve havuzsuz iki adres)
   - Yayında kullanılacak admin şifresi
   - hediyegetir.com DNS erişimi
   - Ortam değişkenleri: `OPENAI_API_KEY`, `HEDIS_DAILY_LIMIT` (isteğe bağlı)

   Adımlar README'de. Ürünler yayına `npm run urun-aktar` ile bir kez taşınacak.
3. **Fotoğrafların yedeği:** ikas'tan indirilen ve admin'den yüklenen fotoğraflar şu an yalnızca bu bilgisayarda (`public/uploads`, git'e eklenmiyor). Yayına geçene kadar bu bilgisayar giderse fotoğraflar da gider. İstersen GitHub'a eklenebilir (yaklaşık 1,2 MB).
4. **KVKK bilgileri:** İşletme adı, adres ve e-posta, `src/app/(site)/kvkk/page.tsx` içindeki yer tutuculara yazılacak. Metni bir hukukçuya da göstermeni öneririm; özellikle yapay zeka ve yurt dışı aktarım kısımlarını.
5. **Hediş penceresinin sıklığı:** Şu an her tarayıcı oturumunda bir kez açılıyor. Yalnızca ilk ziyarette ya da her ana sayfa açılışında açılması tek satırlık değişiklik.
6. **Katalog gerçeği:**
   - Ürünlerin neredeyse hepsi kadın ürünü. Erkeklere uygun tek ürün olan "Saat"in stoğu 0, bu yüzden Hediş babaya ya da erkek arkadaşa "uygun ürün yok" diyor. Davranış doğru, ama erkek ürünü eklemek ya da saatin stoğunu açmak gerekebilir.
   - AI bazı etiketleri fotoğraftan tahminle koydu; örneğin saate "su geçirmez". Admin'de "Etiketi onaysız" filtresiyle gözden geçirilmeli.
7. **Hediş maliyeti:** Herkese açık sohbet, tur başına küçük de olsa bakiye harcıyor. Koruma olarak IP başına 10 dakikada 30 istek ve günde toplam 1500 istek sınırı var (`HEDIS_DAILY_LIMIT`). Yayında gerçek kullanımı izleyip limiti birlikte ayarlayalım.
8. **Admin şifresi:** Yerel geliştirme şifresi yalnızca bu bilgisayardaki `.env`'de duruyor ve sohbette sana iletildi; bu dosyaya bilerek yazılmadı. Yayında farklı bir şifre kullanılmalı.

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
| (son) | KVKK'ya Hediş/OpenAI bilgisi + bu özet |

---

## 6. Yerelde çalıştırma (hatırlatma)

```bash
npm install
npm run db:up        # Docker'da Postgres (5433)
npm run db:migrate
npm run dev          # http://localhost:3000  ·  admin: /admin
npm test             # birim testleri
npm run test:e2e     # uçtan uca (admin testleri için E2E_ADMIN_PASSWORD gerekir)
```

Not: Prisma şeması değiştikten sonra çalışan dev sunucusunu yeniden başlatmak gerekir; eski veritabanı istemcisi bellekte kalıyor.
