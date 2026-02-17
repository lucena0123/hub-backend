-- Add Meta created_time fields to support accurate naming and auditing
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS created_time TIMESTAMP(6);

ALTER TABLE adsets
  ADD COLUMN IF NOT EXISTS created_time TIMESTAMP(6);

ALTER TABLE ad_creative_metrics
  ADD COLUMN IF NOT EXISTS ad_created_time TIMESTAMP(6);

CREATE INDEX IF NOT EXISTS idx_campaigns_created_time ON campaigns(created_time);
CREATE INDEX IF NOT EXISTS idx_adsets_created_time ON adsets(created_time);
CREATE INDEX IF NOT EXISTS idx_ad_creative_metrics_ad_created_time ON ad_creative_metrics(ad_created_time);
