-- Migration 010: Add campaign health and quality ranking metrics
-- These fields come directly from Meta Insights API at no extra API call cost

ALTER TABLE campaign_metrics
  ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency DECIMAL(8,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cpm DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_ranking TEXT,
  ADD COLUMN IF NOT EXISTS engagement_rate_ranking TEXT,
  ADD COLUMN IF NOT EXISTS conversion_rate_ranking TEXT;
