-- Migration: Create sync_history table
-- Tracks Meta Ads sync operations for auditing and debugging

CREATE TABLE IF NOT EXISTS sync_history (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'meta',
  account_id TEXT,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),

  -- Metrics
  total_insights INTEGER DEFAULT 0,
  mapped_campaigns INTEGER DEFAULT 0,
  updated_metrics INTEGER DEFAULT 0,
  unmapped_campaigns TEXT[], -- Array of external IDs that couldn't be mapped

  -- Performance
  duration_ms INTEGER,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,

  -- Error tracking
  error_message TEXT,
  error_stack TEXT,

  -- Additional metadata
  dry_run BOOLEAN DEFAULT FALSE,
  triggered_by TEXT, -- 'manual', 'cron', 'webhook'
  metadata JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_sync_history_platform ON sync_history(platform);
CREATE INDEX idx_sync_history_status ON sync_history(status);
CREATE INDEX idx_sync_history_started_at ON sync_history(started_at DESC);
CREATE INDEX idx_sync_history_account ON sync_history(account_id, started_at DESC);

-- Comments
COMMENT ON TABLE sync_history IS 'Tracks all sync operations from external ad platforms';
COMMENT ON COLUMN sync_history.unmapped_campaigns IS 'External campaign IDs that could not be mapped to internal campaigns';
COMMENT ON COLUMN sync_history.triggered_by IS 'How the sync was initiated: manual, cron, or webhook';
