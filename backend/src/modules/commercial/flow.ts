import type { CommercialLeadStatus, MoveLeadStatusInput } from './types';

export class CommercialFlowError extends Error {
  constructor(
    public code: 'INVALID_TRANSITION' | 'DOR_BLOCKED' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'DUPLICATE_LEAD' | 'DELETE_GUARD',
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

const NURTURE_REASONS = [
  'Sem urgência no momento',
  'Aguardando decisão interna',
  'Aguardando retorno do sócio',
  'Momento financeiro inadequado',
  'Contato sem resposta temporária',
] as const;

const LOSS_REASONS = [
  'Sem orçamento',
  'Fechou com concorrente',
  'Sem fit de perfil',
  'Sem retorno após follow-up',
  'Projeto adiado/cancelado',
] as const;

const allowedTransitions: Record<CommercialLeadStatus, CommercialLeadStatus[]> = {
  novo_lead: ['primeiro_contato'],
  primeiro_contato: ['diagnostico_agendado', 'nutricao', 'perdido'],
  diagnostico_agendado: ['diagnostico_concluido', 'nutricao', 'perdido'],
  diagnostico_concluido: ['proposta_enviada', 'nutricao', 'perdido'],
  proposta_enviada: ['negociacao', 'nutricao', 'perdido'],
  negociacao: ['fechado', 'nutricao', 'perdido'],
  fechado: [],
  nutricao: ['primeiro_contato'],
  perdido: [],
};

export function validateLeadTransition(from: CommercialLeadStatus, input: MoveLeadStatusInput): void {
  const { to } = input;

  if (!(allowedTransitions[from] || []).includes(to)) {
    throw new CommercialFlowError(
      'INVALID_TRANSITION',
      `Transição inválida: ${from} -> ${to}`,
    );
  }

  if (to === 'diagnostico_agendado' && !input.dor01Ok) {
    throw new CommercialFlowError('DOR_BLOCKED', 'DoR01 não foi cumprido.');
  }

  if (to === 'diagnostico_concluido' && (!input.observacao || input.observacao.trim().length < 10)) {
    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      'Conclusão do diagnóstico exige evidência (resumo com no mínimo 10 caracteres).',
    );
  }

  if (to === 'proposta_enviada' && !input.dor02Ok) {
    throw new CommercialFlowError('DOR_BLOCKED', 'DoR02 não foi cumprido.');
  }

  if (to === 'fechado' && !input.dor03Ok) {
    throw new CommercialFlowError('DOR_BLOCKED', 'DoR03 não foi cumprido.');
  }

  if (to === 'nutricao' && (!input.motivoNutricao || !input.dataProximaAcao)) {
    throw new CommercialFlowError('VALIDATION_ERROR', 'Nutrição exige motivo e data da próxima ação.');
  }

  if (to === 'nutricao' && input.motivoNutricao && !NURTURE_REASONS.includes(input.motivoNutricao as (typeof NURTURE_REASONS)[number])) {
    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      `Motivo de nutrição inválido. Use um destes: ${NURTURE_REASONS.join(' | ')}`,
    );
  }

  if (to === 'perdido' && !input.motivoPerda) {
    throw new CommercialFlowError('VALIDATION_ERROR', 'Perdido exige motivo da perda.');
  }

  if (to === 'perdido' && input.motivoPerda && !LOSS_REASONS.includes(input.motivoPerda as (typeof LOSS_REASONS)[number])) {
    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      `Motivo de perda inválido. Use um destes: ${LOSS_REASONS.join(' | ')}`,
    );
  }
}
