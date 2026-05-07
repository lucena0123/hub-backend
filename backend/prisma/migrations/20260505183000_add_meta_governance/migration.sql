CREATE TABLE "meta_governance_issues" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "issue_key" TEXT NOT NULL,
  "sync_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "account_id" TEXT,
  "entity_type" TEXT NOT NULL,
  "entity_external_id" TEXT NOT NULL,
  "campaign_id" TEXT,
  "issue_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "current_name" TEXT,
  "expected_name" TEXT,
  "current_created_time" TIMESTAMP(6),
  "expected_created_time" TIMESTAMP(6),
  "before_payload" JSONB,
  "after_payload" JSONB,
  "meta_error" TEXT,
  "db_error" TEXT,
  "details" JSONB,
  "first_seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(6),
  "auto_fixed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meta_governance_issues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_naming_overrides" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_external_id" TEXT,
  "product_key" TEXT,
  "theme_key" TEXT,
  "audience_key" TEXT,
  "override_payload" JSONB NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meta_naming_overrides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meta_governance_issues_issue_key_key" ON "meta_governance_issues"("issue_key");
CREATE INDEX "idx_meta_governance_issues_client_status" ON "meta_governance_issues"("client_id", "status");
CREATE INDEX "idx_meta_governance_issues_sync" ON "meta_governance_issues"("sync_id");
CREATE INDEX "idx_meta_governance_issues_entity" ON "meta_governance_issues"("entity_type", "entity_external_id");
CREATE INDEX "idx_meta_governance_issues_type_status" ON "meta_governance_issues"("issue_type", "status");
CREATE INDEX "idx_meta_governance_issues_last_seen" ON "meta_governance_issues"("last_seen_at" DESC);

CREATE INDEX "idx_meta_naming_overrides_client_type_active_priority" ON "meta_naming_overrides"("client_id", "entity_type", "active", "priority");
CREATE INDEX "idx_meta_naming_overrides_entity_external" ON "meta_naming_overrides"("entity_external_id");

ALTER TABLE "meta_governance_issues"
  ADD CONSTRAINT "meta_governance_issues_sync_id_fkey" FOREIGN KEY ("sync_id") REFERENCES "sync_history"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "meta_governance_issues_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "meta_governance_issues_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "meta_naming_overrides"
  ADD CONSTRAINT "meta_naming_overrides_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
