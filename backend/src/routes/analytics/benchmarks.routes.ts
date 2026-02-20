import { FastifyPluginAsync } from 'fastify';
import { BenchmarkService } from '../../services/benchmark-service';

const benchmarksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { clientId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; baselineDays?: string };
  }>('/api/clients/:clientId/benchmarks/campaigns', async (request, reply) => {
    try {
      const { clientId } = request.params;
      const { period, startDate, endDate, baselineDays } = request.query;
      const service = new BenchmarkService(fastify.pool);

      const response = await service.getCampaignBenchmarks(clientId, {
        period,
        startDate,
        endDate,
        baselineDays: baselineDays ? Number.parseInt(baselineDays, 10) : undefined,
      });

      return response;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch campaign benchmarks',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get<{
    Params: { snapshotId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; baselineDays?: string };
  }>('/api/creative-snapshots/:snapshotId/benchmark', async (request, reply) => {
    try {
      const { snapshotId } = request.params;
      const { period, startDate, endDate, baselineDays } = request.query;
      const service = new BenchmarkService(fastify.pool);

      const response = await service.getCreativeBenchmark(snapshotId, {
        period,
        startDate,
        endDate,
        baselineDays: baselineDays ? Number.parseInt(baselineDays, 10) : undefined,
      });

      if (!response) {
        reply.status(404);
        return { error: 'Creative benchmark not found' };
      }

      return response;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch creative benchmark',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default benchmarksRoutes;
