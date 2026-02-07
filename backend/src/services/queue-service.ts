/**
 * QueueService — manages BullMQ queues for the Hub system.
 *
 * Queues:
 *   meta-sync          — daily Meta Ads data synchronisation per client
 *   optimization       — generate action proposals after sync
 *   budget-pacing      — hourly budget pacing checks
 *   action-execution   — execute approved action proposals via Meta API
 *
 * Gracefully degrades when Redis version < 5.0 (BullMQ requirement).
 */

import { Queue } from 'bullmq';
import type { Pool } from 'pg';
import { QUEUE_NAMES, DEFAULT_JOB_OPTIONS, createBullConnection } from '../config/queues';
import type IORedis from 'ioredis';

export class QueueService {
  private queues = new Map<string, Queue>();
  private connection: IORedis | null = null;
  private _available = false;

  constructor(private pool: Pool) {}

  /** Whether BullMQ is available (Redis >= 5.0) */
  get available() {
    return this._available;
  }

  async initialize() {
    try {
      const conn = createBullConnection();
      this.connection = conn;

      for (const name of Object.values(QUEUE_NAMES)) {
        const queue = new Queue(name, {
          connection: conn,
          defaultJobOptions: DEFAULT_JOB_OPTIONS,
        });
        // Prevent unhandled 'error' events from crashing Node
        queue.on('error', () => {});
        this.queues.set(name, queue);
      }

      // Verify connection works by getting job counts from first queue
      const firstQueue = [...this.queues.values()][0];
      if (firstQueue) await firstQueue.getJobCounts();

      this._available = true;
    } catch (err: any) {
      const msg = String(err?.message ?? '');
      if (msg.includes('Redis version') || msg.includes('greater or equal')) {
        console.warn(`[queue-service] BullMQ disabled: ${msg}`);
      } else {
        console.warn(`[queue-service] BullMQ initialization failed: ${msg}`);
      }
      this._available = false;
      await this.close().catch(() => {});
    }
  }

  getQueue(name: string): Queue | null {
    if (!this._available) return null;
    return this.queues.get(name) ?? null;
  }

  /* ------------------------------------------------------------------ */
  /*  Convenience methods (no-op when unavailable)                       */
  /* ------------------------------------------------------------------ */

  async addMetaSyncJob(clientId: string) {
    const q = this.getQueue(QUEUE_NAMES.META_SYNC);
    if (!q) return null;
    return q.add('sync-client', { clientId });
  }

  async addOptimizationJob(clientId: string) {
    const q = this.getQueue(QUEUE_NAMES.OPTIMIZATION);
    if (!q) return null;
    return q.add('generate-proposals', { clientId });
  }

  async addBudgetPacingJob(clientId: string) {
    const q = this.getQueue(QUEUE_NAMES.BUDGET_PACING);
    if (!q) return null;
    return q.add('check-pacing', { clientId });
  }

  async addActionExecutionJob(executionId: string) {
    const q = this.getQueue(QUEUE_NAMES.ACTION_EXECUTION);
    if (!q) return null;
    return q.add('execute-action', { executionId });
  }

  /* ------------------------------------------------------------------ */
  /*  Recurring jobs                                                     */
  /* ------------------------------------------------------------------ */

  async scheduleRecurringJobs() {
    if (!this._available) return 0;

    const { rows: clients } = await this.pool.query(
      `SELECT id FROM clients WHERE status = 'active'`
    );

    const metaSyncQueue = this.getQueue(QUEUE_NAMES.META_SYNC);
    const optimizationQueue = this.getQueue(QUEUE_NAMES.OPTIMIZATION);
    const budgetPacingQueue = this.getQueue(QUEUE_NAMES.BUDGET_PACING);

    if (!metaSyncQueue || !optimizationQueue || !budgetPacingQueue) return 0;

    for (const client of clients) {
      const clientId = String(client.id);

      // Daily Meta sync at 6 AM
      await metaSyncQueue.add(
        'sync-client',
        { clientId },
        {
          repeat: { pattern: '0 6 * * *' },
          jobId: `meta-sync-${clientId}`,
        }
      );

      // Daily optimization at 7 AM (after sync finishes)
      await optimizationQueue.add(
        'generate-proposals',
        { clientId },
        {
          repeat: { pattern: '0 7 * * *' },
          jobId: `optimization-${clientId}`,
        }
      );

      // Hourly budget pacing check
      await budgetPacingQueue.add(
        'check-pacing',
        { clientId },
        {
          repeat: { pattern: '0 * * * *' },
          jobId: `budget-pacing-${clientId}`,
        }
      );
    }

    return clients.length;
  }

  /* ------------------------------------------------------------------ */
  /*  Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  async close() {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    this.queues.clear();
    if (this.connection) {
      await this.connection.quit().catch(() => {});
      this.connection = null;
    }
  }
}
