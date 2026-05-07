import type { DispatchCommercialCommunicationInput } from './types';

const DEFAULT_DISPATCH_TEMPLATE_BY_CHANNEL_AND_STAGE: Record<
  DispatchCommercialCommunicationInput['channel'],
  Record<DispatchCommercialCommunicationInput['stage'], string>
> = {
  whatsapp: {
    primeiro_contato: 'wa_lead_qualificado_v1',
    diagnostico_agendado: 'wa_briefing_recebido_agendamento_link_v1',
    proposta_enviada: 'wa_proposta_enviada_followup_v1',
    negociacao: 'wa_negociacao_alinhamento_v1',
    fechado: 'wa_fechado_boas_vindas_v1',
  },
  gmail: {
    primeiro_contato: 'gm_boas_vindas_comercial_v1',
    diagnostico_agendado: 'gm_briefing_recebido_agendamento_link_v1',
    proposta_enviada: 'gm_envio_proposta_v1',
    negociacao: 'gm_negociacao_alinhamento_v1',
    fechado: 'gm_confirmacao_fechamento_v1',
  },
};

export function resolveTemplateByStage(
  channel: DispatchCommercialCommunicationInput['channel'],
  stage: DispatchCommercialCommunicationInput['stage'],
): string {
  const raw = process.env.COMMERCIAL_DISPATCH_TEMPLATE_MAP_JSON;
  if (!raw) return DEFAULT_DISPATCH_TEMPLATE_BY_CHANNEL_AND_STAGE[channel][stage];

  try {
    const parsed = JSON.parse(raw) as (
      Partial<Record<DispatchCommercialCommunicationInput['stage'], string>>
      & Partial<Record<DispatchCommercialCommunicationInput['channel'], Partial<Record<DispatchCommercialCommunicationInput['stage'], string>>>>
    );

    const byChannel = parsed?.[channel]?.[stage]?.trim();
    if (byChannel) return byChannel;

    const flat = parsed?.[stage]?.trim();
    if (flat) return flat;
  } catch {
    // fallback silencioso para default
  }

  return DEFAULT_DISPATCH_TEMPLATE_BY_CHANNEL_AND_STAGE[channel][stage];
}
