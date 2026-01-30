-- Migration: Campaign Ads Table
-- Stores individual ads within campaigns

CREATE TABLE IF NOT EXISTS campaign_ads (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Ad Details
  ad_name TEXT NOT NULL,
  ad_type TEXT, -- 'image', 'video', 'carousel', 'text'
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'archived'

  -- Content
  headline TEXT,
  description TEXT,
  call_to_action TEXT,
  image_url TEXT,
  video_url TEXT,
  landing_page_url TEXT,

  -- Performance (aggregated from metrics)
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_spend DECIMAL(10,2) DEFAULT 0,

  -- Calculated
  avg_ctr DECIMAL(5,2) DEFAULT 0,
  avg_cpc DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  platform TEXT, -- 'meta', 'google', etc
  platform_ad_id TEXT, -- ID from Meta/Google
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_ads_campaign_id ON campaign_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_ads_status ON campaign_ads(status);
CREATE INDEX IF NOT EXISTS idx_campaign_ads_platform ON campaign_ads(platform);
