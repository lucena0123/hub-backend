/**
 * BullMQ Queue Configuration
 * Defines queue names, default job options, and Redis connection for ioredis.
 */

import IORedis from 'ioredis';

export const QUEUE_NAMES = {
  META_SYNC: 'meta-sync',
  OPTIMIZATION: 'optimization',
  BUDGET_PACING: 'budget-pacing',
  ACTION_EXECUTION: 'action-execution',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** Shared ioredis connection for BullMQ (separate from the `redis` v4 client used by CacheService). */
export function createBullConnection() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return new IORedis(url, { maxRetriesPerRequest: null });
}

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    count: 200,
    age: 7 * 24 * 3600, // 7 days
  },
  removeOnFail: {
    count: 500,
    age: 14 * 24 * 3600, // 14 days
  },
};
