CREATE TABLE IF NOT EXISTS action_proposals (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'meta',
  account_id TEXT,
  source TEXT NOT NULL DEFAULT 'optimization_center',
  source_item_id TEXT,
  rule_id TEXT,
  playbook_version TEXT,
  severity TEXT,
  category TEXT,
  action TEXT,
  title TEXT,
  description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  recommended_payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'expired')),
  created_by_type TEXT NOT NULL DEFAULT 'system' CHECK (created_by_type IN ('system', 'user')),
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_action_proposals_client_status ON action_proposals(client_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_proposals_entity ON action_proposals(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_proposals_source ON action_proposals(source, source_item_id);

CREATE TABLE IF NOT EXISTS action_approvals (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES action_proposals(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  reason TEXT,
  decided_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_action_approvals_proposal ON action_approvals(proposal_id, decided_at DESC);

CREATE TABLE IF NOT EXISTS action_executions (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES action_proposals(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'success', 'failed')),
  attempts INTEGER DEFAULT 0,
  idempotency_key TEXT,
  dry_run BOOLEAN DEFAULT FALSE,
  request_payload JSONB,
  meta_response JSONB,
  error_message TEXT,
  error_stack TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  executed_by_type TEXT NOT NULL DEFAULT 'system' CHECK (executed_by_type IN ('system', 'user')),
  executed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_action_executions_proposal ON action_executions(proposal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_executions_status ON action_executions(status, created_at DESC);
