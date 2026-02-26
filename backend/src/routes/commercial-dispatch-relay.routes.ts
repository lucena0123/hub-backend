import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';

const commercialDispatchRelayRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Params: { channel: 'whatsapp' | 'gmail' };
    Body: {
      leadId?: string;
      channel?: string;
      stage?: string;
      templateKey?: string;
      recipient?: string;
      variables?: Record<string, unknown>;
      sentAt?: string;
    };
  }>('/api/comercial/relay/:channel', async (request, reply) => {
    const relayEnabled = process.env.COMMERCIAL_DISPATCH_TEMP_RELAY_ENABLED === 'true';
    if (!relayEnabled) {
      reply.status(404);
      return { error: 'NOT_ENABLED', message: 'Relay temporário desabilitado.' };
    }

    const requiredSecret = process.env.COMMERCIAL_DISPATCH_RELAY_SECRET;
    if (requiredSecret) {
      const provided = request.headers['x-relay-secret'];
      if (provided !== requiredSecret) {
        reply.status(401);
        return { error: 'UNAUTHORIZED', message: 'Relay secret inválido.' };
      }
    }

    const externalEventId = `relay_${request.params.channel}_${randomUUID()}`;
    fastify.log.info({
      source: 'commercial-dispatch-temp-relay',
      channel: request.params.channel,
      payload: request.body,
      externalEventId,
    }, 'Dispatch capturado pelo relay temporário.');

    return {
      ok: true,
      provider: 'temp-relay',
      externalEventId,
      receivedAt: new Date().toISOString(),
    };
  });

  fastify.post<{
    Body: {
      leadId?: string;
      date?: string;
      durationMin?: number;
      timezone?: string;
    };
  }>('/api/comercial/relay/scheduling/slots', async (request, reply) => {
    const relayEnabled = process.env.COMMERCIAL_SCHEDULING_TEMP_RELAY_ENABLED === 'true';
    if (!relayEnabled) {
      reply.status(404);
      return { error: 'NOT_ENABLED', message: 'Relay temporário de scheduling desabilitado.' };
    }

    const requiredSecret = process.env.COMMERCIAL_SCHEDULING_RELAY_SECRET;
    if (requiredSecret) {
      const provided = request.headers['x-relay-secret'];
      if (provided !== requiredSecret) {
        reply.status(401);
        return { error: 'UNAUTHORIZED', message: 'Relay secret inválido.' };
      }
    }

    const date = typeof request.body?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(request.body.date)
      ? request.body.date
      : new Date().toISOString().slice(0, 10);
    const durationMin = Number.isFinite(request.body?.durationMin) ? Math.max(15, Math.min(180, Number(request.body.durationMin))) : 30;

    const toTime = (hour: number, minute: number) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-03:00`;
    const addMinutes = (hour: number, minute: number, add: number) => {
      const total = (hour * 60) + minute + add;
      const h = Math.floor(total / 60) % 24;
      const m = total % 60;
      return { h, m };
    };
    const buildSlot = (hour: number, minute = 0) => {
      const end = addMinutes(hour, minute, durationMin);
      return {
        start: `${date}T${toTime(hour, minute)}`,
        end: `${date}T${toTime(end.h, end.m)}`,
      };
    };

    const slots = [buildSlot(10), buildSlot(11), buildSlot(14)];

    return {
      ok: true,
      provider: 'temp-scheduling-relay',
      slots,
      receivedAt: new Date().toISOString(),
    };
  });

  fastify.post<{
    Body: {
      leadId?: string;
      slotStart?: string;
      slotEnd?: string;
      attendeeName?: string;
      attendeeEmail?: string;
      timezone?: string;
    };
  }>('/api/comercial/relay/scheduling/confirm', async (request, reply) => {
    const relayEnabled = process.env.COMMERCIAL_SCHEDULING_TEMP_RELAY_ENABLED === 'true';
    if (!relayEnabled) {
      reply.status(404);
      return { error: 'NOT_ENABLED', message: 'Relay temporário de scheduling desabilitado.' };
    }

    const requiredSecret = process.env.COMMERCIAL_SCHEDULING_RELAY_SECRET;
    if (requiredSecret) {
      const provided = request.headers['x-relay-secret'];
      if (provided !== requiredSecret) {
        reply.status(401);
        return { error: 'UNAUTHORIZED', message: 'Relay secret inválido.' };
      }
    }

    const eventId = `relay_cal_${randomUUID()}`;
    return {
      ok: true,
      provider: 'temp-scheduling-relay',
      eventId,
      receivedAt: new Date().toISOString(),
    };
  });

  fastify.post<{
    Body: {
      leadId?: string;
      eventId?: string;
      slotStart?: string;
      slotEnd?: string;
      attendeeName?: string;
      attendeeEmail?: string;
      timezone?: string;
    };
  }>('/api/comercial/relay/scheduling/update', async (request, reply) => {
    const relayEnabled = process.env.COMMERCIAL_SCHEDULING_TEMP_RELAY_ENABLED === 'true';
    if (!relayEnabled) {
      reply.status(404);
      return { error: 'NOT_ENABLED', message: 'Relay temporário de scheduling desabilitado.' };
    }

    const requiredSecret = process.env.COMMERCIAL_SCHEDULING_RELAY_SECRET;
    if (requiredSecret) {
      const provided = request.headers['x-relay-secret'];
      if (provided !== requiredSecret) {
        reply.status(401);
        return { error: 'UNAUTHORIZED', message: 'Relay secret inválido.' };
      }
    }

    const eventId = typeof request.body?.eventId === 'string' && request.body.eventId.trim()
      ? request.body.eventId.trim()
      : `relay_cal_${randomUUID()}`;
    return {
      ok: true,
      provider: 'temp-scheduling-relay',
      eventId,
      receivedAt: new Date().toISOString(),
    };
  });

  fastify.post<{
    Body: {
      leadId?: string;
      eventId?: string;
      reason?: string;
      cancelledBy?: string;
    };
  }>('/api/comercial/relay/scheduling/cancel', async (request, reply) => {
    const relayEnabled = process.env.COMMERCIAL_SCHEDULING_TEMP_RELAY_ENABLED === 'true';
    if (!relayEnabled) {
      reply.status(404);
      return { error: 'NOT_ENABLED', message: 'Relay temporário de scheduling desabilitado.' };
    }

    const requiredSecret = process.env.COMMERCIAL_SCHEDULING_RELAY_SECRET;
    if (requiredSecret) {
      const provided = request.headers['x-relay-secret'];
      if (provided !== requiredSecret) {
        reply.status(401);
        return { error: 'UNAUTHORIZED', message: 'Relay secret inválido.' };
      }
    }

    const eventId = typeof request.body?.eventId === 'string' && request.body.eventId.trim()
      ? request.body.eventId.trim()
      : `relay_cal_${randomUUID()}`;
    return {
      ok: true,
      provider: 'temp-scheduling-relay',
      eventId,
      receivedAt: new Date().toISOString(),
    };
  });
};

export default commercialDispatchRelayRoutes;
