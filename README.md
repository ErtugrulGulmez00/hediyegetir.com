# hediyegetir.com

El yapımı hediyelik ürünler için mağaza sitesi. Ana sayfa ürün vitrinidir; ziyaretçiye açılan **Hediş** penceresi yapay zekayla sohbet ederek (serbest metin + hızlı seçenekler, kişiye özel sorular) katalogdan hediye seçer ve nedenini söyler. Sepet WhatsApp üzerinden mağazaya iletilir. Online ödeme yoktur. Ürünler admin panelinden yönetilir.

Mimari ve aşama planı: [ProjeMimarisi.md](ProjeMimarisi.md)

## Yığın

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · Prisma 7 + PostgreSQL (yerelde Docker ya da `prisma dev`, yayında Supabase) · Vercel Blob · Zustand · zod · motion · vitest · Playwright

## Yerelde çalıştırma

```bash
npm install
cp .env.example .env          # sonra AUTH_SECRET, VISITOR_SALT, ADMIN_PASSWORD_HASH doldur
npm run db:up                 # Postgres'i Docker'da 5433 portunda başlatır
npm run db:migrate            # şemayı uygular
npm run db:seed               # ayarlar satırı (örnek ürünler için: npx prisma db seed -- --demo)
npm run dev
```

Docker yoksa: `npx prisma dev --name hediyegetir --detach` yerel bir Postgres başlatır. Yazdırdığı `postgres://…` adresini `.env`'deki `DATABASE_URL` ve `DIRECT_URL`'e yaz, `DATABASE_POOL_MAX="1"` ekle (bu yerel sunucu aynı anda çok bağlantıda bağlantı düşürebiliyor), sonra `npx prisma migrate deploy` ile devam et. Bilgisayar yeniden başlayınca: `npx prisma dev start hediyegetir`.

Admin paneli: http://localhost:3000/admin

Hediş, yapay zeka anahtarı (`OPENAI_API_KEY` / `OPENROUTER_API_KEY`) yokken ya da bakiye bitince seçenekli rehber moda geçer: kime → bütçe → ilgi alanları sorulur, kural tabanlı motor öneri yapar.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm test` | Birim testleri (vitest) |
| `npm run test:e2e` | Uçtan uca testler (Playwright; admin testleri için `E2E_ADMIN_PASSWORD` gerekir). Hediş sohbet testleri yapay zekayı taklit eder ama dev sunucusunda bir `OPENAI_API_KEY` tanımlı olmalı (sahte bir değer yeter); yoksa Hediş rehber modunda açılır |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run db:studio` | Prisma Studio ile veritabanına göz at |
| `npm run foto-blob` | `public/uploads`'taki ürün fotoğraflarını Vercel Blob'a yükler, adresleri günceller (yayına ilk geçişte bir kez) |
| `npm run urun-aktar` | Yerel ürünleri/kategorileri/ayarları başka bir veritabanına taşır, fotoğrafları Blob'a yükler (yayına ilk geçişte bir kez) |
| `npm run hash-password -- "şifre"` | Admin şifresi için bcrypt hash üretir |

## Yayına alma (Vercel + Supabase + Blob)

1. **Supabase:** Proje aç (bölge: Frankfurt `eu-central-1`). Proje sayfasında **Connect → ORMs → Prisma** sekmesindeki iki adresi al:
   *Transaction pooler* (port `6543`) → `DATABASE_URL`, *Session pooler* (port `5432`, `pooler.supabase.com`) → `DIRECT_URL`.
   Doğrudan bağlantı adresi (`db.<proje>.supabase.co`) yalnızca IPv6 destekler; Vercel'de çalışmaz, kullanma.
   Supabase CLI (`supabase init/link`) gerekmez: şemayı Prisma migration'ları kurar.
