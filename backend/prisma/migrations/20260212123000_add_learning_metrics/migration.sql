-- Add learning phase tracking fields to adsets
ALTER TABLE "adsets"
  ADD COLUMN IF NOT EXISTS "learning_status" TEXT,
  ADD COLUMN IF NOT EXISTS "learning_stage_info" JSONB,
  ADD COLUMN IF NOT EXISTS "learning_status_updated_at" TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS "last_significant_edit" TIMESTAMP(6);

-- Store raw action breakdowns for ad set metrics
ALTER TABLE "adset_metrics"
  ADD COLUMN IF NOT EXISTS "actions_by_type" JSONB,
  ADD COLUMN IF NOT EXISTS "action_values_by_type" JSONB;

-- Snapshot historical ad set budgets for auditability
CREATE TABLE IF NOT EXISTS "adset_budget_history" (
  "id" TEXT PRIMARY KEY,
  "campaign_id" TEXT NOT NULL REFERENCES "campaigns"(id) ON DELETE CASCADE,
  "adset_id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "daily_budget" DECIMAL(10,2) DEFAULT 0,
  "lifetime_budget" DECIMAL(10,2) DEFAULT 0,
  "status" TEXT,
  "effective_status" TEXT,
  "configured_status" TEXT,
  "learning_status" TEXT,
  "last_significant_edit" TIMESTAMP(6),
  "learning_stage_info" JSONB,
  "metadata" JSONB,
  "platform" TEXT DEFAULT 'meta',
  "created_at" TIMESTAMP(6) DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "adset_budget_history_adset_date_platform_key"
  ON "adset_budget_history" ("adset_id", "date", "platform");
CREATE INDEX IF NOT EXISTS "idx_adset_budget_history_campaign"
  ON "adset_budget_history" ("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_adset_budget_history_adset"
  ON "adset_budget_history" ("adset_id");
CREATE INDEX IF NOT EXISTS "idx_adset_budget_history_date"
  ON "adset_budget_history" ("date" DESC);
