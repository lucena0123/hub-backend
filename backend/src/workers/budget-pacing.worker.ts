/**
 * Budget Pacing Worker
 * Runs hourly to check budget consumption pace for each active client.
 * Creates notifications for campaigns that are significantly over or under pacing.
 */

import { Worker, type Job } from 'bullmq';
import type { Pool } from 'pg';
import type IORedis from 'ioredis';
import { QUEUE_NAMES } from '../config/queues';
import { BudgetPacingService } from '../services/budget-pacing-service';
import { NotificationService } from '../services/notification-service';

type BudgetPacingJobData = { clientId: string };

export function createBudgetPacingWorker(pool: Pool, connection: IORedis) {
  const budgetPacingService = new BudgetPacingService(pool);
  const notificationService = new NotificationService(pool);

  return new Worker<BudgetPacingJobData>(
    QUEUE_NAMES.BUDGET_PACING,
    async (job: Job<BudgetPacingJobData>) => {
      const { clientId } = job.data;

      const clientResult = await pool.query(
        `SELECT id FROM clients WHERE id = $1 AND status = 'active'`,
        [clientId]
      );

      if (clientResult.rows.length === 0) {
        return { clientId, skipped: true, reason: 'client_not_found_or_inactive' };
      }

      const campaigns = await budgetPacingService.calculatePacing(clientId);

      const overPacing = campaigns.filter((c) => c.pacingStatus === 'over_pacing');
      const underPacing = campaigns.filter((c) => c.pacingStatus === 'under_pacing');

      // Notify for critical over-pacing (>150%)
      const critical = campaigns.filter((c) => c.pacingPercentage > 150);
      if (critical.length > 0) {
        const names = critical.map((c) => c.campaignName).join(', ');
        await notificationService.create({
          clientId,
          type: 'pacing_critical',
          severity: 'critical',
          title: `${critical.length} campanha${critical.length > 1 ? 's' : ''} com gasto excessivo`,
          message: `Campanhas acima de 150% do pacing esperado: ${names}`,
          metadata: { campaigns: critical.map((c) => ({ id: c.campaignId, name: c.campaignName, pacing: c.pacingPercentage })) },
          expiresInHours: 24,
        }).catch(() => {});
      }

      // Notify for warning-level pacing issues (over 120% or under 50%)
      const warnings = campaigns.filter(
        (c) => (c.pacingPercentage > 120 && c.pacingPercentage <= 150) || c.pacingPercentage < 50
      );
      if (warnings.length > 0) {
        const names = warnings.map((c) => `${c.campaignName} (${c.pacingPercentage}%)`).join(', ');
        await notificationService.create({
          clientId,
          type: 'pacing_warning',
          severity: 'warning',
          title: `${warnings.length} campanha${warnings.length > 1 ? 's' : ''} com pacing irregular`,
          message: `Campanhas fora do range ideal: ${names}`,
          metadata: { campaigns: warnings.map((c) => ({ id: c.campaignId, name: c.campaignName, pacing: c.pacingPercentage })) },
          expiresInHours: 24,
        }).catch(() => {});
      }

      return {
        clientId,
        checkedAt: new Date().toISOString(),
        total: campaigns.length,
        onTrack: campaigns.length - overPacing.length - underPacing.length,
        overPacing: overPacing.length,
        underPacing: underPacing.length,
        critical: critical.length,
      };
    },
    {
      connection,
      concurrency: 5,
    }
  );
}
