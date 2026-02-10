import { FastifyPluginAsync } from 'fastify';
import { AbTestSuggestionsService } from '../../services/ab-test-suggestions';

const creativeSnapshotsRoutes: FastifyPluginAsync = async (fastify) => {


  // Get a creative snapshot by ID
  fastify.get<{
    Params: { snapshotId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; force?: string };
  }>('/api/creative-snapshots/:snapshotId/ab-test-suggestions', async (request, reply) => {
    try {
      const { snapshotId } = request.params;
      const { period, startDate, endDate, force } = request.query;

      const service = new AbTestSuggestionsService(
        fastify.prisma,
        fastify.services.analytics,
        fastify.services.aiOutputs
      );
      const result = await service.getSuggestions({
        snapshotId,
        period,
        startDate,
        endDate,
        force: force === 'true',
      });

      if (!result) {
        reply.status(404);
        return { error: 'Creative snapshot not found' };
      }

      return result;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch A/B test suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get<{
    Params: { snapshotId: string };
  }>('/api/creative-snapshots/:snapshotId', async (request, reply) => {
    try {
      const { snapshotId } = request.params;

      const { analytics } = fastify.services;
      const snapshot = await analytics.getCreativeSnapshot(snapshotId);

      if (!snapshot) {
        reply.status(404);
        return { error: 'Creative snapshot not found' };
      }

      return snapshot;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch creative snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // List snapshots for a creative
  fastify.get<{
    Params: { creativeId: string };
    Querystring: { limit?: string };
  }>('/api/creatives/:creativeId/snapshots', async (request, reply) => {
    try {
      const { creativeId } = request.params;
      const limit = Math.max(1, Math.min(200, Number.parseInt(request.query.limit || '50', 10) || 50));

      const { analytics } = fastify.services;
      const result = await analytics.listCreativeSnapshots(creativeId, limit);
      return result;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to list creative snapshots',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default creativeSnapshotsRoutes;
