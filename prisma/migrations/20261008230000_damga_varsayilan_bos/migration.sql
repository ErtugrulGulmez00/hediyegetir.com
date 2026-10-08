-- Yeni ürünler damgasız başlar (damga yalnızca el yapımı ürünlerde); mevcut ürünler değişmez
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "stamps" SET DEFAULT ARRAY[]::TEXT[];
