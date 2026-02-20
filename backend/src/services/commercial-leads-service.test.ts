import { describe, expect, it } from 'vitest';
import { validateLeadTransition, CommercialFlowError } from './commercial-leads-service';

describe('validateLeadTransition', () => {
  it('should block transition when DoR01 is missing', () => {
    expect(() =>
      validateLeadTransition('primeiro_contato', {
        to: 'diagnostico_agendado',
        dor01Ok: false,
      }),
    ).toThrowError(CommercialFlowError);

    try {
      validateLeadTransition('primeiro_contato', {
        to: 'diagnostico_agendado',
        dor01Ok: false,
      });
    } catch (error) {
      const typed = error as CommercialFlowError;
      expect(typed.code).toBe('DOR_BLOCKED');
    }
  });

  it('should block invalid transitions', () => {
    expect(() =>
      validateLeadTransition('novo_lead', {
        to: 'fechado',
      }),
    ).toThrowError(CommercialFlowError);

    try {
      validateLeadTransition('novo_lead', {
        to: 'fechado',
      });
    } catch (error) {
      const typed = error as CommercialFlowError;
      expect(typed.code).toBe('INVALID_TRANSITION');
    }
  });

  it('should require evidence to conclude diagnostic', () => {
    expect(() =>
      validateLeadTransition('diagnostico_agendado', {
        to: 'diagnostico_concluido',
      }),
    ).toThrowError(CommercialFlowError);

    expect(() =>
      validateLeadTransition('diagnostico_agendado', {
        to: 'diagnostico_concluido',
        observacao: 'Resumo da call com contexto e próximos passos',
      }),
    ).not.toThrow();
  });

  it('should enforce standardized loss/nurture reasons', () => {
    expect(() =>
      validateLeadTransition('proposta_enviada', {
        to: 'perdido',
        motivoPerda: 'Motivo aleatório',
      }),
    ).toThrowError(CommercialFlowError);

    expect(() =>
      validateLeadTransition('proposta_enviada', {
        to: 'perdido',
        motivoPerda: 'Sem orçamento',
      }),
    ).not.toThrow();
  });

  it('should allow valid gated transitions', () => {
    expect(() =>
      validateLeadTransition('primeiro_contato', {
        to: 'diagnostico_agendado',
        dor01Ok: true,
      }),
    ).not.toThrow();

    expect(() =>
      validateLeadTransition('diagnostico_concluido', {
        to: 'proposta_enviada',
        dor02Ok: true,
      }),
    ).not.toThrow();

    expect(() =>
      validateLeadTransition('negociacao', {
        to: 'fechado',
        dor03Ok: true,
      }),
    ).not.toThrow();
  });
});
