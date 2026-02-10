-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "contractStart" TIMESTAMP(6) NOT NULL,
    "contractEnd" TIMESTAMP(6),
    "budget" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "avg_client_lifetime_months" DECIMAL(6,1),
    "avg_monthly_revenue_per_client" DECIMAL(12,2),
    "metaAdAccountId" TEXT,
    "optimization_targets" JSONB,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_instances" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "clientId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(6),
    "expectedSla" TEXT NOT NULL,
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "currentPhase" TEXT,
    "currentTask" TEXT,
    "state" JSONB NOT NULL,

    CONSTRAINT "process_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lane" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "processInstanceId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "startedAt" TIMESTAMP(6),
    "completedAt" TIMESTAMP(6),
    "durationMs" INTEGER,
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "objective" TEXT,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adsets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "adset_id" TEXT NOT NULL,
    "adset_name" TEXT,
    "status" TEXT,
    "effective_status" TEXT,
    "daily_budget" DECIMAL(10,2) DEFAULT 0,
    "lifetime_budget" DECIMAL(10,2) DEFAULT 0,
    "platform" TEXT DEFAULT 'meta',
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adsets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_metrics" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER DEFAULT 0,
    "clicks" INTEGER DEFAULT 0,
    "conversions" INTEGER DEFAULT 0,
    "spend" DECIMAL(10,2) DEFAULT 0,
    "ctr" DECIMAL(5,2) DEFAULT 0,
    "cpc" DECIMAL(10,2) DEFAULT 0,
    "cpl" DECIMAL(10,2) DEFAULT 0,
    "cpa" DECIMAL(10,2) DEFAULT 0,
    "roas" DECIMAL(10,2) DEFAULT 0,
    "leads" INTEGER DEFAULT 0,
    "qualified_leads" INTEGER DEFAULT 0,
    "revenue" DECIMAL(10,2) DEFAULT 0,
    "platform" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "messaging_conversations" INTEGER DEFAULT 0,
    "messaging_first_reply" INTEGER DEFAULT 0,
    "link_clicks" INTEGER DEFAULT 0,
    "landing_page_views" INTEGER DEFAULT 0,
    "reach" INTEGER DEFAULT 0,
    "frequency" DECIMAL(8,4) DEFAULT 0,
    "cpm" DECIMAL(10,2) DEFAULT 0,
    "quality_ranking" TEXT,
    "engagement_rate_ranking" TEXT,
    "conversion_rate_ranking" TEXT,

    CONSTRAINT "campaign_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adset_metrics" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "adset_id" TEXT NOT NULL,
    "adset_name" TEXT,
    "date" DATE NOT NULL,
    "impressions" INTEGER DEFAULT 0,
    "reach" INTEGER DEFAULT 0,
    "clicks" INTEGER DEFAULT 0,
    "spend" DECIMAL(10,2) DEFAULT 0,
    "conversions" INTEGER DEFAULT 0,
    "leads" INTEGER DEFAULT 0,
    "messaging_conversations" INTEGER DEFAULT 0,
    "messaging_first_reply" INTEGER DEFAULT 0,
    "ctr" DECIMAL(5,2) DEFAULT 0,
    "cpc" DECIMAL(10,2) DEFAULT 0,
    "cpl" DECIMAL(10,2) DEFAULT 0,
    "cpm" DECIMAL(10,2) DEFAULT 0,
    "frequency" DECIMAL(8,4) DEFAULT 0,
    "quality_ranking" TEXT,
    "engagement_rate_ranking" TEXT,
    "conversion_rate_ranking" TEXT,
    "platform" TEXT DEFAULT 'meta',
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adset_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creative_metrics" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "adset_id" TEXT,
    "ad_id" TEXT NOT NULL,
    "ad_name" TEXT,
    "date" DATE NOT NULL,
    "impressions" INTEGER DEFAULT 0,
    "reach" INTEGER DEFAULT 0,
    "clicks" INTEGER DEFAULT 0,
    "spend" DECIMAL(10,2) DEFAULT 0,
    "conversions" INTEGER DEFAULT 0,
    "messaging_conversations" INTEGER DEFAULT 0,
    "ctr" DECIMAL(5,2) DEFAULT 0,
    "cpc" DECIMAL(10,2) DEFAULT 0,
    "cpl" DECIMAL(10,2) DEFAULT 0,
    "cpm" DECIMAL(10,2) DEFAULT 0,
    "video_thruplay" INTEGER DEFAULT 0,
    "video_p25" INTEGER DEFAULT 0,
    "video_p50" INTEGER DEFAULT 0,
    "video_p75" INTEGER DEFAULT 0,
    "video_p100" INTEGER DEFAULT 0,
    "video_3sec_views" INTEGER DEFAULT 0,
    "hook_rate" DECIMAL(5,2) DEFAULT 0,
    "hold_rate" DECIMAL(5,2) DEFAULT 0,
    "quality_ranking" TEXT,
    "engagement_rate_ranking" TEXT,
    "conversion_rate_ranking" TEXT,
    "platform" TEXT DEFAULT 'meta',
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "creative_id" TEXT,
    "creative_snapshot_id" TEXT,

    CONSTRAINT "ad_creative_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creative_snapshots" (
    "id" TEXT NOT NULL,
    "creative_id" TEXT NOT NULL,
    "platform" TEXT DEFAULT 'meta',
    "content_hash" TEXT NOT NULL,
    "captured_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "headline" TEXT,
    "primary_text" TEXT,
    "description" TEXT,
    "cta_type" TEXT,
    "destination_url" TEXT,
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "video_id" TEXT,
    "format" TEXT,
    "is_dynamic" BOOLEAN DEFAULT false,
    "headlines" JSONB,
    "primary_texts" JSONB,
    "descriptions" JSONB,
    "cta_types" JSONB,
    "destination_urls" JSONB,
    "object_story_spec" JSONB,
    "asset_feed_spec" JSONB,
    "raw" JSONB,

    CONSTRAINT "ad_creative_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics_breakdowns" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "breakdown_type" TEXT NOT NULL,
    "breakdown_data" JSONB NOT NULL DEFAULT '[]',
    "total_spend" DECIMAL(10,2) DEFAULT 0,
    "total_impressions" INTEGER DEFAULT 0,
    "total_conversions" INTEGER DEFAULT 0,
    "platform" TEXT DEFAULT 'meta',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processId" TEXT,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "resource" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB NOT NULL,
    "complianceFlags" JSONB NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locks" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "holderType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_versions" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "breaking" BOOLEAN NOT NULL DEFAULT false,
    "rollbackVersion" TEXT,
    "deployedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deprecatedAt" TIMESTAMP(6),
    "metadata" JSONB NOT NULL,

    CONSTRAINT "process_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_bpmn_progress" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "current_subprocess" TEXT NOT NULL,
    "status" TEXT DEFAULT 'in_progress',
    "progress_percentage" INTEGER DEFAULT 0,
    "completed_tasks" TEXT[],
    "pending_tasks" TEXT[],
    "blocked_tasks" TEXT[],
    "started_at" TIMESTAMP(6),
    "estimated_completion" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "notes" TEXT,
    "blockers" JSONB,
    "metadata" JSONB,
    "subprocess_history" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_bpmn_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "report_type" TEXT DEFAULT 'monthly',
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "summary_data" JSONB NOT NULL,
    "file_path" TEXT,
    "file_size" INTEGER,
    "pdf_url" TEXT,
    "generated_by" TEXT,
    "generated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER DEFAULT 1,
    "status" TEXT DEFAULT 'generated',
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_history" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'meta',
    "account_id" TEXT,
    "date_range_start" DATE NOT NULL,
    "date_range_end" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "total_insights" INTEGER DEFAULT 0,
    "mapped_campaigns" INTEGER DEFAULT 0,
    "updated_metrics" INTEGER DEFAULT 0,
    "unmapped_campaigns" TEXT[],
    "duration_ms" INTEGER,
    "started_at" TIMESTAMP(6) NOT NULL,
    "completed_at" TIMESTAMP(6),
    "error_message" TEXT,
    "error_stack" TEXT,
    "dry_run" BOOLEAN DEFAULT false,
    "triggered_by" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_approvals" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "decided_by_user_id" TEXT,
    "decided_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_executions" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER DEFAULT 0,
    "idempotency_key" TEXT,
    "dry_run" BOOLEAN DEFAULT false,
    "request_payload" JSONB,
    "meta_response" JSONB,
    "error_message" TEXT,
    "error_stack" TEXT,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "executed_by_type" TEXT NOT NULL DEFAULT 'system',
    "executed_by_user_id" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_proposals" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'meta',
    "account_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'optimization_center',
    "source_item_id" TEXT,
    "rule_id" TEXT,
    "playbook_version" TEXT,
    "severity" TEXT,
    "category" TEXT,
    "action" TEXT,
    "title" TEXT,
    "description" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "recommended_payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_by_type" TEXT NOT NULL DEFAULT 'system',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomaly_detections" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "client_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "campaign_name" TEXT,
    "anomaly_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "metric_current" DECIMAL(12,2),
    "metric_baseline" DECIMAL(12,2),
    "change_pct" DECIMAL(8,2),
    "description" TEXT,
    "acknowledged" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anomaly_detections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_ads" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "ad_name" TEXT NOT NULL,
    "ad_type" TEXT,
    "status" TEXT DEFAULT 'active',
    "headline" TEXT,
    "description" TEXT,
    "call_to_action" TEXT,
    "image_url" TEXT,
    "video_url" TEXT,
    "landing_page_url" TEXT,
    "total_impressions" INTEGER DEFAULT 0,
    "total_clicks" INTEGER DEFAULT 0,
    "total_conversions" INTEGER DEFAULT 0,
    "total_spend" DECIMAL(10,2) DEFAULT 0,
    "avg_ctr" DECIMAL(5,2) DEFAULT 0,
    "avg_cpc" DECIMAL(10,2) DEFAULT 0,
    "platform" TEXT,
    "platform_ad_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_lead_tracking" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "qualified_leads" INTEGER DEFAULT 0,
    "contracts_closed" INTEGER DEFAULT 0,
    "average_ticket" DECIMAL(10,2) DEFAULT 0,
    "revenue_generated" DECIMAL(10,2) DEFAULT 0,
    "leads_responded" INTEGER DEFAULT 0,
    "response_time_hours" DECIMAL(8,2),
    "notes" TEXT,
    "lead_qualification_rate" DECIMAL(5,2),
    "closing_rate" DECIMAL(5,2),
    "roi" DECIMAL(10,2),
    "cost_per_contract" DECIMAL(10,2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "disqualification_reasons" JSONB,

    CONSTRAINT "campaign_lead_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_copy_insights" (
    "snapshot_id" TEXT NOT NULL,
    "theme_key" TEXT,
    "theme_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "model" TEXT,
    "prompt_version" TEXT,
    "analysis" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creative_copy_insights_pkey" PRIMARY KEY ("snapshot_id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "clientId" TEXT NOT NULL,
    "campaignId" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "cpa" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "client_id" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "read" BOOLEAN DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_summaries" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "client_id" TEXT NOT NULL,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "model" TEXT,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "metrics_snapshot" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_copy_suggestions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "theme_key" TEXT,
    "model" TEXT,
    "prompt_version" TEXT,
    "suggestions" JSONB NOT NULL DEFAULT '[]',
    "winner_context" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_copy_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_approval_history" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "client_id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_rule_configs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "parameters" JSONB,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_rule_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE INDEX "process_instances_clientId_idx" ON "process_instances"("clientId");

-- CreateIndex
CREATE INDEX "process_instances_status_idx" ON "process_instances"("status");

-- CreateIndex
CREATE INDEX "process_instances_processId_idx" ON "process_instances"("processId");

-- CreateIndex
CREATE INDEX "tasks_processInstanceId_idx" ON "tasks"("processInstanceId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_idx" ON "tasks"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_externalId_key" ON "campaigns"("externalId");

-- CreateIndex
CREATE INDEX "campaigns_clientId_idx" ON "campaigns"("clientId");

-- CreateIndex
CREATE INDEX "campaigns_platform_idx" ON "campaigns"("platform");

-- CreateIndex
CREATE INDEX "idx_adsets_campaign" ON "adsets"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_adsets_adset" ON "adsets"("adset_id");

-- CreateIndex
CREATE INDEX "idx_adsets_platform" ON "adsets"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "adsets_adset_id_platform_key" ON "adsets"("adset_id", "platform");

-- CreateIndex
CREATE INDEX "idx_campaign_metrics_campaign_date" ON "campaign_metrics"("campaign_id", "date" DESC);

-- CreateIndex
CREATE INDEX "idx_campaign_metrics_campaign_id" ON "campaign_metrics"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_campaign_metrics_date" ON "campaign_metrics"("date");

-- CreateIndex
CREATE INDEX "idx_campaign_metrics_platform" ON "campaign_metrics"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_metrics_campaign_id_date_platform_key" ON "campaign_metrics"("campaign_id", "date", "platform");

-- CreateIndex
CREATE INDEX "idx_adset_metrics_adset" ON "adset_metrics"("adset_id");

-- CreateIndex
CREATE INDEX "idx_adset_metrics_campaign" ON "adset_metrics"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_adset_metrics_campaign_date" ON "adset_metrics"("campaign_id", "date" DESC);

-- CreateIndex
CREATE INDEX "idx_adset_metrics_date" ON "adset_metrics"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "adset_metrics_adset_id_date_platform_key" ON "adset_metrics"("adset_id", "date", "platform");

-- CreateIndex
CREATE INDEX "idx_ad_creative_ad" ON "ad_creative_metrics"("ad_id");

-- CreateIndex
CREATE INDEX "idx_ad_creative_adset" ON "ad_creative_metrics"("adset_id");

-- CreateIndex
CREATE INDEX "idx_ad_creative_campaign" ON "ad_creative_metrics"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_ad_creative_date" ON "ad_creative_metrics"("date" DESC);

-- CreateIndex
CREATE INDEX "idx_ad_creative_metrics_creative_id" ON "ad_creative_metrics"("creative_id");

-- CreateIndex
CREATE INDEX "idx_ad_creative_metrics_snapshot_id" ON "ad_creative_metrics"("creative_snapshot_id");

-- CreateIndex
CREATE UNIQUE INDEX "ad_creative_metrics_ad_id_date_platform_key" ON "ad_creative_metrics"("ad_id", "date", "platform");

-- CreateIndex
CREATE INDEX "idx_ad_creative_snapshots_creative" ON "ad_creative_snapshots"("creative_id");

-- CreateIndex
CREATE INDEX "idx_ad_creative_snapshots_last_seen" ON "ad_creative_snapshots"("last_seen_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ad_creative_snapshots_platform" ON "ad_creative_snapshots"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "ad_creative_snapshots_creative_id_content_hash_platform_key" ON "ad_creative_snapshots"("creative_id", "content_hash", "platform");

-- CreateIndex
CREATE INDEX "idx_breakdowns_campaign" ON "metrics_breakdowns"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_breakdowns_campaign_type" ON "metrics_breakdowns"("campaign_id", "breakdown_type", "date" DESC);

-- CreateIndex
CREATE INDEX "idx_breakdowns_date" ON "metrics_breakdowns"("date" DESC);

-- CreateIndex
CREATE INDEX "idx_breakdowns_type" ON "metrics_breakdowns"("breakdown_type");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_breakdowns_campaign_id_date_breakdown_type_platform_key" ON "metrics_breakdowns"("campaign_id", "date", "breakdown_type", "platform");

-- CreateIndex
CREATE INDEX "audit_events_clientId_idx" ON "audit_events"("clientId");

-- CreateIndex
CREATE INDEX "audit_events_eventType_idx" ON "audit_events"("eventType");

-- CreateIndex
CREATE INDEX "audit_events_timestamp_idx" ON "audit_events"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "locks_status_idx" ON "locks"("status");

-- CreateIndex
CREATE INDEX "locks_expiresAt_idx" ON "locks"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "locks_resourceType_resourceId_key" ON "locks"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "process_versions_processId_idx" ON "process_versions"("processId");

-- CreateIndex
CREATE INDEX "process_versions_status_idx" ON "process_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "process_versions_processId_version_key" ON "process_versions"("processId", "version");

-- CreateIndex
CREATE INDEX "idx_client_bpmn_progress_client_id" ON "client_bpmn_progress"("client_id");

-- CreateIndex
CREATE INDEX "idx_client_bpmn_progress_status" ON "client_bpmn_progress"("status");

-- CreateIndex
CREATE INDEX "idx_client_bpmn_progress_subprocess" ON "client_bpmn_progress"("current_subprocess");

-- CreateIndex
CREATE UNIQUE INDEX "client_bpmn_progress_client_id_current_subprocess_key" ON "client_bpmn_progress"("client_id", "current_subprocess");

-- CreateIndex
CREATE INDEX "idx_monthly_reports_client_id" ON "monthly_reports"("client_id");

-- CreateIndex
CREATE INDEX "idx_monthly_reports_client_period" ON "monthly_reports"("client_id", "period_start" DESC);

-- CreateIndex
CREATE INDEX "idx_monthly_reports_generated_at" ON "monthly_reports"("generated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_monthly_reports_period" ON "monthly_reports"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "idx_sync_history_account" ON "sync_history"("account_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "idx_sync_history_platform" ON "sync_history"("platform");

-- CreateIndex
CREATE INDEX "idx_sync_history_started_at" ON "sync_history"("started_at" DESC);

-- CreateIndex
CREATE INDEX "idx_sync_history_status" ON "sync_history"("status");

-- CreateIndex
CREATE INDEX "idx_action_approvals_proposal" ON "action_approvals"("proposal_id", "decided_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "action_executions_idempotency_key_key" ON "action_executions"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_action_executions_proposal" ON "action_executions"("proposal_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_action_executions_status" ON "action_executions"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_action_proposals_client_status" ON "action_proposals"("client_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_action_proposals_entity" ON "action_proposals"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_action_proposals_source" ON "action_proposals"("source", "source_item_id");

-- CreateIndex
CREATE INDEX "idx_anomaly_client" ON "anomaly_detections"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_anomaly_type" ON "anomaly_detections"("anomaly_type");

-- CreateIndex
CREATE INDEX "idx_campaign_ads_campaign_id" ON "campaign_ads"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_campaign_ads_platform" ON "campaign_ads"("platform");

-- CreateIndex
CREATE INDEX "idx_campaign_ads_status" ON "campaign_ads"("status");

-- CreateIndex
CREATE INDEX "idx_lead_tracking_campaign" ON "campaign_lead_tracking"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_lead_tracking_campaign_date" ON "campaign_lead_tracking"("campaign_id", "date" DESC);

-- CreateIndex
CREATE INDEX "idx_lead_tracking_date" ON "campaign_lead_tracking"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_lead_tracking_campaign_id_date_key" ON "campaign_lead_tracking"("campaign_id", "date");

-- CreateIndex
CREATE INDEX "idx_creative_copy_insights_status" ON "creative_copy_insights"("status");

-- CreateIndex
CREATE INDEX "idx_creative_copy_insights_theme_key" ON "creative_copy_insights"("theme_key");

-- CreateIndex
CREATE INDEX "metrics_clientId_idx" ON "metrics"("clientId");

-- CreateIndex
CREATE INDEX "metrics_date_idx" ON "metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_clientId_campaignId_date_key" ON "metrics"("clientId", "campaignId", "date");

-- CreateIndex
CREATE INDEX "idx_notifications_client" ON "notifications"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_weekly_summaries_client" ON "weekly_summaries"("client_id", "week_start" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_summaries_client_id_week_start_key" ON "weekly_summaries"("client_id", "week_start");

-- CreateIndex
CREATE INDEX "idx_ai_copy_suggestions_client" ON "ai_copy_suggestions"("client_id");

-- CreateIndex
CREATE INDEX "idx_auto_approval_history_client" ON "auto_approval_history"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_auto_approval_history_proposal" ON "auto_approval_history"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_rule_configs_client_id_rule_id_key" ON "client_rule_configs"("client_id", "rule_id");

-- AddForeignKey
ALTER TABLE "process_instances" ADD CONSTRAINT "process_instances_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_processInstanceId_fkey" FOREIGN KEY ("processInstanceId") REFERENCES "process_instances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "adsets" ADD CONSTRAINT "adsets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "adset_metrics" ADD CONSTRAINT "adset_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ad_creative_metrics" ADD CONSTRAINT "ad_creative_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metrics_breakdowns" ADD CONSTRAINT "metrics_breakdowns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_bpmn_progress" ADD CONSTRAINT "client_bpmn_progress_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_approvals" ADD CONSTRAINT "action_approvals_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_approvals" ADD CONSTRAINT "action_approvals_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "action_proposals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_executions" ADD CONSTRAINT "action_executions_executed_by_user_id_fkey" FOREIGN KEY ("executed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_executions" ADD CONSTRAINT "action_executions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "action_proposals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_proposals" ADD CONSTRAINT "action_proposals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_proposals" ADD CONSTRAINT "action_proposals_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anomaly_detections" ADD CONSTRAINT "anomaly_detections_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "campaign_ads" ADD CONSTRAINT "campaign_ads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "campaign_lead_tracking" ADD CONSTRAINT "campaign_lead_tracking_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "creative_copy_insights" ADD CONSTRAINT "creative_copy_insights_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "ad_creative_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "weekly_summaries" ADD CONSTRAINT "weekly_summaries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_copy_suggestions" ADD CONSTRAINT "ai_copy_suggestions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auto_approval_history" ADD CONSTRAINT "auto_approval_history_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auto_approval_history" ADD CONSTRAINT "auto_approval_history_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "action_proposals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_rule_configs" ADD CONSTRAINT "client_rule_configs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

