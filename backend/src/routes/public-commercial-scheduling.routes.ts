import { FastifyPluginAsync } from 'fastify';
import { CommercialFlowError } from '../services/commercial-leads-service';

const publicCommercialSchedulingRoutes: FastifyPluginAsync = async (fastify) => {
  const { commercialLeads } = fastify.services;

  fastify.get<{
    Querystring: {
      token?: string;
      leadId?: string;
    };
  }>('/api/public/comercial/scheduling/redirect', async (request, reply) => {
    try {
      if (!request.query.token || !request.query.leadId) {
        reply.status(400);
        return { error: 'VALIDATION_ERROR', message: 'token e leadId são obrigatórios.' };
      }

      const result = await commercialLeads.resolvePublicSchedulingRedirect({
        token: request.query.token,
        leadId: request.query.leadId,
      });

      return reply.redirect(result.url, 302);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        reply.status(error.code === 'NOT_FOUND' ? 404 : 400);
        return { error: error.code, message: error.message, details: error.details };
      }
      reply.status(500);
      return { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  fastify.get<{
    Querystring: {
      token?: string;
      leadId?: string;
      date?: string;
      durationMin?: string;
      timezone?: string;
    };
  }>('/api/public/comercial/scheduling/slots', async (request, reply) => {
    try {
      if (!request.query.token || !request.query.leadId) {
        reply.status(400);
        return { error: 'VALIDATION_ERROR', message: 'token e leadId são obrigatórios.' };
      }

      return await commercialLeads.requestPublicScheduleSlots({
        token: request.query.token,
        leadId: request.query.leadId,
        date: request.query.date,
        durationMin: request.query.durationMin ? Number.parseInt(request.query.durationMin, 10) : undefined,
        timezone: request.query.timezone,
      });
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        reply.status(error.code === 'NOT_FOUND' ? 404 : 400);
        return { error: error.code, message: error.message, details: error.details };
      }
      reply.status(500);
      return { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  fastify.post<{
    Body: {
      leadId: string;
      quickToken: string;
    };
  }>('/api/public/comercial/scheduling/quick-confirm', async (request, reply) => {
    try {
      return await commercialLeads.quickConfirmPublicScheduledMeeting(request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        if (error.code === 'NOT_FOUND') {
          reply.status(404);
        } else if (error.details?.reasonCode === 'SLOT_CONFLICT') {
          reply.status(409);
        } else {
          reply.status(400);
        }
        return { error: error.code, message: error.message, details: error.details };
      }
      reply.status(500);
      return { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  fastify.post<{
    Body: {
      token: string;
      leadId: string;
      slotStart: string;
      slotEnd: string;
      attendeeName?: string;
      attendeeEmail?: string;
      timezone?: string;
    };
  }>('/api/public/comercial/scheduling/confirm', async (request, reply) => {
    try {
      return await commercialLeads.confirmPublicScheduledMeeting(request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        reply.status(error.code === 'NOT_FOUND' ? 404 : 400);
        return { error: error.code, message: error.message, details: error.details };
      }
      reply.status(500);
      return { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  fastify.post<{
    Body: {
      token: string;
      leadId: string;
      eventId?: string;
      slotStart: string;
      slotEnd: string;
      attendeeName?: string;
      attendeeEmail?: string;
      timezone?: string;
    };
  }>('/api/public/comercial/scheduling/update', async (request, reply) => {
    try {
      return await commercialLeads.updatePublicScheduledMeeting(request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        reply.status(error.code === 'NOT_FOUND' ? 404 : 400);
        return { error: error.code, message: error.message, details: error.details };
      }
      reply.status(500);
      return { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  fastify.post<{
    Body: {
      token: string;
      leadId: string;
      eventId?: string;
      reason?: string;
      cancelledBy?: string;
    };
  }>('/api/public/comercial/scheduling/cancel', async (request, reply) => {
    try {
      return await commercialLeads.cancelPublicScheduledMeeting(request.body);
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        reply.status(error.code === 'NOT_FOUND' ? 404 : 400);
        return { error: error.code, message: error.message, details: error.details };
      }
      reply.status(500);
      return { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
};

export default publicCommercialSchedulingRoutes;
