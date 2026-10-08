-- CreateTable
CREATE TABLE "AiRequest" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiRequest_kind_key_createdAt_idx" ON "AiRequest"("kind", "key", "createdAt");

-- CreateIndex
CREATE INDEX "AiRequest_kind_createdAt_idx" ON "AiRequest"("kind", "createdAt");

