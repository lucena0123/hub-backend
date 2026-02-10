import type { Pool } from 'pg';
import { getAiOutputCacheHours } from '../utils/ai-output';

export type AiOutputStatus = 'success' | 'failed' | 'cached' | 'skipped';

export type AiOutputLogInput = {
  type: string;
  entityId: string;
  model?: string | null;
  promptId?: string | null;
  promptVersion?: string | null;
  status: AiOutputStatus;
  payload?: unknown | null;
  error?: unknown | null;
  errorReason?: string | null;
  fallbackUsed?: boolean | null;
  latencyMs?: number | null;
  inputHash?: string | null;
};

export type AiOutputCacheResult = {
  payload: any;
  model: string | null;
  promptId: string | null;
  promptVersion: string | null;
  createdAt: string;
};

const toJson = (value: unknown) => {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
};

export class AiOutputService {
  constructor(private pool: Pool) {}

  async getCachedOutput(params: { type: string; inputHash: string; maxAgeHours?: number }): Promise<AiOutputCacheResult | null> {
    const { type, inputHash } = params;
    if (!type || !inputHash) return null;

    const maxAgeHours = params.maxAgeHours ?? getAiOutputCacheHours();
    try {
      const result = await this.pool.query(
        `SELECT payload, model, prompt_id, prompt_version, created_at
         FROM ai_outputs
         WHERE type = $1 AND input_hash = $2 AND status = 'success'
           AND created_at >= (NOW() - ($3::int * interval '1 hour'))
         ORDER BY created_at DESC
         LIMIT 1`,
        [type, inputHash, maxAgeHours]
      );

      if (!result.rows.length) return null;
      const row = result.rows[0] as any;
      return {
        payload: row.payload,
        model: row.model ?? null,
        promptId: row.prompt_id ?? null,
        promptVersion: row.prompt_version ?? null,
        createdAt: row.created_at?.toISOString?.() ?? String(row.created_at ?? ''),
      };
    } catch (error) {
      console.warn('[ai-outputs] Failed to read cache', error);
      return null;
    }
  }

  async logOutput(input: AiOutputLogInput): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO ai_outputs
         (type, entity_id, model, prompt_id, prompt_version, status, payload, error, error_reason, fallback_used, latency_ms, input_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12)`,
        [
          input.type,
          input.entityId,
          input.model ?? null,
          input.promptId ?? null,
          input.promptVersion ?? null,
          input.status,
          toJson(input.payload),
          toJson(input.error),
          input.errorReason ?? null,
          input.fallbackUsed ?? false,
          input.latencyMs ?? null,
          input.inputHash ?? null,
        ]
      );
      const logMeta = {
        type: input.type,
        entityId: input.entityId,
        status: input.status,
        latencyMs: input.latencyMs ?? null,
        model: input.model ?? null,
        promptId: input.promptId ?? null,
        promptVersion: input.promptVersion ?? null,
        inputHash: input.inputHash ?? null,
        errorReason: input.errorReason ?? null,
        fallbackUsed: input.fallbackUsed ?? false,
      };
      if (input.status === 'failed') {
        console.warn('[ai-output]', logMeta);
      } else {
        console.info('[ai-output]', logMeta);
      }
    } catch (error) {
      console.warn('[ai-outputs] Failed to log output', error);
    }
  }
}
