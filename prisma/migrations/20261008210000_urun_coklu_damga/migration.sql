-- Tek damga yazısı (stampText) yerine damga listesi (stamps); mevcut damgalar taşınır
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stamps" TEXT[] DEFAULT ARRAY['El yapımı']::TEXT[];

-- Mevcut değeri taşı: boş damga = boş liste
UPDATE "Product" SET "stamps" = CASE WHEN "stampText" = '' THEN ARRAY[]::TEXT[] ELSE ARRAY["stampText"] END;

ALTER TABLE "Product" DROP COLUMN "stampText";
