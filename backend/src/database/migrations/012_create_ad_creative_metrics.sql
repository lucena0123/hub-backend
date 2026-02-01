CREATE TABLE IF NOT EXISTS ad_creative_metrics (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  adset_id TEXT,
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  messaging_conversations INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpl DECIMAL(10,2) DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  video_thruplay INTEGER DEFAULT 0,
  video_p25 INTEGER DEFAULT 0,
  video_p50 INTEGER DEFAULT 0,
  video_p75 INTEGER DEFAULT 0,
  video_p100 INTEGER DEFAULT 0,
  video_3sec_views INTEGER DEFAULT 0,
  hook_rate DECIMAL(5,2) DEFAULT 0,
  hold_rate DECIMAL(5,2) DEFAULT 0,
  quality_ranking TEXT,
  engagement_rate_ranking TEXT,
  conversion_rate_ranking TEXT,
  platform TEXT DEFAULT 'meta',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ad_id, date, platform)
);

CREATE INDEX idx_ad_creative_campaign ON ad_creative_metrics(campaign_id);
CREATE INDEX idx_ad_creative_adset ON ad_creative_metrics(adset_id);
CREATE INDEX idx_ad_creative_ad ON ad_creative_metrics(ad_id);
CREATE INDEX idx_ad_creative_date ON ad_creative_metrics(date DESC);
