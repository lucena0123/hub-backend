import { createHash } from 'crypto';

export const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
};

export const hashAiInput = (payload: unknown): string =>
  createHash('sha256').update(stableStringify(payload)).digest('hex');

export const getAiOutputCacheHours = () => {
  const raw = process.env.AI_OUTPUT_CACHE_HOURS;
  if (!raw) return 24;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 24;
  return parsed;
};

export const normalizeAiError = (error: unknown) => {
  if (!error) return null;
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  try {
    return JSON.parse(JSON.stringify(error));
  } catch (_) {
    return { message: String(error) };
  }
};
