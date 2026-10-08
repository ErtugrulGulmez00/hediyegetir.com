-- Alan adı (hediyegetir.com) henüz yok: WhatsApp karşılama cümlesinde marka adı kullanılır.
-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "whatsappGreeting" SET DEFAULT 'Merhaba! hediyegetir üzerinden şu ürünlerle ilgileniyorum:';

-- Admin'den değiştirilmemişse (eski varsayılan duruyorsa) mevcut ayarı da güncelle
UPDATE "Settings" SET "whatsappGreeting" = 'Merhaba! hediyegetir üzerinden şu ürünlerle ilgileniyorum:'
WHERE "whatsappGreeting" = 'Merhaba! hediyegetir.com üzerinden şu ürünlerle ilgileniyorum:';
