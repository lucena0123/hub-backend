CREATE TABLE IF NOT EXISTS ad_creative_snapshots (
  id TEXT PRIMARY KEY,
  creative_id TEXT NOT NULL,
  platform TEXT DEFAULT 'meta',
  content_hash TEXT NOT NULL,
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Extracted fields for copy analysis
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  cta_type TEXT,
  destination_url TEXT,

  -- Media
  image_url TEXT,
  thumbnail_url TEXT,
  video_id TEXT,

  -- Classification
  format TEXT,
  is_dynamic BOOLEAN DEFAULT false,

  -- Dynamic Creative variants (when available)
  headlines JSONB,
  primary_texts JSONB,
  descriptions JSONB,
  cta_types JSONB,
  destination_urls JSONB,

  -- Raw specs (for reprocessing later)
  object_story_spec JSONB,
  asset_feed_spec JSONB,
  raw JSONB,

  UNIQUE(creative_id, content_hash, platform)
);

CREATE INDEX IF NOT EXISTS idx_ad_creative_snapshots_creative ON ad_creative_snapshots(creative_id);
CREATE INDEX IF NOT EXISTS idx_ad_creative_snapshots_last_seen ON ad_creative_snapshots(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_creative_snapshots_platform ON ad_creative_snapshots(platform);
