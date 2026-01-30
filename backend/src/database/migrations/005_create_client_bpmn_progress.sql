-- Migration: Client BPMN Progress Table
-- Tracks client progress through BPMN subprocesses

CREATE TABLE IF NOT EXISTS client_bpmn_progress (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Current Status
  current_subprocess TEXT NOT NULL, -- '4.1', '4.2', '5.1', etc
  status TEXT DEFAULT 'in_progress', -- 'not_started', 'in_progress', 'completed', 'blocked'

  -- Progress Tracking
  progress_percentage INTEGER DEFAULT 0, -- 0-100
  completed_tasks TEXT[], -- Array of completed task IDs
  pending_tasks TEXT[], -- Array of pending task IDs
  blocked_tasks TEXT[], -- Array of blocked task IDs

  -- Timeline
  started_at TIMESTAMP,
  estimated_completion TIMESTAMP,
  completed_at TIMESTAMP,

  -- Details
  notes TEXT,
  blockers JSONB, -- Array of blockers with details
  metadata JSONB,

  -- Subprocess History (previous stages)
  subprocess_history JSONB, -- [{subprocess: '4.1', completedAt: '...', duration: '...'}]

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(client_id, current_subprocess)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_bpmn_progress_client_id ON client_bpmn_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_client_bpmn_progress_subprocess ON client_bpmn_progress(current_subprocess);
CREATE INDEX IF NOT EXISTS idx_client_bpmn_progress_status ON client_bpmn_progress(status);
