import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { CommercialFlowError, CommercialLeadStatus } from '../services/commercial-leads-service';

const commercialLeadsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const { commercialLeads } = fastify.services;

  fastify.get('/api/comercial/dashboard', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async () => {
    return commercialLeads.getDashboard();
  });

  fastify.post<{
    Body: {
      origem: 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro';
      nomeEscritorio: string;
      responsavel: string;
      instagram?: string;
      whatsapp?: string;
      cidade?: string;
      areaPrincipal?: string;
      proximaAcao?: string;
      dataProximaAcao?: string;
    };
  }>('/api/comercial/leads', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    const lead = await commercialLeads.createLead(request.body);
    reply.status(201);
    return lead;
  });

  fastify.get<{
    Querystring: {
      status?: CommercialLeadStatus;
      responsavel?: string;
    };
  }>('/api/comercial/leads', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request) => {
    return commercialLeads.listLeads(request.query);
  });

  fastify.post<{
    Params: { leadId: string };
    Body: {
      to: CommercialLeadStatus;
      observacao?: string;
      actor?: string;
      dor01Ok?: boolean;
      dor02Ok?: boolean;
      dor03Ok?: boolean;
      motivoNutricao?: string;
      motivoPerda?: string;
      dataProximaAcao?: string;
    };
  }>('/api/comercial/leads/:leadId/move', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      return await commercialLeads.moveLeadStatus(request.params.leadId, request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        const statusByCode: Record<string, number> = {
          NOT_FOUND: 404,
          DOR_BLOCKED: 409,
          INVALID_TRANSITION: 409,
          VALIDATION_ERROR: 400,
        };

        reply.status(statusByCode[error.code] || 400);
        return { error: error.code, message: error.message };
      }

      reply.status(500);
      return {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default commercialLeadsRoutes;
