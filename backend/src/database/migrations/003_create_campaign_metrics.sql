-- Migration: Campaign Metrics Table
-- Stores daily performance metrics for campaigns

CREATE TABLE IF NOT EXISTS campaign_metrics (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Performance Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,

  -- Calculated Metrics
  ctr DECIMAL(5,2) DEFAULT 0, -- Click-Through Rate (%)
  cpc DECIMAL(10,2) DEFAULT 0, -- Cost Per Click
  cpl DECIMAL(10,2) DEFAULT 0, -- Cost Per Lead
  cpa DECIMAL(10,2) DEFAULT 0, -- Cost Per Acquisition
  roas DECIMAL(10,2) DEFAULT 0, -- Return on Ad Spend

  -- Additional Data
  leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  platform TEXT, -- 'meta', 'google', 'linkedin', etc
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(campaign_id, date, platform)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics(date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_platform ON campaign_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_date ON campaign_metrics(campaign_id, date DESC);
