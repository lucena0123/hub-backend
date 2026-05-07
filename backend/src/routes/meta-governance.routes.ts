import type { FastifyPluginAsync } from 'fastify';

import { authenticate } from '../middleware/auth';

const metaGovernanceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/api/meta-governance/issues', async (request, reply) => {
    try {
      const query = request.query as {
        clientId?: string;
        syncId?: string;
        status?: string;
        entityType?: string;
        issueType?: string;
        limit?: string;
        offset?: string;
      };

      return await fastify.services.metaGovernance.listIssues({
        clientId: query.clientId,
        syncId: query.syncId,
        status: query.status,
        entityType: query.entityType,
        issueType: query.issueType,
        limit: query.limit ? Number(query.limit) : 20,
        offset: query.offset ? Number(query.offset) : 0,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch Meta governance issues',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get('/api/meta-governance/issues/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const issue = await fastify.services.metaGovernance.getIssueById(id);

      if (!issue) {
        reply.status(404);
        return { error: 'Meta governance issue not found' };
      }

      return issue;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch Meta governance issue',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default metaGovernanceRoutes;
