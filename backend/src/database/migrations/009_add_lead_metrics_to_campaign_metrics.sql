-- Migration: Add lead generation metrics to campaign_metrics
-- Captures messaging/conversation actions from Meta Ads API

ALTER TABLE campaign_metrics
  ADD COLUMN IF NOT EXISTS messaging_conversations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messaging_first_reply INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS link_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS landing_page_views INTEGER DEFAULT 0;

-- Update computed columns to use messaging_conversations as leads
-- (This is more accurate for lead gen campaigns than generic "leads" field)

-- Comments
COMMENT ON COLUMN campaign_metrics.messaging_conversations IS 'Total conversations started (from Meta actions: onsite_conversion.messaging_conversation_started_7d)';
COMMENT ON COLUMN campaign_metrics.messaging_first_reply IS 'Conversations with first reply from user (from Meta actions: onsite_conversion.messaging_first_reply)';
COMMENT ON COLUMN campaign_metrics.link_clicks IS 'Total link clicks (from Meta actions: link_click)';
COMMENT ON COLUMN campaign_metrics.landing_page_views IS 'Landing page views (from Meta actions: landing_page_view)';
