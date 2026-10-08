-- CreateEnum
CREATE TYPE "GalleryLayout" AS ENUM ('TEK', 'IKILI', 'UCLU');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "galleryLayout" "GalleryLayout" NOT NULL DEFAULT 'TEK',
ADD COLUMN     "stampText" TEXT NOT NULL DEFAULT 'El yapımı';

