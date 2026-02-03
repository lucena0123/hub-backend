-- Migration: Add disqualification reasons to campaign_lead_tracking
-- Adds structured reasons to explain why leads were not qualified (manual input)

ALTER TABLE campaign_lead_tracking
  ADD COLUMN IF NOT EXISTS disqualification_reasons JSONB;

COMMENT ON COLUMN campaign_lead_tracking.disqualification_reasons IS
  'JSON map of disqualification reasons and counts (e.g., {\"curioso\": 12, \"fora_tema\": 5}).';

