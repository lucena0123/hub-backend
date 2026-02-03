-- Migration: Create campaign_lead_tracking table
-- Tracks lead generation performance and manual funnel data for advocacy/service businesses

CREATE TABLE IF NOT EXISTS campaign_lead_tracking (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Manual tracking (input by user)
  qualified_leads INTEGER DEFAULT 0,
  contracts_closed INTEGER DEFAULT 0,
  average_ticket DECIMAL(10,2) DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,

  -- Additional manual fields
  leads_responded INTEGER DEFAULT 0, -- Leads that replied to first message
  response_time_hours DECIMAL(8,2), -- Average response time
  notes TEXT, -- Additional observations

  -- Calculated fields (computed on save)
  lead_qualification_rate DECIMAL(5,2), -- % of leads that are qualified
  closing_rate DECIMAL(5,2), -- % of qualified leads that close
  roi DECIMAL(10,2), -- ROI based on revenue vs spend
  cost_per_contract DECIMAL(10,2), -- Spend / contracts_closed

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: one record per campaign per day
  UNIQUE(campaign_id, date)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lead_tracking_campaign ON campaign_lead_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_tracking_date ON campaign_lead_tracking(date DESC);
CREATE INDEX IF NOT EXISTS idx_lead_tracking_campaign_date ON campaign_lead_tracking(campaign_id, date DESC);

-- Comments
COMMENT ON TABLE campaign_lead_tracking IS 'Manual tracking of lead quality and conversion funnel for service businesses';
COMMENT ON COLUMN campaign_lead_tracking.qualified_leads IS 'Number of leads considered qualified (have real potential)';
COMMENT ON COLUMN campaign_lead_tracking.contracts_closed IS 'Number of leads that became paying clients';
COMMENT ON COLUMN campaign_lead_tracking.average_ticket IS 'Average contract value for closed deals';
COMMENT ON COLUMN campaign_lead_tracking.revenue_generated IS 'Total revenue from closed contracts';
COMMENT ON COLUMN campaign_lead_tracking.lead_qualification_rate IS 'Percentage: qualified_leads / total_leads from campaign_metrics';
COMMENT ON COLUMN campaign_lead_tracking.closing_rate IS 'Percentage: contracts_closed / qualified_leads';
COMMENT ON COLUMN campaign_lead_tracking.roi IS 'Return on Investment: (revenue_generated / spend) * 100';
