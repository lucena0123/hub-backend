CREATE TABLE IF NOT EXISTS ai_outputs (
  id text PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  type text NOT NULL,
  entity_id text NOT NULL,
  model text,
  prompt_id text,
  prompt_version text,
  status text NOT NULL,
  payload jsonb,
  error jsonb,
  latency_ms integer,
  input_hash text,
  created_at timestamp(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_outputs_type_entity
  ON ai_outputs (type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_outputs_input_hash
  ON ai_outputs (input_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_outputs_status
  ON ai_outputs (status, created_at DESC);
