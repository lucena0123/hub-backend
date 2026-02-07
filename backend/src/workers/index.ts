/**
 * Worker Registry
 * Starts and stops all BullMQ workers.
 * Gracefully skips when Redis version < 5.0.
 */

import type { Worker } from 'bullmq';
import type { Pool } from 'pg';
import { createBullConnection } from '../config/queues';
import { createMetaSyncWorker } from './meta-sync.worker';
import { createOptimizationWorker } from './optimization.worker';
import { createActionExecutionWorker } from './action-execution.worker';
import { createBudgetPacingWorker } from './budget-pacing.worker';

import { AnalyticsService } from '../services/analytics/analytics-service';

export function startWorkers(pool: Pool, deps: { cacheRedis: any; analytics: AnalyticsService }): Worker[] {
  try {
    // Each worker gets its own ioredis connection (BullMQ recommendation)
    const workers: Worker[] = [
      createMetaSyncWorker(pool, createBullConnection(), deps),
      createOptimizationWorker(pool, createBullConnection(), deps.analytics),
      createActionExecutionWorker(pool, createBullConnection()),
      createBudgetPacingWorker(pool, createBullConnection()),
    ];

    console.log(`[workers] Started ${workers.length} BullMQ workers`);
    return workers;
  } catch (err: any) {
    console.warn(`[workers] Failed to start BullMQ workers: ${err?.message ?? err}`);
    return [];
  }
}

export async function stopWorkers(workers: Worker[]) {
  if (workers.length === 0) return;
  await Promise.all(workers.map((w) => w.close()));
  console.log('[workers] All workers closed');
}
