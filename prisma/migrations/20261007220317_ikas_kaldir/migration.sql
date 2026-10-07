-- DropIndex
DROP INDEX "Product_ikasId_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "ikasId",
DROP COLUMN "ikasUrl",
DROP COLUMN "lockedFields",
DROP COLUMN "source";

-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "ikasImageId";

-- DropTable
DROP TABLE "IkasSyncLog";

-- DropEnum
DROP TYPE "ProductSource";

