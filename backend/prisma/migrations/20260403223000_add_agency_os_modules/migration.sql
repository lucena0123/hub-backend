CREATE TABLE "contracts" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "source_lead_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "service_type" TEXT NOT NULL DEFAULT 'marketing_retainer',
  "title" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "billing_cycle" TEXT NOT NULL DEFAULT 'monthly',
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "amount" DECIMAL(12,2),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_terms" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "contract_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "amount" DECIMAL(12,2),
  "scope_summary" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contract_terms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receivables" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "contract_id" TEXT NOT NULL,
  "reference_label" TEXT NOT NULL,
  "due_date" DATE NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "issued_at" TIMESTAMP(6),
  "paid_at" TIMESTAMP(6),
  "suspended_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "receivables_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_records" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "receivable_id" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "paid_at" TIMESTAMP(6) NOT NULL,
  "payment_method" TEXT,
  "reference" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collection_actions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "receivable_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "note" TEXT,
  "action_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collection_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "renewal_opportunities" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "contract_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "due_date" DATE NOT NULL,
  "health_status" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "renewal_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_templates" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "service_type" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "template_data" JSONB NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "contract_id" TEXT,
  "name" TEXT NOT NULL,
  "service_type" TEXT NOT NULL DEFAULT 'marketing_retainer',
  "status" TEXT NOT NULL DEFAULT 'planned',
  "owner_user_id" TEXT,
  "start_date" DATE NOT NULL,
  "due_date" DATE,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "milestones" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "project_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "order_index" INTEGER NOT NULL DEFAULT 0,
  "due_date" DATE,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deliverables" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "project_id" TEXT NOT NULL,
  "milestone_id" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "blocked_reason" TEXT,
  "due_date" DATE,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "work_items" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "project_id" TEXT NOT NULL,
  "deliverable_id" TEXT,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "assignee" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "due_date" DATE,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_plans" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "contract_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'onboarding',
  "started_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "target_date" DATE,
  "completed_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "onboarding_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_tasks" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "plan_id" TEXT NOT NULL,
  "task_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "due_date" DATE,
  "completed_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "onboarding_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "health_snapshots" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "contract_id" TEXT,
  "snapshot_date" DATE NOT NULL,
  "status" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "summary" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "health_signals" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "snapshot_id" TEXT NOT NULL,
  "signal_type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account_reviews" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "contract_id" TEXT,
  "review_date" DATE NOT NULL,
  "review_type" TEXT NOT NULL,
  "notes" TEXT,
  "owner_user_id" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expansion_opportunities" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "client_id" TEXT NOT NULL,
  "contract_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "estimated_mrr" DECIMAL(12,2),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expansion_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contract_terms_contract_version_key" ON "contract_terms"("contract_id", "version");
CREATE UNIQUE INDEX "renewal_opportunities_contract_due_date_key" ON "renewal_opportunities"("contract_id", "due_date");
CREATE UNIQUE INDEX "onboarding_plans_contract_key" ON "onboarding_plans"("contract_id");
CREATE UNIQUE INDEX "onboarding_tasks_plan_task_key_key" ON "onboarding_tasks"("plan_id", "task_key");
CREATE UNIQUE INDEX "health_snapshots_client_contract_date_key" ON "health_snapshots"("client_id", "contract_id", "snapshot_date");

CREATE INDEX "idx_contracts_client_status" ON "contracts"("client_id", "status");
CREATE INDEX "idx_contracts_status_end_date" ON "contracts"("status", "end_date");
CREATE INDEX "idx_contract_terms_contract_status" ON "contract_terms"("contract_id", "status");
CREATE INDEX "idx_receivables_client_status" ON "receivables"("client_id", "status");
CREATE INDEX "idx_receivables_contract_due_date" ON "receivables"("contract_id", "due_date");
CREATE INDEX "idx_receivables_status_due_date" ON "receivables"("status", "due_date");
CREATE INDEX "idx_payment_records_receivable_paid_at" ON "payment_records"("receivable_id", "paid_at");
CREATE INDEX "idx_collection_actions_receivable_action_at" ON "collection_actions"("receivable_id", "action_at");
CREATE INDEX "idx_renewal_opportunities_client_status" ON "renewal_opportunities"("client_id", "status");
CREATE INDEX "idx_project_templates_service_default" ON "project_templates"("service_type", "is_default");
CREATE INDEX "idx_projects_client_status" ON "projects"("client_id", "status");
CREATE INDEX "idx_projects_contract" ON "projects"("contract_id");
CREATE INDEX "idx_milestones_project_status" ON "milestones"("project_id", "status");
CREATE INDEX "idx_deliverables_project_status" ON "deliverables"("project_id", "status");
CREATE INDEX "idx_deliverables_milestone" ON "deliverables"("milestone_id");
CREATE INDEX "idx_work_items_project_status" ON "work_items"("project_id", "status");
CREATE INDEX "idx_work_items_deliverable" ON "work_items"("deliverable_id");
CREATE INDEX "idx_onboarding_plans_client_status" ON "onboarding_plans"("client_id", "status");
CREATE INDEX "idx_onboarding_tasks_plan_status" ON "onboarding_tasks"("plan_id", "status");
CREATE INDEX "idx_health_snapshots_status_date" ON "health_snapshots"("status", "snapshot_date");
CREATE INDEX "idx_health_signals_snapshot" ON "health_signals"("snapshot_id");
CREATE INDEX "idx_account_reviews_client_review_date" ON "account_reviews"("client_id", "review_date");
CREATE INDEX "idx_expansion_opportunities_client_status" ON "expansion_opportunities"("client_id", "status");

ALTER TABLE "contracts"
  ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "contract_terms"
  ADD CONSTRAINT "contract_terms_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "receivables"
  ADD CONSTRAINT "receivables_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "receivables_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "payment_records"
  ADD CONSTRAINT "payment_records_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "receivables"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "collection_actions"
  ADD CONSTRAINT "collection_actions_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "receivables"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "renewal_opportunities"
  ADD CONSTRAINT "renewal_opportunities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "renewal_opportunities_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "projects_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "milestones"
  ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "deliverables"
  ADD CONSTRAINT "deliverables_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "deliverables_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "work_items"
  ADD CONSTRAINT "work_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "work_items_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "onboarding_plans"
  ADD CONSTRAINT "onboarding_plans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "onboarding_plans_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "onboarding_tasks"
  ADD CONSTRAINT "onboarding_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "onboarding_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "health_snapshots"
  ADD CONSTRAINT "health_snapshots_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "health_snapshots_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "health_signals"
  ADD CONSTRAINT "health_signals_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "health_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "account_reviews"
  ADD CONSTRAINT "account_reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "account_reviews_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "expansion_opportunities"
  ADD CONSTRAINT "expansion_opportunities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "expansion_opportunities_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
