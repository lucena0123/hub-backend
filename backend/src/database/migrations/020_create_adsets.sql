CREATE TABLE IF NOT EXISTS adsets (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  adset_id TEXT NOT NULL,
  adset_name TEXT,
  status TEXT,
  effective_status TEXT,
  daily_budget DECIMAL(10,2) DEFAULT 0,
  lifetime_budget DECIMAL(10,2) DEFAULT 0,
  platform TEXT DEFAULT 'meta',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(adset_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_adsets_campaign ON adsets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_adsets_adset ON adsets(adset_id);
CREATE INDEX IF NOT EXISTS idx_adsets_platform ON adsets(platform);
