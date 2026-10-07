-- Varsayılan yapay zeka modeli: OpenAI gpt-6-luna (hızlı ve ucuz)
ALTER TABLE "Settings" ALTER COLUMN "aiModel" SET DEFAULT 'gpt-6-luna';

-- Eski varsayılanı (yavaş ücretsiz OpenRouter modeli) kullanan ayarları yeni varsayılana taşı
UPDATE "Settings" SET "aiModel" = 'gpt-6-luna' WHERE "aiModel" = 'dots-studio/dots-3-note-preview:free';
