import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const leadTrackingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const { leadTracking: leadTrackingService, cache: cacheService } = fastify.services;

  // Upsert lead tracking data for a campaign
  fastify.post<{
    Body: {
      campaignId: string;
      date: string;
      qualifiedLeads?: number;
      disqualificationReasons?: Record<string, number>;
      contractsClosed?: number;
      averageTicket?: number;
      revenueGenerated?: number;
      leadsResponded?: number;
      responseTimeHours?: number;
      notes?: string;
    };
  }>('/api/lead-tracking', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      const result = await leadTrackingService.upsertLeadTracking(request.body);

      if (cacheService) {
        await cacheService.invalidatePattern('dashboard:*');
        await cacheService.invalidatePattern(`campaigns:${request.body.campaignId}:*`);
      }

      return result;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to save lead tracking data',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get lead tracking data for a campaign
  fastify.get<{
    Params: { campaignId: string };
    Querystring: {
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    };
  }>('/api/campaigns/:campaignId/lead-tracking', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { startDate, endDate, limit, offset } = request.query;

      const result = await leadTrackingService.getLeadTracking(campaignId, {
        startDate,
        endDate,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      return result;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch lead tracking data',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get lead tracking summary for a campaign
  fastify.get<{
    Params: { campaignId: string };
    Querystring: {
      startDate: string;
      endDate: string;
    };
  }>('/api/campaigns/:campaignId/lead-summary', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { startDate, endDate } = request.query;

      if (!startDate || !endDate) {
        reply.status(400);
        return { error: 'startDate and endDate are required' };
      }

      const summary = await leadTrackingService.getLeadTrackingSummary(
        campaignId,
        startDate,
        endDate
      );

      return summary;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch lead summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete lead tracking record
  fastify.delete<{
    Params: { campaignId: string };
    Querystring: { date: string };
  }>('/api/campaigns/:campaignId/lead-tracking', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { date } = request.query;

      if (!date) {
        reply.status(400);
        return { error: 'date query parameter is required' };
      }

      const deleted = await leadTrackingService.deleteLeadTracking(campaignId, date);

      if (!deleted) {
        reply.status(404);
        return { error: 'Lead tracking record not found' };
      }

      if (cacheService) {
        await cacheService.invalidatePattern('dashboard:*');
        await cacheService.invalidatePattern(`campaigns:${campaignId}:*`);
      }

      return { success: true, message: 'Lead tracking record deleted' };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to delete lead tracking record',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default leadTrackingRoutes;
