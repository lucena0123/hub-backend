ALTER TABLE "ad_creative_snapshots"
  ADD COLUMN IF NOT EXISTS "visual_attributes" JSONB;
