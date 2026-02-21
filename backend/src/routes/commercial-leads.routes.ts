import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { CommercialFlowError, CommercialLeadStatus } from '../services/commercial-leads-service';

const commercialLeadsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const { commercialLeads } = fastify.services;

  fastify.get<{
    Querystring: { rangeDays?: string };
  }>('/api/comercial/dashboard', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request) => {
    const parsedRange = request.query.rangeDays ? Number.parseInt(request.query.rangeDays, 10) : undefined;
    return commercialLeads.getDashboard(parsedRange);
  });

  fastify.get<{
    Querystring: { maxAgeHours?: string; limit?: string };
  }>('/api/comercial/alerts', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request) => {
    const maxAgeHours = request.query.maxAgeHours ? Number.parseInt(request.query.maxAgeHours, 10) : 24;
    const limit = request.query.limit ? Number.parseInt(request.query.limit, 10) : 50;
    return commercialLeads.listSlaAlerts(maxAgeHours, limit);
  });

  fastify.get('/api/comercial/daily-summary', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async () => {
    return commercialLeads.getDailySummary();
  });

  fastify.post<{
    Body: {
      leadId: string;
      channel: 'whatsapp' | 'gmail';
      stage: 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado';
      templateKey?: string;
      recipient?: string;
      variables?: Record<string, unknown>;
    };
  }>('/api/comercial/dispatch', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      return await commercialLeads.dispatchStageCommunication(request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        const statusByCode: Record<string, number> = {
          NOT_FOUND: 404,
          DOR_BLOCKED: 409,
          INVALID_TRANSITION: 409,
          DUPLICATE_LEAD: 409,
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

  fastify.post<{
    Body: {
      leadId: string;
      channel: 'whatsapp' | 'gmail' | 'calendar' | 'zapsign' | 'custom';
      eventType: string;
      payload?: Record<string, unknown>;
      externalEventId?: string;
      occurredAt?: string;
    };
  }>('/api/comercial/integrations/events', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      if (!request.body.eventType?.trim()) {
        reply.status(400);
        return { error: 'VALIDATION_ERROR', message: 'eventType é obrigatório.' };
      }

      return await commercialLeads.ingestIntegrationEvent(request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        const statusByCode: Record<string, number> = {
          NOT_FOUND: 404,
          DOR_BLOCKED: 409,
          INVALID_TRANSITION: 409,
          DUPLICATE_LEAD: 409,
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

  fastify.get<{
    Querystring: { limit?: string };
  }>('/api/comercial/followups/due', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request) => {
    const limit = request.query.limit ? Number.parseInt(request.query.limit, 10) : 20;
    return commercialLeads.listFollowupsDue(limit);
  });

  fastify.get<{
    Querystring: { limit?: string };
  }>('/api/comercial/privacy/retention-due', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request) => {
    const limit = request.query.limit ? Number.parseInt(request.query.limit, 10) : 20;
    return commercialLeads.listRetentionDue(limit);
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
      limit?: string;
      offset?: string;
    };
  }>('/api/comercial/leads', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request) => {
    const { status, responsavel, limit, offset } = request.query;
    return commercialLeads.listLeads({
      status,
      responsavel,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined,
    });
  });

  fastify.get<{
    Params: { leadId: string };
    Querystring: { limit?: string };
  }>('/api/comercial/leads/:leadId/timeline', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request) => {
    const limit = request.query.limit ? Number.parseInt(request.query.limit, 10) : 25;
    return commercialLeads.listLeadTimeline(request.params.leadId, limit);
  });

  fastify.get<{
    Params: { leadId: string };
    Querystring: { limit?: string };
  }>('/api/comercial/leads/:leadId/integrations/events', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request) => {
    const limit = request.query.limit ? Number.parseInt(request.query.limit, 10) : 25;
    const events = await commercialLeads.listIntegrationEvents(request.params.leadId, limit);
    return { events };
  });

  fastify.get<{
    Params: { leadId: string };
    Querystring: { formType?: 'briefing' | 'onboarding' | 'custom' };
  }>('/api/comercial/leads/:leadId/forms/link', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      const formType = request.query.formType || 'briefing';
      return await commercialLeads.getLeadFormLink(request.params.leadId, formType);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        const statusByCode: Record<string, number> = {
          NOT_FOUND: 404,
          DOR_BLOCKED: 409,
          INVALID_TRANSITION: 409,
          DUPLICATE_LEAD: 409,
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

  fastify.post<{
    Params: { leadId: string };
    Body: {
      formType: 'briefing' | 'onboarding' | 'custom';
      payload: Record<string, unknown>;
      submittedAt?: string;
    };
  }>('/api/comercial/leads/:leadId/forms/submit', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      return await commercialLeads.submitLeadForm(request.params.leadId, request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        const statusByCode: Record<string, number> = {
          NOT_FOUND: 404,
          DOR_BLOCKED: 409,
          INVALID_TRANSITION: 409,
          DUPLICATE_LEAD: 409,
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

  fastify.post<{
    Params: { leadId: string };
    Body: {
      contractStatus?: 'pendente' | 'assinado';
      paymentStatus?: 'pendente' | 'pago';
      observacao?: string;
    };
  }>('/api/comercial/leads/:leadId/proofs', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      return await commercialLeads.updateLeadProofs(request.params.leadId, request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        const statusByCode: Record<string, number> = {
          NOT_FOUND: 404,
          DOR_BLOCKED: 409,
          INVALID_TRANSITION: 409,
          DUPLICATE_LEAD: 409,
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

  fastify.post<{
    Params: { leadId: string };
    Body: {
      d0Ok?: boolean;
      d1Ok?: boolean;
      d2Ok?: boolean;
      d3D4Ok?: boolean;
      d5D7Ok?: boolean;
      observacao?: string;
    };
  }>('/api/comercial/leads/:leadId/onboarding', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      return await commercialLeads.updateLeadOnboarding(request.params.leadId, request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        const statusByCode: Record<string, number> = {
          NOT_FOUND: 404,
          DOR_BLOCKED: 409,
          INVALID_TRANSITION: 409,
          DUPLICATE_LEAD: 409,
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

  fastify.post<{
    Params: { leadId: string };
    Body: {
      consentGiven?: boolean;
      retentionUntil?: string;
      observacao?: string;
    };
  }>('/api/comercial/leads/:leadId/privacy', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      return await commercialLeads.updateLeadPrivacy(request.params.leadId, request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        const statusByCode: Record<string, number> = {
          NOT_FOUND: 404,
          DOR_BLOCKED: 409,
          INVALID_TRANSITION: 409,
          DUPLICATE_LEAD: 409,
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
      const role = request.user?.role;
      if (request.body.to === 'fechado' && role !== 'admin' && role !== 'manager') {
        reply.status(403);
        return { error: 'Forbidden', message: 'Apenas admin/manager podem fechar leads.' };
      }

      return await commercialLeads.moveLeadStatus(request.params.leadId, request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        const statusByCode: Record<string, number> = {
          NOT_FOUND: 404,
          DOR_BLOCKED: 409,
          INVALID_TRANSITION: 409,
          DUPLICATE_LEAD: 409,
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

