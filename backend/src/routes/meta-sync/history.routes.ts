import { FastifyPluginAsync } from 'fastify';

const metaSyncHistoryRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
  const { syncHistory: syncHistoryService } = fastify.services;

  // Get sync history
  fastify.get('/api/metrics/sync/history', async (request, reply) => {
    try {
      const { platform, accountId, limit, offset } = request.query as {
        platform?: string;
        accountId?: string;
        limit?: string;
        offset?: string;
      };

      const history = await syncHistoryService.getSyncHistory({
        platform: platform || 'meta',
        accountId,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });

      const lastSuccess = await syncHistoryService.getLastSuccessfulSync(platform || 'meta', accountId);

      const historyWithState = history.map((record: any) => ({
        ...record,
        state: record.completedAt ? record.status : 'running',
      }));

      return {
        history: historyWithState,
        lastSuccessfulSync: lastSuccess,
        total: historyWithState.length,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch sync history',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get single sync details
  fastify.get('/api/metrics/sync/history/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const result = await pool.query(
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
          WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        reply.status(404);
        return { error: 'Sync record not found' };
      }

      const row = result.rows[0];
      const state = row.completedAt ? row.status : 'running';
      return { ...row, state };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch sync details',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default metaSyncHistoryRoutes;

