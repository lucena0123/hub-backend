-- Add prompt_id/prompt_version to AI-related tables
ALTER TABLE "creative_copy_insights"
  ADD COLUMN IF NOT EXISTS "prompt_id" TEXT;

ALTER TABLE "ai_copy_suggestions"
  ADD COLUMN IF NOT EXISTS "prompt_id" TEXT;

ALTER TABLE "weekly_summaries"
  ADD COLUMN IF NOT EXISTS "prompt_id" TEXT,
  ADD COLUMN IF NOT EXISTS "prompt_version" TEXT;
