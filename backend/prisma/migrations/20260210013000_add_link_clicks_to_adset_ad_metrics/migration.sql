-- Add link click + landing page view metrics to adset and ad creative metrics
ALTER TABLE "adset_metrics"
  ADD COLUMN IF NOT EXISTS "link_clicks" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "landing_page_views" INTEGER DEFAULT 0;

ALTER TABLE "ad_creative_metrics"
  ADD COLUMN IF NOT EXISTS "link_clicks" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "landing_page_views" INTEGER DEFAULT 0;
