import type { Pool } from 'pg';
import { EvolutionApiService } from '../../services/evolution-api-service';
import { GoogleApiService } from '../../services/google-api-service';
import { CommercialFlowError } from './flow';

export type CommercialDispatchChannel = 'whatsapp' | 'gmail';

export async function resolveDispatchRecipient(
  pool: Pool,
  leadId: string,
  channel: CommercialDispatchChannel,
  explicitRecipient?: string,
): Promise<string> {
  if (explicitRecipient?.trim()) return explicitRecipient.trim();

  const lead = await pool.query(
    'SELECT lead_id, whatsapp, email FROM commercial_leads WHERE lead_id = $1 LIMIT 1',
    [leadId],
  );

  const current = lead.rows[0];
  if (!current) {
    throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado para dispatch.');
  }

  if (channel === 'whatsapp' && current.whatsapp) {
    return String(current.whatsapp);
  }

  if (channel === 'gmail' && current.email) {
    return String(current.email);
  }

  throw new CommercialFlowError(
    'VALIDATION_ERROR',
    `Recipient é obrigatório para dispatch via ${channel}. Cadastre o ${channel === 'gmail' ? 'e-mail' : 'WhatsApp'} do lead.`,
  );
}

export async function buildDispatchVariables(
  pool: Pool,
  leadId: string,
  variables?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const leadRow = await pool.query(
    'SELECT nome_contato, nome_escritorio FROM commercial_leads WHERE lead_id = $1 LIMIT 1',
    [leadId],
  );
  const leadData = leadRow.rows[0];

  return {
    nome: leadData?.nome_contato || leadData?.nome_escritorio || 'Doutor(a)',
    nomeEscritorio: leadData?.nome_escritorio,
    ...variables,
  };
}

export async function sendDispatchToProvider(input: {
  evolutionApi: EvolutionApiService;
  googleApi: GoogleApiService;
  channel: CommercialDispatchChannel;
  templateKey: string;
  recipient: string;
  variables: Record<string, unknown>;
}): Promise<{ provider: string; externalEventId?: string; ack: Record<string, unknown> }> {
  if (input.channel === 'whatsapp') {
    const text = input.evolutionApi.resolveTemplate(input.templateKey, input.variables);
    const result = await input.evolutionApi.sendText(input.recipient, text);
    return {
      provider: 'evolution-api',
      externalEventId: result.messageId,
      ack: { messageId: result.messageId, text },
    };
  }

  if (input.channel === 'gmail') {
    const { subject, html } = input.googleApi.resolveGmailTemplate(input.templateKey, input.variables);
    const result = await input.googleApi.sendEmail(input.recipient, subject, html);
    return {
      provider: 'gmail-api',
      externalEventId: result.messageId,
      ack: { messageId: result.messageId, subject },
    };
  }

  throw new CommercialFlowError('VALIDATION_ERROR', `Canal de dispatch inválido: ${input.channel}`);
}

export async function sendWhatsAppTemplateMessage(input: {
  evolutionApi: EvolutionApiService;
  leadId: string;
  recipient: string;
  templateKey: string;
  variables: Record<string, unknown>;
  ingestIntegrationEvent: (event: {
    leadId: string;
    channel: 'whatsapp';
    eventType: string;
    externalEventId?: string;
    payload: Record<string, unknown>;
  }) => Promise<unknown>;
}): Promise<void> {
  const text = input.evolutionApi.resolveTemplate(input.templateKey, input.variables);
  const result = await input.evolutionApi.sendText(input.recipient, text);

  await input.ingestIntegrationEvent({
    leadId: input.leadId,
    channel: 'whatsapp',
    eventType: `dispatch:diagnostico_agendado:${input.templateKey}`,
    externalEventId: result.messageId,
    payload: {
      recipient: input.recipient,
      templateKey: input.templateKey,
      variables: input.variables,
      provider: 'evolution-api',
      providerAck: { messageId: result.messageId, text },
    },
  });
}