2. **Vercel:** GitHub reposunu içe aktar (Framework: Next.js; ayar değiştirmeye gerek yok, `vercel-build` migration'ları kendisi çalıştırır).
3. **Vercel Blob:** Projede *Storage → Create → Blob*. `BLOB_READ_WRITE_TOKEN` otomatik eklenir.
4. **Ortam değişkenleri** (Vercel → Settings → Environment Variables, *Production*):

   | Değişken | Değer |
   | --- | --- |
   | `DATABASE_URL` | Supabase *Transaction pooler* adresi (6543) |
   | `DIRECT_URL` | Supabase *Session pooler* adresi (5432) |
   | `NEXT_PUBLIC_SITE_URL` | Vercel'in verdiği adres, ör. `https://hediyegetir.vercel.app` (alan adı alınınca `https://hediyegetir.com`) |
   | `WHATSAPP_NUMBER_FALLBACK` | `905050434796` |
   | `ADMIN_USERNAME` | admin kullanıcı adı |
   | `ADMIN_PASSWORD_HASH` | `npm run hash-password -- "şifre"` çıktısındaki ilk satır (Vercel'de `$` kaçışı **gerekmez**) |
   | `AUTH_SECRET` | 32+ karakter rastgele dize |
   | `VISITOR_SALT` | rastgele dize |
   | `OPENAI_API_KEY` | (isteğe bağlı) admin'de fotoğraftan ad/kategori/Hediş etiketi önerisi; varsayılan model `gpt-6-luna`, *Ayarlar*'dan değiştirilebilir |
   | `OPENROUTER_API_KEY` | (isteğe bağlı) Ayarlar'da adında `/` olan bir model seçilirse kullanılır |
   | `HEDIS_DAILY_LIMIT` | (isteğe bağlı) Hediş sohbeti için günlük toplam istek sınırı, varsayılan 1500 (bakiyeyi korur) |

5. **Deploy** et. İlk deploy migration'ları uygular.
6. **Fotoğrafları Blob'a taşı (bir kez):** Veritabanı zaten Supabase'de; yalnızca `public/uploads`'taki fotoğraflar (git'e girmez, yayında yoktur) Blob'a yüklenir ve adresleri güncellenir. Vercel → *Storage → Blob* sayfasındaki `BLOB_READ_WRITE_TOKEN`'ı yerel `.env`'e de yaz, sonra:
   ```powershell
   npm run foto-blob -- --dene   # önce neyin yükleneceğini gör
   npm run foto-blob
   ```
   Tekrar çalıştırılabilir; yalnızca adresi hâlâ `/uploads/` olan fotoğrafları işler. (Ayrı bir yerel veritabanından taşıma gerekirse: `npm run urun-aktar`.)
7. **Alan adı (şimdilik yok, sonra):** Vercel → *Domains* → `hediyegetir.com` ve `www.hediyegetir.com` ekle; alan adı sağlayıcısında Vercel'in gösterdiği A / CNAME kayıtlarını gir.
8. **KVKK:** `src/app/(site)/kvkk/page.tsx` içindeki `[İŞLETME ADI]`, `[ADRES]`, `[E-POSTA]`, `[TARİH]` yer tutucularını doldur.

### Yayın sonrası kontrol listesi

- [ ] Ana sayfaya ilk girişte Hediş penceresi açılıyor, akış baştan sona çalışıyor, 5 (veya daha az, dürüst mesajlı) öneri geliyor
- [ ] Ürün fotoğrafları `*.public.blob.vercel-storage.com` adresinden yükleniyor
- [ ] Sepet → *Siparişi WhatsApp'tan gönder* doğru numarayı, ürün linklerini (`https://hediyegetir.com/urun/...`) ve (eklendiyse) hediye paketi/notu içeriyor
- [ ] `/kategori/...`, `/nasil-siparis-verilir` ve `/hakkimizda` sayfaları açılıyor; vitrin araması çalışıyor
- [ ] Admin panelinden ürün fiyatı değişince sitede hemen görünüyor
- [ ] Admin'den fotoğraf yükleme çalışıyor
- [ ] Özet sayfasında (başka bir cihazdan girince) ziyaretler artıyor
- [ ] `https://hediyegetir.com/sitemap.xml` ve `/robots.txt` doğru alan adını gösteriyor
