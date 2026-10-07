# hediyegetir.com

El yapımı hediyelik ürünler için mağaza sitesi. Ziyaretçi **Hediş** asistanıyla birkaç soruya cevap verir, 5 hediye önerisi alır; sepetini WhatsApp üzerinden mağazaya iletir. Online ödeme yoktur.

Mimari ve aşama planı: [ProjeMimarisi.md](ProjeMimarisi.md)

## Yığın

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · Prisma 7 + PostgreSQL (yerelde Docker, yayında Neon) · Vercel Blob · Zustand · zod · motion · vitest

## Yerelde çalıştırma

```bash
npm install
cp .env.example .env          # sonra AUTH_SECRET, VISITOR_SALT, ADMIN_PASSWORD_HASH doldur
npm run db:up                 # Postgres'i Docker'da 5433 portunda başlatır
npm run db:migrate            # şemayı uygular
npm run db:seed               # örnek kategori/ürün ve ayarlar
npm run dev
```

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm test` | Birim testleri (vitest) |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run db:studio` | Prisma Studio ile veritabanına göz at |
| `npm run ikas:sync` | ikas mağazasından ürünleri içe aktarır |
| `npm run hash-password -- "şifre"` | Admin şifresi için bcrypt hash üretir |
