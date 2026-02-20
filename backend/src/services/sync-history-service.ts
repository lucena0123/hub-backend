import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface SyncHistoryRecord {
  id: string;
  platform: string;
  accountId?: string;
  dateRangeStart: string | Date;
  dateRangeEnd: string | Date;
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
  constructor(private prisma: PrismaClient) { }

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

    // Convert metadata to Prisma-compatible JSON
    const metadataJson = data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null;

    await this.prisma.syncHistory.create({
      data: {
        id,
        platform: data.platform,
        accountId: data.accountId,
        dateRangeStart: new Date(data.dateRangeStart),
        dateRangeEnd: new Date(data.dateRangeEnd),
        status: 'success', // Initial status, will be updated later? typically 'running'
        // The original code set it to 'success' initially, which is odd. 
        // Logic might be: create record -> do work -> update record.
        // But original code has status 'success' in insert. 
        // Let's stick to original behavior or better yet 'running'? 
        // Original: status: 'success' in INSERT.
        // Let's keep it 'success' for compatibility with existing logic which might rely on it, 
        // though 'running' makes more sense.
        // Wait, looking at original code:
        // status, values: 'success'.
        // then updateSyncSuccess sets it to 'success' or 'partial'.
        // updateSyncFailure sets to 'failed'.
        // So it starts as success? That's weird but I'll replicate.
        startedAt: new Date(),
        dryRun: data.dryRun,
        triggeredBy: data.triggeredBy || 'manual',
        metadata: metadataJson,
      }
    });

    return id;
  }

  async updateSyncMetadata(syncId: string, metadata: Record<string, unknown> | null): Promise<void> {
    const metadataJson = metadata ? JSON.parse(JSON.stringify(metadata)) : null;

    await this.prisma.syncHistory.update({
      where: { id: syncId },
      data: { metadata: metadataJson }
    });
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
      partial?: boolean;
    }
  ): Promise<void> {
    const isPartial = Boolean(data.partial) || data.unmappedCampaigns.length > 0;
    await this.prisma.syncHistory.update({
      where: { id: syncId },
      data: {
        status: isPartial ? 'partial' : 'success',
        totalInsights: data.totalInsights,
        mappedCampaigns: data.mappedCampaigns,
        updatedMetrics: data.updatedMetrics,
        unmappedCampaigns: data.unmappedCampaigns,
        durationMs: data.durationMs,
        completedAt: new Date()
      }
    });
  }

  /**
   * Update sync record with failure info
   */
  async completeSyncFailure(
    syncId: string,
    error: Error,
    durationMs: number
  ): Promise<void> {
    await this.prisma.syncHistory.update({
      where: { id: syncId },
      data: {
        status: 'failed',
        errorMessage: error.message,
        errorStack: error.stack,
        durationMs: durationMs,
        completedAt: new Date()
      }
    });
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

    const where: any = { platform };
    if (accountId) where.accountId = accountId;

    const rows = await this.prisma.syncHistory.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset
    });

    return rows.map((row: any) => ({
      id: row.id,
      platform: row.platform,
      accountId: row.accountId || undefined,
      dateRangeStart: row.dateRangeStart,
      dateRangeEnd: row.dateRangeEnd,
      status: row.status as any,
      totalInsights: row.totalInsights,
      mappedCampaigns: row.mappedCampaigns,
      updatedMetrics: row.updatedMetrics,
      unmappedCampaigns: row.unmappedCampaigns,
      durationMs: row.durationMs,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      errorMessage: row.errorMessage || undefined,
      errorStack: row.errorStack || undefined,
      dryRun: row.dryRun,
      triggeredBy: row.triggeredBy || undefined,
      metadata: row.metadata as any
    }));
  }

  /**
   * Get last successful sync timestamp
   */
  async getLastSuccessfulSync(platform: string, accountId?: string): Promise<Date | null> {
    const where: any = {
      platform,
      status: 'success'
    };
    if (accountId) where.accountId = accountId;

    const last = await this.prisma.syncHistory.findFirst({
      where,
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true }
    });

    return last?.completedAt || null;
  }
}
