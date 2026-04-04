import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const customerSuccessRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const { customerSuccess } = fastify.services;

  fastify.get('/api/onboarding', async (request, reply) => {
    try {
      const { clientId } = request.query as { clientId?: string };
      return await customerSuccess.listOnboardingPlans({ clientId });
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch onboarding plans',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.patch('/api/onboarding/tasks/:id', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return await customerSuccess.updateOnboardingTask(id, request.body as any);
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to update onboarding task',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get('/api/accounts/health', async (request, reply) => {
    try {
      const { clientId } = request.query as { clientId?: string };
      return await customerSuccess.listHealthPortfolio({ clientId });
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch health portfolio',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get('/api/accounts/renewals', async (request, reply) => {
    try {
      const { clientId } = request.query as { clientId?: string };
      return await customerSuccess.listRenewalBoard(clientId);
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch account renewals',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get('/api/accounts/expansion-opportunities', async (request, reply) => {
    try {
      const { clientId } = request.query as { clientId?: string };
      return await customerSuccess.listExpansionOpportunities(clientId);
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch expansion opportunities',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.post('/api/accounts/expansion-opportunities', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      const opportunity = await customerSuccess.createExpansionOpportunity(request.body as any);
      reply.status(201);
      return opportunity;
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to create expansion opportunity',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default customerSuccessRoutes;
