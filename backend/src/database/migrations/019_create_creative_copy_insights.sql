-- Migration 019: Create creative_copy_insights table
-- Stores AI/manual analysis and copy suggestions per creative snapshot

CREATE TABLE IF NOT EXISTS creative_copy_insights (
  snapshot_id TEXT PRIMARY KEY REFERENCES ad_creative_snapshots(id) ON DELETE CASCADE,
  theme_key TEXT,
  theme_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'success' | 'failed' | 'pending'
  model TEXT,
  prompt_version TEXT,
  analysis JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creative_copy_insights_theme_key ON creative_copy_insights(theme_key);
CREATE INDEX IF NOT EXISTS idx_creative_copy_insights_status ON creative_copy_insights(status);

