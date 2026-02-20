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
};

export default commercialDispatchRelayRoutes;
