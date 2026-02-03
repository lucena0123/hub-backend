ALTER TABLE ad_creative_metrics ADD COLUMN IF NOT EXISTS creative_id TEXT;
ALTER TABLE ad_creative_metrics ADD COLUMN IF NOT EXISTS creative_snapshot_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ad_creative_metrics_creative_id ON ad_creative_metrics(creative_id);
CREATE INDEX IF NOT EXISTS idx_ad_creative_metrics_snapshot_id ON ad_creative_metrics(creative_snapshot_id);
