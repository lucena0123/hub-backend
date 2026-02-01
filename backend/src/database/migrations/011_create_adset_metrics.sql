CREATE TABLE IF NOT EXISTS adset_metrics (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  adset_id TEXT NOT NULL,
  adset_name TEXT,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  messaging_conversations INTEGER DEFAULT 0,
  messaging_first_reply INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpl DECIMAL(10,2) DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  frequency DECIMAL(8,4) DEFAULT 0,
  quality_ranking TEXT,
  engagement_rate_ranking TEXT,
  conversion_rate_ranking TEXT,
  platform TEXT DEFAULT 'meta',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(adset_id, date, platform)
);

CREATE INDEX idx_adset_metrics_campaign ON adset_metrics(campaign_id);
CREATE INDEX idx_adset_metrics_adset ON adset_metrics(adset_id);
CREATE INDEX idx_adset_metrics_date ON adset_metrics(date DESC);
CREATE INDEX idx_adset_metrics_campaign_date ON adset_metrics(campaign_id, date DESC);
