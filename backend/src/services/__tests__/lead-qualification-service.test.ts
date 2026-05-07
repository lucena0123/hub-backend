import { describe, it, expect } from 'vitest';
import { LeadQualificationService } from '../lead-qualification-service';

describe('LeadQualificationService', () => {
  const service = new LeadQualificationService();

  it('returns quente for high-fit lead', () => {
    const result = service.evaluate({
      statusAtual: 'negociacao',
      areaPrincipal: 'trabalhista',
      qtdAdvogados: 7,
      faturamentoEstimado: 140000,
      orcamentoMarketing: 12000,
      formType: 'briefing',
      consentGiven: true,
      dor01Ok: true,
      dataDiagnostico: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      proximaAcao: 'Follow-up final',
      whatsapp: '+5511999999999',
      email: 'lead@example.com',
    });

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.tier).toBe('quente');
  });

  it('returns frio for low-data lead', () => {
    const result = service.evaluate({
      statusAtual: 'novo_lead',
      areaPrincipal: null,
      qtdAdvogados: null,
      faturamentoEstimado: null,
      orcamentoMarketing: null,
      formType: null,
      consentGiven: false,
      dor01Ok: false,
      whatsapp: null,
      email: null,
    });

    expect(result.score).toBeLessThan(50);
    expect(result.tier).toBe('frio');
  });

  it('keeps score between 0 and 100', () => {
    const result = service.evaluate({
      statusAtual: 'fechado',
      areaPrincipal: 'trabalhista',
      qtdAdvogados: 100,
      faturamentoEstimado: 99999999,
      orcamentoMarketing: 999999,
      formType: 'briefing',
      consentGiven: true,
      dor01Ok: true,
      dataDiagnostico: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      proximaAcao: 'next',
      whatsapp: '+5511999999999',
      email: 'lead@example.com',
    });

    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

