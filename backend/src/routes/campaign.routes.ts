import { FastifyPluginAsync } from 'fastify';
import { validateCampaignCreate, validateCampaignUpdate } from '../validators/campaign';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const campaignRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const { campaigns } = fastify.services;
  const { cache: cacheService } = fastify.services;

  // List all campaigns (with optional filters)
  fastify.get('/api/campaigns', async (request) => {
    const { clientId, platform, status } = request.query as {
      clientId?: string;
      platform?: string;
      status?: string;
    };

    const cacheKey = `campaigns:${clientId || 'all'}:${platform || 'all'}:${status || 'all'}`;
    if (cacheService) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    const data = await campaigns.findAll({ clientId, platform, status });

    if (cacheService) {
      await cacheService.set(cacheKey, data, 120);
    }

    return data;
  });

  // Get single campaign by ID
  fastify.get('/api/campaigns/:id', async (request) => {
    const { id } = request.params as { id: string };
    return campaigns.findById(id);
  });

  // Create new campaign
  fastify.post('/api/campaigns', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    const validation = validateCampaignCreate(request.body);
    if (!validation.valid) {
      // Let global error handler catch ValidationError if we threw it,
      // but here we are using a helper that returns an object.
      // We can either throw a ValidationError here or return 400 manually.
      // To be consistent with "Let Error Handler catch them", we should probably throw.
      // But for now, let's keep the manual return to match existing behavior roughly, 
      // or better: throw ValidationError.
      // However, validation returns { valid: false, errors: ... }

      // Let's return 400 manually for now as it's cleaner with the current validator helper
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const result = await campaigns.create(validation.data!);

    if (cacheService) {
      await cacheService.invalidatePattern('campaigns:*');
    }

    reply.status(201);
    return result;
  });

  // Update campaign
  fastify.put('/api/campaigns/:id', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const validation = validateCampaignUpdate(request.body);

    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const result = await campaigns.update(id, validation.data!);

    if (cacheService) {
      await cacheService.invalidatePattern('campaigns:*');
    }

    return result;
  });

  // Delete campaign
  fastify.delete('/api/campaigns/:id', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request) => {
    const { id } = request.params as { id: string };
    await campaigns.delete(id);

    if (cacheService) {
      await cacheService.invalidatePattern('campaigns:*');
    }

    return { success: true, message: 'Campaign deleted successfully' };
  });
};

export default campaignRoutes;
