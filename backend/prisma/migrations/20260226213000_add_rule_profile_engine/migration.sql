ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "business_niche_key" TEXT,
  ADD COLUMN IF NOT EXISTS "default_channel_key" TEXT;

ALTER TABLE "campaigns"
  ADD COLUMN IF NOT EXISTS "objective_class_key" TEXT,
  ADD COLUMN IF NOT EXISTS "channel_class_key" TEXT,
  ADD COLUMN IF NOT EXISTS "rule_profile_id" TEXT;

CREATE TABLE IF NOT EXISTS "rule_profiles" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "niche_key" TEXT NOT NULL,
  "objective_key" TEXT NOT NULL,
  "channel_key" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "targets_json" JSONB,
  "copy_policy_json" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rule_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "client_rule_profile_bindings" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "rule_profile_id" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "override_targets_json" JSONB,
  "override_copy_policy_json" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_rule_profile_bindings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_rule_contexts" (
  "campaign_id" TEXT NOT NULL,
  "objective_key" TEXT,
  "channel_key" TEXT,
  "rule_profile_id" TEXT,
  "classification_source" TEXT NOT NULL DEFAULT 'manual',
  "classification_confidence" INTEGER DEFAULT 100,
  "needs_review" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaign_rule_contexts_pkey" PRIMARY KEY ("campaign_id")
);

CREATE TABLE IF NOT EXISTS "rule_classification_reviews" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "reason_code" TEXT NOT NULL,
  "suggested_profile_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(6),
  "resolved_by" TEXT,
  CONSTRAINT "rule_classification_reviews_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "client_rule_configs"
  ADD COLUMN IF NOT EXISTS "campaign_id" TEXT,
  ADD COLUMN IF NOT EXISTS "rule_profile_id" TEXT;

DROP INDEX IF EXISTS "client_rule_configs_client_id_rule_id_key";
CREATE UNIQUE INDEX IF NOT EXISTS "client_rule_configs_client_rule_scope_key"
  ON "client_rule_configs" ("client_id", "rule_id", "rule_profile_id", "campaign_id");

CREATE INDEX IF NOT EXISTS "idx_clients_business_niche_key" ON "clients" ("business_niche_key");
CREATE INDEX IF NOT EXISTS "idx_clients_default_channel_key" ON "clients" ("default_channel_key");

CREATE INDEX IF NOT EXISTS "idx_campaigns_objective_class_key" ON "campaigns" ("objective_class_key");
CREATE INDEX IF NOT EXISTS "idx_campaigns_channel_class_key" ON "campaigns" ("channel_class_key");
CREATE INDEX IF NOT EXISTS "idx_campaigns_rule_profile_id" ON "campaigns" ("rule_profile_id");

CREATE INDEX IF NOT EXISTS "idx_rule_profiles_profile_key" ON "rule_profiles" ("niche_key", "objective_key", "channel_key");
CREATE INDEX IF NOT EXISTS "idx_rule_profiles_active" ON "rule_profiles" ("is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "client_rule_profile_bindings_client_profile_key"
  ON "client_rule_profile_bindings" ("client_id", "rule_profile_id");
CREATE INDEX IF NOT EXISTS "idx_client_rule_profile_bindings_client_default"
  ON "client_rule_profile_bindings" ("client_id", "is_default");
CREATE INDEX IF NOT EXISTS "idx_client_rule_profile_bindings_client_priority"
  ON "client_rule_profile_bindings" ("client_id", "priority");

CREATE INDEX IF NOT EXISTS "idx_campaign_rule_contexts_objective_channel"
  ON "campaign_rule_contexts" ("objective_key", "channel_key");
CREATE INDEX IF NOT EXISTS "idx_campaign_rule_contexts_profile"
  ON "campaign_rule_contexts" ("rule_profile_id");
CREATE INDEX IF NOT EXISTS "idx_campaign_rule_contexts_needs_review"
  ON "campaign_rule_contexts" ("needs_review");

CREATE INDEX IF NOT EXISTS "idx_rule_classification_reviews_entity"
  ON "rule_classification_reviews" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_rule_classification_reviews_status_created"
  ON "rule_classification_reviews" ("status", "created_at");

CREATE INDEX IF NOT EXISTS "idx_client_rule_configs_client_rule"
  ON "client_rule_configs" ("client_id", "rule_id");
CREATE INDEX IF NOT EXISTS "idx_client_rule_configs_campaign"
  ON "client_rule_configs" ("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_client_rule_configs_profile"
  ON "client_rule_configs" ("rule_profile_id");

ALTER TABLE "campaigns"
  ADD CONSTRAINT "campaigns_rule_profile_id_fkey"
  FOREIGN KEY ("rule_profile_id") REFERENCES "rule_profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "client_rule_profile_bindings"
  ADD CONSTRAINT "client_rule_profile_bindings_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "client_rule_profile_bindings"
  ADD CONSTRAINT "client_rule_profile_bindings_rule_profile_id_fkey"
  FOREIGN KEY ("rule_profile_id") REFERENCES "rule_profiles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "campaign_rule_contexts"
  ADD CONSTRAINT "campaign_rule_contexts_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "campaign_rule_contexts"
  ADD CONSTRAINT "campaign_rule_contexts_rule_profile_id_fkey"
  FOREIGN KEY ("rule_profile_id") REFERENCES "rule_profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "rule_classification_reviews"
  ADD CONSTRAINT "rule_classification_reviews_suggested_profile_id_fkey"
  FOREIGN KEY ("suggested_profile_id") REFERENCES "rule_profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "client_rule_configs"
  ADD CONSTRAINT "client_rule_configs_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "client_rule_configs"
  ADD CONSTRAINT "client_rule_configs_rule_profile_id_fkey"
  FOREIGN KEY ("rule_profile_id") REFERENCES "rule_profiles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
