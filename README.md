# hediyegetir.com

El yapımı hediyelik ürünler için mağaza sitesi. Ziyaretçi **Hediş** asistanıyla birkaç soruya cevap verir, 5 hediye önerisi alır; sepetini WhatsApp üzerinden mağazaya iletir. Online ödeme yoktur.

Mimari ve aşama planı: [ProjeMimarisi.md](ProjeMimarisi.md)

## Yığın

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · Prisma 7 + PostgreSQL (yerelde Docker, yayında Neon) · Vercel Blob · Zustand · zod · motion · vitest · Playwright

## Yerelde çalıştırma

```bash
npm install
cp .env.example .env          # sonra AUTH_SECRET, VISITOR_SALT, ADMIN_PASSWORD_HASH doldur
npm run db:up                 # Postgres'i Docker'da 5433 portunda başlatır
npm run db:migrate            # şemayı uygular
npm run db:seed               # ayarlar satırı (örnek ürünler için: npm run db:seed -- --demo)
npm run dev
```

Admin paneli: http://localhost:3000/admin

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm test` | Birim testleri (vitest) |
| `npm run test:e2e` | Uçtan uca testler (Playwright; admin testleri için `E2E_ADMIN_PASSWORD` gerekir) |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run db:studio` | Prisma Studio ile veritabanına göz at |
| `npm run urun-aktar` | Yerel ürünleri/kategorileri/ayarları başka bir veritabanına taşır, fotoğrafları Blob'a yükler (yayına ilk geçişte bir kez) |
| `npm run hash-password -- "şifre"` | Admin şifresi için bcrypt hash üretir |

## Yayına alma (Vercel + Neon + Blob)

1. **Neon:** Yeni proje aç (bölge: Frankfurt `eu-central-1`). *Connection string* ekranından iki adres al:
   havuzlu (`-pooler` içeren) → `DATABASE_URL`, havuzsuz → `DIRECT_URL`.
2. **Vercel:** GitHub reposunu içe aktar (Framework: Next.js; ayar değiştirmeye gerek yok, `vercel-build` migration'ları kendisi çalıştırır).
3. **Vercel Blob:** Projede *Storage → Create → Blob*. `BLOB_READ_WRITE_TOKEN` otomatik eklenir.
4. **Ortam değişkenleri** (Vercel → Settings → Environment Variables, *Production*):

   | Değişken | Değer |
   | --- | --- |
   | `DATABASE_URL` | Neon havuzlu adres |
   | `DIRECT_URL` | Neon havuzsuz adres |
   | `NEXT_PUBLIC_SITE_URL` | `https://hediyegetir.com` |
   | `WHATSAPP_NUMBER_FALLBACK` | `905050434796` |
   | `ADMIN_USERNAME` | admin kullanıcı adı |
   | `ADMIN_PASSWORD_HASH` | `npm run hash-password -- "şifre"` çıktısındaki ilk satır (Vercel'de `$` kaçışı **gerekmez**) |
   | `AUTH_SECRET` | 32+ karakter rastgele dize |
   | `VISITOR_SALT` | rastgele dize |

5. **Deploy** et. İlk deploy migration'ları uygular.
6. **Ürünleri taşı (bir kez):** Yerel veritabanındaki ürünler, kategoriler ve ayarlar yayına bu bilgisayardan taşınır; fotoğraflar Blob'a yüklenir.
   ```powershell
   $env:KAYNAK_DATABASE_URL="postgresql://hediye:hediye@localhost:5433/hediyegetir"
   $env:HEDEF_DATABASE_URL="<Neon havuzsuz adres>"
   $env:BLOB_READ_WRITE_TOKEN="<Vercel Blob anahtarı>"
   npm run urun-aktar -- --dene   # önce neyin taşınacağını gör
   npm run urun-aktar
   ```
   Sonra Vercel'de yeniden deploy et. `/admin` → *Ürünler* → "Etiketi onaysız" filtresiyle Hediş etiketlerini kontrol et.
7. **Alan adı:** Vercel → *Domains* → `hediyegetir.com` ve `www.hediyegetir.com` ekle; alan adı sağlayıcısında Vercel'in gösterdiği A / CNAME kayıtlarını gir.
8. **KVKK:** `src/app/(site)/kvkk/page.tsx` içindeki `[İŞLETME ADI]`, `[ADRES]`, `[E-POSTA]`, `[TARİH]` yer tutucularını doldur.

### Yayın sonrası kontrol listesi

- [ ] Ana sayfada Hediş akışı baştan sona çalışıyor, 5 (veya daha az, dürüst mesajlı) öneri geliyor
- [ ] Ürün fotoğrafları `*.public.blob.vercel-storage.com` adresinden yükleniyor
- [ ] Sepet → *WhatsApp ile bilgi al* doğru numarayı ve ürün linklerini (`https://hediyegetir.com/urun/...`) içeriyor
- [ ] Admin panelinden ürün fiyatı değişince sitede hemen görünüyor
- [ ] Admin'den fotoğraf yükleme çalışıyor
- [ ] Özet sayfasında (başka bir cihazdan girince) ziyaretler artıyor
- [ ] `https://hediyegetir.com/sitemap.xml` ve `/robots.txt` doğru alan adını gösteriyor
