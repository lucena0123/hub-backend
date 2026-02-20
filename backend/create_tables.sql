-- BPMN System Database Schema

CREATE TABLE IF NOT EXISTS "clients" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "metaAdAccountId" TEXT,
  "tier" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "contractStart" TIMESTAMP NOT NULL,
  "contractEnd" TIMESTAMP,
  "budget" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "process_instances" (
  "id" TEXT PRIMARY KEY,
  "processId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "priority" INTEGER DEFAULT 5 NOT NULL,
  "clientId" TEXT NOT NULL,
  "startedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "completedAt" TIMESTAMP,
  "expectedSla" TEXT NOT NULL,
  "slaBreached" BOOLEAN DEFAULT false NOT NULL,
  "currentPhase" TEXT,
  "currentTask" TEXT,
  "state" JSONB NOT NULL,
  FOREIGN KEY ("clientId") REFERENCES "clients"("id")
);

CREATE INDEX IF NOT EXISTS "process_instances_clientId_idx" ON "process_instances"("clientId");
CREATE INDEX IF NOT EXISTS "process_instances_status_idx" ON "process_instances"("status");
CREATE INDEX IF NOT EXISTS "process_instances_processId_idx" ON "process_instances"("processId");

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "lane" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "priority" INTEGER DEFAULT 5 NOT NULL,
  "processInstanceId" TEXT NOT NULL,
  "assignedTo" TEXT,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "durationMs" INTEGER,
  "input" JSONB,
  "output" JSONB,
  "error" TEXT,
  FOREIGN KEY ("processInstanceId") REFERENCES "process_instances"("id")
);

CREATE INDEX IF NOT EXISTS "tasks_processInstanceId_idx" ON "tasks"("processInstanceId");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");
CREATE INDEX IF NOT EXISTS "tasks_assignedTo_idx" ON "tasks"("assignedTo");

CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" TEXT PRIMARY KEY,
  "externalId" TEXT UNIQUE NOT NULL,
  "platform" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "budget" DOUBLE PRECISION NOT NULL,
  "spent" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("clientId") REFERENCES "clients"("id")
);

CREATE INDEX IF NOT EXISTS "campaigns_clientId_idx" ON "campaigns"("clientId");
CREATE INDEX IF NOT EXISTS "campaigns_platform_idx" ON "campaigns"("platform");

CREATE TABLE IF NOT EXISTS "metrics" (
  "id" TEXT PRIMARY KEY,
  "date" TIMESTAMP NOT NULL,
  "clientId" TEXT NOT NULL,
  "campaignId" TEXT,
  "impressions" INTEGER DEFAULT 0 NOT NULL,
  "clicks" INTEGER DEFAULT 0 NOT NULL,
  "conversions" INTEGER DEFAULT 0 NOT NULL,
  "spent" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "revenue" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "ctr" DOUBLE PRECISION,
  "cpc" DOUBLE PRECISION,
  "cpa" DOUBLE PRECISION,
  "roas" DOUBLE PRECISION,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("clientId") REFERENCES "clients"("id"),
  FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id"),
  UNIQUE ("clientId", "campaignId", "date")
);

CREATE INDEX IF NOT EXISTS "metrics_clientId_idx" ON "metrics"("clientId");
CREATE INDEX IF NOT EXISTS "metrics_date_idx" ON "metrics"("date");

CREATE TABLE IF NOT EXISTS "audit_events" (
  "id" TEXT PRIMARY KEY,
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
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "audit_events_clientId_idx" ON "audit_events"("clientId");
CREATE INDEX IF NOT EXISTS "audit_events_eventType_idx" ON "audit_events"("eventType");
CREATE INDEX IF NOT EXISTS "audit_events_timestamp_idx" ON "audit_events"("timestamp");

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "locks" (
  "id" TEXT PRIMARY KEY,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "holderId" TEXT NOT NULL,
  "holderType" TEXT NOT NULL,
  "priority" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "acquiredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  UNIQUE ("resourceType", "resourceId")
);

CREATE INDEX IF NOT EXISTS "locks_status_idx" ON "locks"("status");
CREATE INDEX IF NOT EXISTS "locks_expiresAt_idx" ON "locks"("expiresAt");

CREATE TABLE IF NOT EXISTS "process_versions" (
  "id" TEXT PRIMARY KEY,
  "processId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "breaking" BOOLEAN DEFAULT false NOT NULL,
  "rollbackVersion" TEXT,
  "deployedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "deprecatedAt" TIMESTAMP,
  "metadata" JSONB NOT NULL,
  UNIQUE ("processId", "version")
);

CREATE INDEX IF NOT EXISTS "process_versions_processId_idx" ON "process_versions"("processId");
CREATE INDEX IF NOT EXISTS "process_versions_status_idx" ON "process_versions"("status");
