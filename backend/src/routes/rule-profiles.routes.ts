import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const ruleProfilesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  const listProfilesQuery = z.object({
    nicheKey: z.string().optional(),
    objectiveKey: z.string().optional(),
    channelKey: z.string().optional(),
    isActive: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          if (value.toLowerCase() === 'true') return true;
          if (value.toLowerCase() === 'false') return false;
        }
        return undefined;
      }),
  });

  const saveProfileBody = z.object({
    name: z.string().min(2),
    nicheKey: z.string().min(2),
    objectiveKey: z.string().min(2),
    channelKey: z.string().min(2),
    isActive: z.boolean().optional(),
    targets: z.record(z.unknown()).optional().nullable(),
    copyPolicy: z.record(z.unknown()).optional().nullable(),
    version: z.number().int().positive().optional(),
  });

  const updateProfileBody = saveProfileBody.partial();

  fastify.get('/api/rule-profiles', async (request, reply) => {
    const parsed = listProfilesQuery.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return { error: 'Validation failed', details: parsed.error.issues };
    }

    return fastify.services.ruleProfiles.listRuleProfiles(parsed.data);
  });

  fastify.post('/api/rule-profiles', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    const parsed = saveProfileBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      reply.status(400);
      return { error: 'Validation failed', details: parsed.error.issues };
    }

    try {
      const profile = await fastify.services.ruleProfiles.createRuleProfile(parsed.data as any);
      reply.status(201);
      return profile;
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to create rule profile' };
    }
  });

  fastify.patch('/api/rule-profiles/:id', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params ?? {});
    if (!params.success) {
      reply.status(400);
      return { error: 'Validation failed', details: params.error.issues };
    }

    const parsed = updateProfileBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      reply.status(400);
      return { error: 'Validation failed', details: parsed.error.issues };
    }

    try {
      const profile = await fastify.services.ruleProfiles.updateRuleProfile(params.data.id, parsed.data as any);
      return profile;
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('not found')) {
        reply.status(404);
        return { error: error.message };
      }
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to update rule profile' };
    }
  });

  fastify.get('/api/clients/:id/rule-bindings', async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params ?? {});
    if (!params.success) {
      reply.status(400);
      return { error: 'Validation failed', details: params.error.issues };
    }

    try {
      return await fastify.services.ruleProfiles.getClientRuleBindings(params.data.id);
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to load client rule bindings' };
    }
  });

  fastify.put('/api/clients/:id/rule-bindings', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params ?? {});
    if (!params.success) {
      reply.status(400);
      return { error: 'Validation failed', details: params.error.issues };
    }

    const body = z
      .object({
        bindings: z
          .array(
            z.object({
              ruleProfileId: z.string().min(1),
              isDefault: z.boolean().optional(),
              priority: z.number().int().min(1).max(9999).optional(),
              overrideTargets: z.record(z.unknown()).optional().nullable(),
              overrideCopyPolicy: z.record(z.unknown()).optional().nullable(),
            })
          )
          .default([]),
      })
      .safeParse(request.body ?? {});

    if (!body.success) {
      reply.status(400);
      return { error: 'Validation failed', details: body.error.issues };
    }

    try {
      return await fastify.services.ruleProfiles.putClientRuleBindings(params.data.id, body.data as any);
    } catch (error) {
      if (error instanceof Error && error.message === 'Client not found') {
        reply.status(404);
        return { error: 'Client not found' };
      }
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to save client rule bindings' };
    }
  });

  fastify.get('/api/campaigns/:id/rule-context', async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params ?? {});
    if (!params.success) {
      reply.status(400);
      return { error: 'Validation failed', details: params.error.issues };
    }

    try {
      return await fastify.services.ruleProfiles.getCampaignRuleContext(params.data.id);
    } catch (error) {
      if (error instanceof Error && error.message === 'Campaign not found') {
        reply.status(404);
        return { error: 'Campaign not found' };
      }
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to load campaign rule context' };
    }
  });

  fastify.put('/api/campaigns/:id/rule-context', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params ?? {});
    if (!params.success) {
      reply.status(400);
      return { error: 'Validation failed', details: params.error.issues };
    }

    const body = z
      .object({
        objectiveClassKey: z.string().optional().nullable(),
        channelClassKey: z.string().optional().nullable(),
        ruleProfileId: z.string().optional().nullable(),
        classificationSource: z.enum(['manual', 'inferred', 'backfill']).optional(),
        classificationConfidence: z.number().int().min(0).max(100).optional().nullable(),
        needsReview: z.boolean().optional(),
      })
      .safeParse(request.body ?? {});

    if (!body.success) {
      reply.status(400);
      return { error: 'Validation failed', details: body.error.issues };
    }

    try {
      return await fastify.services.ruleProfiles.putCampaignRuleContext(params.data.id, body.data);
    } catch (error) {
      if (error instanceof Error && error.message === 'Campaign not found') {
        reply.status(404);
        return { error: 'Campaign not found' };
      }
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to save campaign rule context' };
    }
  });

  fastify.post('/api/rules/backfill', { preHandler: [requireRoles(['admin'])] }, async (_request, reply) => {
    try {
      return await fastify.services.ruleProfiles.backfillLegacyClassifications();
    } catch (error) {
      reply.status(500);
      return { error: error instanceof Error ? error.message : 'Failed to run backfill' };
    }
  });

  fastify.get('/api/rules/review-queue', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    const parsed = z
      .object({
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        entityType: z.enum(['client', 'campaign']).optional(),
        limit: z.coerce.number().int().min(1).max(200).optional(),
      })
      .safeParse(request.query ?? {});

    if (!parsed.success) {
      reply.status(400);
      return { error: 'Validation failed', details: parsed.error.issues };
    }

    return fastify.services.ruleProfiles.listReviewQueue(parsed.data);
  });

  fastify.post('/api/rules/review-queue/:id/resolve', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params ?? {});
    if (!params.success) {
      reply.status(400);
      return { error: 'Validation failed', details: params.error.issues };
    }

    const body = z
      .object({
        status: z.enum(['approved', 'rejected']),
        selectedProfileId: z.string().optional().nullable(),
        applyToEntity: z.boolean().optional(),
      })
      .safeParse(request.body ?? {});

    if (!body.success) {
      reply.status(400);
      return { error: 'Validation failed', details: body.error.issues };
    }

    try {
      return await fastify.services.ruleProfiles.resolveReview(params.data.id, {
        ...body.data,
        resolvedBy: request.user?.id,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Review not found') {
        reply.status(404);
        return { error: 'Review not found' };
      }
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to resolve review item' };
    }
  });
};

export default ruleProfilesRoutes;
