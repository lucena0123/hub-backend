import type { FastifyPluginAsync } from 'fastify';

const clientPerformanceSummaryRoutes: FastifyPluginAsync = async (fastify) => {
  const { metrics: metricsService } = fastify.services;

  fastify.get('/api/clients/:id/performance-summary', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { period, startDate, endDate } = request.query as any;

      const summary = await metricsService.getClientPerformanceSummary(id, {
        period,
        startDate,
        endDate,
      });

      return summary;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch client performance summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default clientPerformanceSummaryRoutes;

