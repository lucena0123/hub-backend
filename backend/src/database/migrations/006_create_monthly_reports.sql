-- Migration: Monthly Reports Table
-- Stores generated monthly reports for clients

CREATE TABLE IF NOT EXISTS monthly_reports (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Report Details
  report_type TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'custom'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,

  -- Data Summary (JSON snapshot of metrics at generation time)
  summary_data JSONB NOT NULL, -- All metrics, charts data, etc

  -- File Info
  file_path TEXT, -- Path to PDF file
  file_size INTEGER, -- Size in bytes
  pdf_url TEXT, -- Public URL if stored in cloud

  -- Generation Info
  generated_by TEXT, -- User ID who generated
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,

  -- Status
  status TEXT DEFAULT 'generated', -- 'generating', 'generated', 'failed'

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_reports_client_id ON monthly_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_period ON monthly_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_generated_at ON monthly_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_client_period ON monthly_reports(client_id, period_start DESC);
