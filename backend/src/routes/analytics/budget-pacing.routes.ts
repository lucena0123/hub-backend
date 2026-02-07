/**
 * Budget Pacing Routes
 * GET /api/clients/:clientId/budget-pacing — returns pacing data for all active campaigns
 */

import type { FastifyPluginAsync } from 'fastify';
import { optionalAuth } from '../../middleware/auth';
import { BudgetPacingService } from '../../services/budget-pacing-service';

const budgetPacingRoutes: FastifyPluginAsync = async (fastify) => {
  const budgetPacingService = new BudgetPacingService(fastify.pool);

  fastify.get<{ Params: { clientId: string } }>(
    '/api/clients/:clientId/budget-pacing',
    { preHandler: [optionalAuth] },
    async (request) => {
      const { clientId } = request.params;
      const campaigns = await budgetPacingService.calculatePacing(clientId);

      const summary = {
        total: campaigns.length,
        onTrack: campaigns.filter((c) => c.pacingStatus === 'on_track').length,
        underPacing: campaigns.filter((c) => c.pacingStatus === 'under_pacing').length,
        overPacing: campaigns.filter((c) => c.pacingStatus === 'over_pacing').length,
      };

      return { clientId, summary, campaigns };
    }
  );
};

export default budgetPacingRoutes;
