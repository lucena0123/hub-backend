/**
 * Sync History Service
 * Tracks external platform sync operations
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface SyncHistoryRecord {
  id: string;
  platform: string;
  accountId?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  status: 'success' | 'failed' | 'partial';
  totalInsights: number;
  mappedCampaigns: number;
  updatedMetrics: number;
  unmappedCampaigns: string[];
  durationMs: number | null;
  startedAt: Date;
  completedAt: Date | null;
  errorMessage?: string;
  errorStack?: string;
  dryRun: boolean;
  triggeredBy?: string;
  metadata?: Record<string, unknown> | null;
}

export class SyncHistoryService {
  constructor(private pool: Pool) {}

  /**
   * Create a new sync history record
   */
  async createSyncRecord(data: {
    platform: string;
    accountId?: string;
    dateRangeStart: string;
    dateRangeEnd: string;
    dryRun: boolean;
    triggeredBy?: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<string> {
    const id = uuidv4();
    await this.pool.query(
      `INSERT INTO sync_history
       (id, platform, account_id, date_range_start, date_range_end,
        status, started_at, dry_run, triggered_by, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)`,
      [
        id,
        data.platform,
        data.accountId,
        data.dateRangeStart,
        data.dateRangeEnd,
        'success', // Will be updated later
        data.dryRun,
        data.triggeredBy || 'manual',
        data.metadata ?? null,
      ]
    );
    return id;
  }

  async updateSyncMetadata(syncId: string, metadata: Record<string, unknown> | null): Promise<void> {
    await this.pool.query(
      `UPDATE sync_history
       SET metadata = $1
       WHERE id = $2`,
      [metadata ? JSON.stringify(metadata) : null, syncId]
    );
  }

  /**
   * Update sync record with success metrics
   */
  async completeSyncSuccess(
    syncId: string,
    data: {
      totalInsights: number;
      mappedCampaigns: number;
      updatedMetrics: number;
      unmappedCampaigns: string[];
      durationMs: number;
    }
  ): Promise<void> {
    await this.pool.query(
      `UPDATE sync_history
       SET status = $1,
           total_insights = $2,
           mapped_campaigns = $3,
           updated_metrics = $4,
           unmapped_campaigns = $5,
           duration_ms = $6,
           completed_at = NOW()
       WHERE id = $7`,
      [
        data.unmappedCampaigns.length > 0 ? 'partial' : 'success',
        data.totalInsights,
        data.mappedCampaigns,
        data.updatedMetrics,
        data.unmappedCampaigns,
        data.durationMs,
        syncId,
      ]
    );
  }

  /**
   * Update sync record with failure info
   */
  async completeSyncFailure(
    syncId: string,
    error: Error,
    durationMs: number
  ): Promise<void> {
    await this.pool.query(
      `UPDATE sync_history
       SET status = $1,
           error_message = $2,
           error_stack = $3,
           duration_ms = $4,
           completed_at = NOW()
       WHERE id = $5`,
      ['failed', error.message, error.stack, durationMs, syncId]
    );
  }

  /**
   * Get sync history with pagination
   */
  async getSyncHistory(options: {
    platform?: string;
    accountId?: string;
    limit?: number;
    offset?: number;
  }): Promise<SyncHistoryRecord[]> {
    const { platform = 'meta', accountId, limit = 20, offset = 0 } = options;

    const conditions = ['platform = $1'];
    const params: any[] = [platform];

    if (accountId) {
      params.push(accountId);
      conditions.push(`account_id = $${params.length}`);
    }

     const result = await this.pool.query(
       `SELECT
          id, platform, account_id as "accountId",
          date_range_start as "dateRangeStart",
          date_range_end as "dateRangeEnd",
          status, total_insights as "totalInsights",
          mapped_campaigns as "mappedCampaigns",
          updated_metrics as "updatedMetrics",
          unmapped_campaigns as "unmappedCampaigns",
          duration_ms as "durationMs",
          started_at as "startedAt",
          completed_at as "completedAt",
          error_message as "errorMessage",
          error_stack as "errorStack",
          dry_run as "dryRun",
          triggered_by as "triggeredBy",
          metadata
        FROM sync_history
        WHERE ${conditions.join(' AND ')}
        ORDER BY started_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get last successful sync timestamp
   */
  async getLastSuccessfulSync(platform: string, accountId?: string): Promise<Date | null> {
    const conditions = ['platform = $1', "status = 'success'"];
    const params: any[] = [platform];

    if (accountId) {
      params.push(accountId);
      conditions.push(`account_id = $${params.length}`);
    }

    const result = await this.pool.query(
      `SELECT completed_at
       FROM sync_history
       WHERE ${conditions.join(' AND ')}
       ORDER BY completed_at DESC
       LIMIT 1`,
      params
    );

    return result.rows[0]?.completed_at || null;
  }
}
