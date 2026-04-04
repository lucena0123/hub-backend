import { FastifyPluginAsync } from 'fastify';
import { CommercialFlowError, ProcessWhatsAppSchedulingReplyInput } from '../services/commercial-leads-service';

function getNested(record: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = record;
  for (const segment of path) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function resolveInboundPayload(raw: Record<string, unknown>): ProcessWhatsAppSchedulingReplyInput {
  const providerMessageId = asString(raw.providerMessageId)
    || asString(raw.messageId)
    || asString(getNested(raw, ['data', 'key', 'id']))
    || asString(getNested(raw, ['key', 'id']));

  const from = asString(raw.from)
    || asString(raw.sender)
    || asString(getNested(raw, ['data', 'key', 'remoteJid']))
    || asString(getNested(raw, ['key', 'remoteJid']));

  const text = asString(raw.text)
    || asString(getNested(raw, ['data', 'message', 'conversation']))
    || asString(getNested(raw, ['message', 'conversation']))
    || asString(getNested(raw, ['data', 'message', 'extendedTextMessage', 'text']))
    || asString(getNested(raw, ['message', 'extendedTextMessage', 'text']));

  const buttonPayload = asString(raw.buttonPayload)
    || asString(getNested(raw, ['data', 'message', 'buttonsResponseMessage', 'selectedButtonId']))
    || asString(getNested(raw, ['message', 'buttonsResponseMessage', 'selectedButtonId']))
    || asString(getNested(raw, ['data', 'message', 'templateButtonReplyMessage', 'selectedId']))
    || asString(getNested(raw, ['message', 'templateButtonReplyMessage', 'selectedId']))
    || asString(getNested(raw, ['data', 'message', 'interactiveResponseMessage', 'nativeFlowResponseMessage', 'paramsJson']))
    || asString(getNested(raw, ['message', 'interactiveResponseMessage', 'nativeFlowResponseMessage', 'paramsJson']));

  const quotedMessageId = asString(raw.quotedMessageId)
    || asString(getNested(raw, ['data', 'message', 'contextInfo', 'stanzaId']))
    || asString(getNested(raw, ['message', 'contextInfo', 'stanzaId']))
    || asString(getNested(raw, ['data', 'message', 'buttonsResponseMessage', 'contextInfo', 'stanzaId']))
    || asString(getNested(raw, ['message', 'buttonsResponseMessage', 'contextInfo', 'stanzaId']));

  const timestamp = asString(raw.timestamp)
    || asString(getNested(raw, ['data', 'messageTimestamp']));

  return {
    providerMessageId,
    from,
    text,
    buttonPayload,
    quotedMessageId,
    timestamp,
    raw,
  };
}

const publicWhatsAppWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  const { commercialLeads } = fastify.services;

  fastify.post<{ Body: Record<string, unknown> }>('/api/public/webhooks/evolution/whatsapp', async (request, reply) => {
    const requiredSecret = process.env.EVOLUTION_WEBHOOK_SECRET;
    if (requiredSecret) {
      const providedSecret = request.headers['x-webhook-secret']
        || request.headers['x-evolution-secret']
        || request.headers.authorization;
      const normalized = Array.isArray(providedSecret) ? providedSecret[0] : providedSecret;
      if (typeof normalized !== 'string' || normalized.replace(/^Bearer\s+/i, '') !== requiredSecret) {
        reply.status(401);
        return { error: 'UNAUTHORIZED', message: 'Webhook secret inválido.' };
      }
    }

    const body = request.body || {};
    const payload = resolveInboundPayload(body);

    try {
      const result = await commercialLeads.processWhatsAppSchedulingReply(payload);
      return result;
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

export default publicWhatsAppWebhookRoutes;
