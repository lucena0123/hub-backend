ALTER TABLE ai_outputs
  ADD COLUMN IF NOT EXISTS error_reason text,
  ADD COLUMN IF NOT EXISTS fallback_used boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ai_outputs_prompt
  ON ai_outputs (prompt_id, prompt_version, status, created_at DESC);
