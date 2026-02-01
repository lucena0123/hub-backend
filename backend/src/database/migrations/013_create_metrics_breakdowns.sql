CREATE TABLE IF NOT EXISTS metrics_breakdowns (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  breakdown_type TEXT NOT NULL, -- 'age_gender', 'platform_position', 'device'
  breakdown_data JSONB NOT NULL DEFAULT '[]',
  total_spend DECIMAL(10,2) DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  platform TEXT DEFAULT 'meta',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, date, breakdown_type, platform)
);

CREATE INDEX idx_breakdowns_campaign ON metrics_breakdowns(campaign_id);
CREATE INDEX idx_breakdowns_date ON metrics_breakdowns(date DESC);
CREATE INDEX idx_breakdowns_type ON metrics_breakdowns(breakdown_type);
CREATE INDEX idx_breakdowns_campaign_type ON metrics_breakdowns(campaign_id, breakdown_type, date DESC);
