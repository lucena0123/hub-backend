import { FastifyPluginAsync } from 'fastify';
import { validateMetricsImport, validateMetricUpsert } from '../validators/metrics-import';
import { v4 as uuidv4 } from 'uuid';

const metricsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
  const { metrics: metricsService, cache: cacheService } = fastify.services;

  // Get campaign metrics
  fastify.get('/api/campaigns/:id/metrics', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { period, startDate, endDate, platform } = request.query as any;

      const metrics = await metricsService.getCampaignMetrics(id, {
        period,
        startDate,
        endDate,
        platform,
      });

      return metrics;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch campaign metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get campaign performance summary
  fastify.get('/api/campaigns/:id/performance-summary', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { period, startDate, endDate } = request.query as any;

      const summary = await metricsService.getPerformanceSummary(id, {
        period,
        startDate,
        endDate,
      });

      return summary;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch performance summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Import metrics in batch
  fastify.post('/api/metrics/import', async (request, reply) => {
    try {
      const validation = validateMetricsImport(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const { metrics, overwrite } = validation.data!;

      const campaignIds = [...new Set(metrics.map(m => m.campaignId))];
      const campaignCheck = await pool.query(
        `SELECT id, platform FROM campaigns WHERE id = ANY($1)`,
        [campaignIds]
      );
      const campaignMap = new Map(campaignCheck.rows.map(r => [r.id, r.platform]));
      const missingIds = campaignIds.filter(id => !campaignMap.has(id));

      if (missingIds.length > 0) {
        reply.status(400);
        return {
          error: 'Invalid campaign IDs',
          message: `Campaign(s) not found: ${missingIds.join(', ')}`,
        };
      }

      let imported = 0;
      let skipped = 0;
      let updated = 0;

      for (const entry of metrics) {
        const platform = campaignMap.get(entry.campaignId) || 'other';

        const ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
        const cpc = entry.clicks > 0 ? entry.spend / entry.clicks : 0;
        const cpl = entry.leads > 0 ? entry.spend / entry.leads : 0;
        const cpa = entry.conversions > 0 ? entry.spend / entry.conversions : 0;
        const roas = entry.spend > 0 ? entry.revenue / entry.spend : 0;

        if (overwrite) {
          await pool.query(
            `INSERT INTO campaign_metrics
             (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, leads, ctr, cpc, cpl, cpa, roas, platform)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (campaign_id, date, platform)
             DO UPDATE SET
               impressions = EXCLUDED.impressions,
               clicks = EXCLUDED.clicks,
               spend = EXCLUDED.spend,
               conversions = EXCLUDED.conversions,
               revenue = EXCLUDED.revenue,
               leads = EXCLUDED.leads,
               ctr = EXCLUDED.ctr,
               cpc = EXCLUDED.cpc,
               cpl = EXCLUDED.cpl,
               cpa = EXCLUDED.cpa,
               roas = EXCLUDED.roas`,
            [uuidv4(), entry.campaignId, entry.date, entry.impressions, entry.clicks,
             entry.spend, entry.conversions, entry.revenue, entry.leads,
             ctr, cpc, cpl, cpa, roas, platform]
          );
          updated++;
        } else {
          const result = await pool.query(
            `INSERT INTO campaign_metrics
             (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, leads, ctr, cpc, cpl, cpa, roas, platform)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (campaign_id, date, platform) DO NOTHING`,
            [uuidv4(), entry.campaignId, entry.date, entry.impressions, entry.clicks,
             entry.spend, entry.conversions, entry.revenue, entry.leads,
             ctr, cpc, cpl, cpa, roas, platform]
          );
          if (result.rowCount && result.rowCount > 0) {
            imported++;
          } else {
            skipped++;
          }
        }
      }

      if (cacheService) {
        await cacheService.invalidatePattern('dashboard:*');
        await cacheService.invalidatePattern('campaigns:*');
      }

      reply.status(201);
      return {
        success: true,
        total: metrics.length,
        imported,
        updated,
        skipped,
        message: overwrite
          ? `${updated} metrics imported/updated`
          : `${imported} new metrics imported, ${skipped} duplicates skipped`,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to import metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Add single metric entry
  fastify.post('/api/metrics/entry', async (request, reply) => {
    try {
      const validation = validateMetricUpsert(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const entry = validation.data!;

      const campaignCheck = await pool.query('SELECT id, platform FROM campaigns WHERE id = $1', [entry.campaignId]);
      if (campaignCheck.rows.length === 0) {
        reply.status(404);
        return { error: 'Campaign not found' };
      }

      const platform = campaignCheck.rows[0].platform || 'other';
      const ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
      const cpc = entry.clicks > 0 ? entry.spend / entry.clicks : 0;
      const cpl = entry.leads > 0 ? entry.spend / entry.leads : 0;
      const cpa = entry.conversions > 0 ? entry.spend / entry.conversions : 0;
      const roas = entry.spend > 0 ? entry.revenue / entry.spend : 0;

      const result = await pool.query(
        `INSERT INTO campaign_metrics
         (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, leads, ctr, cpc, cpl, cpa, roas, platform)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (campaign_id, date, platform)
         DO UPDATE SET
           impressions = EXCLUDED.impressions,
           clicks = EXCLUDED.clicks,
           spend = EXCLUDED.spend,
           conversions = EXCLUDED.conversions,
           revenue = EXCLUDED.revenue,
           leads = EXCLUDED.leads,
           ctr = EXCLUDED.ctr,
           cpc = EXCLUDED.cpc,
           cpl = EXCLUDED.cpl,
           cpa = EXCLUDED.cpa,
           roas = EXCLUDED.roas
         RETURNING *`,
        [uuidv4(), entry.campaignId, entry.date, entry.impressions, entry.clicks,
         entry.spend, entry.conversions, entry.revenue, entry.leads,
         ctr, cpc, cpl, cpa, roas, platform]
      );

      if (cacheService) {
        await cacheService.invalidatePattern('dashboard:*');
      }

      reply.status(201);
      return result.rows[0];
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to save metric',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default metricsRoutes;
