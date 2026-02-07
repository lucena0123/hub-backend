-- Migration 025: Add optimization_targets JSONB column to clients
-- Allows per-client override of playbook thresholds (CPL targets, frequency limits, etc.)
-- Example: { "targetCplGoodMax": 15, "targetCplOkMax": 22, "frequencyWarning": 4 }
-- When NULL, defaults from the detected theme are used.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS optimization_targets JSONB DEFAULT NULL;
