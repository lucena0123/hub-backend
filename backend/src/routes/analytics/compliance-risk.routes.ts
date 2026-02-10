import { FastifyPluginAsync } from 'fastify';
import { ComplianceRiskService } from '../../services/compliance-risk-service';

const complianceRiskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { clientId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; campaignId?: string };
  }>('/api/clients/:clientId/compliance-risk', async (request, reply) => {
    try {
      const { clientId } = request.params;
      const { period, startDate, endDate, campaignId } = request.query;
      const service = new ComplianceRiskService(fastify.pool);

      const response = await service.getComplianceRisk({
        clientId,
        period,
        startDate,
        endDate,
        campaignId: campaignId ?? null,
      });

      return response;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch compliance risk',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default complianceRiskRoutes;
