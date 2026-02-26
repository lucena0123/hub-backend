/**
 * Unit tests — CommercialLeadsService
 *
 * Pool is fully mocked: no database connection needed.
 * createAuditLog is mocked to stay silent.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Pool, PoolClient } from 'pg';

vi.mock('../../middleware/audit', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import {
  CommercialLeadsService,
  CommercialFlowError,
  validateLeadTransition,
} from '../commercial-leads-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal row returned by SELECT * FROM commercial_leads */
function makeLeadRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    lead_id: 'lead-uuid-001',
    data_entrada: '2026-02-26T00:00:00.000Z',
    origem: 'instagram',
    nome_escritorio: 'Escritório Exemplo Ltda',
    instagram: null,
    whatsapp: '+5511999990001',
    cidade: 'São Paulo',
    area_principal: 'trabalhista',
    status_atual: 'novo_lead',
    responsavel: 'Ana Souza',
    proxima_acao: null,
    data_proxima_acao: null,
    motivo_nutricao: null,
    motivo_perda: null,
    dor01_ok: false,
    dor02_ok: false,
    dor03_ok: false,
    form_token: 'token-xyz',
    form_type: null,
    form_submitted_at: null,
    form_payload_json: null,
    contract_status: 'pendente',
    payment_status: 'pendente',
    followup_d2_at: null,
    followup_d5_at: null,
    onboarding_d0_ok: false,
    onboarding_d1_ok: false,
    onboarding_d2_ok: false,
    onboarding_d3_d4_ok: false,
    onboarding_d5_d7_ok: false,
    consent_given: false,
    consent_given_at: null,
    retention_until: null,
    created_at: '2026-02-26T00:00:00.000Z',
    updated_at: '2026-02-26T00:00:00.000Z',
    ...overrides,
  };
}

function makePool(...queryResponses: Array<{ rowCount?: number; rows: unknown[] }>): Pool {
  const mockQuery = vi.fn();
  queryResponses.forEach((res) => {
    mockQuery.mockResolvedValueOnce(res);
  });
  // Default fallback: empty result
  mockQuery.mockResolvedValue({ rowCount: 0, rows: [] });
  return { query: mockQuery } as unknown as Pool;
}

// ---------------------------------------------------------------------------
// validateLeadTransition — pure function, no mocks needed
// ---------------------------------------------------------------------------

describe('validateLeadTransition', () => {
  it('allows novo_lead → primeiro_contato', () => {
    expect(() =>
      validateLeadTransition('novo_lead', { to: 'primeiro_contato' }),
    ).not.toThrow();
  });

  it('throws INVALID_TRANSITION for disallowed jump (novo_lead → fechado)', () => {
    expect(() =>
      validateLeadTransition('novo_lead', { to: 'fechado' }),
    ).toThrow(CommercialFlowError);

    try {
      validateLeadTransition('novo_lead', { to: 'fechado' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('INVALID_TRANSITION');
    }
  });

  it('throws INVALID_TRANSITION from terminal state fechado', () => {
    expect(() =>
      validateLeadTransition('fechado', { to: 'primeiro_contato' }),
    ).toThrow(CommercialFlowError);
  });

  it('throws DOR_BLOCKED when dor01Ok is false on → diagnostico_agendado', () => {
    expect(() =>
      validateLeadTransition('primeiro_contato', { to: 'diagnostico_agendado', dor01Ok: false }),
    ).toThrow(CommercialFlowError);

    try {
      validateLeadTransition('primeiro_contato', { to: 'diagnostico_agendado', dor01Ok: false });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('DOR_BLOCKED');
    }
  });

  it('passes when dor01Ok is true on → diagnostico_agendado', () => {
    expect(() =>
      validateLeadTransition('primeiro_contato', { to: 'diagnostico_agendado', dor01Ok: true }),
    ).not.toThrow();
  });

  it('throws DOR_BLOCKED when dor02Ok is false on → proposta_enviada', () => {
    try {
      validateLeadTransition('diagnostico_concluido', {
        to: 'proposta_enviada',
        dor02Ok: false,
        observacao: 'diagnóstico detalhado ok',
      });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('DOR_BLOCKED');
    }
  });

  it('throws DOR_BLOCKED when dor03Ok is false on → fechado', () => {
    try {
      validateLeadTransition('negociacao', { to: 'fechado', dor03Ok: false });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('DOR_BLOCKED');
    }
  });

  it('throws VALIDATION_ERROR for diagnostico_concluido without observacao', () => {
    try {
      validateLeadTransition('diagnostico_agendado', { to: 'diagnostico_concluido' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('throws VALIDATION_ERROR for diagnostico_concluido with short observacao', () => {
    try {
      validateLeadTransition('diagnostico_agendado', { to: 'diagnostico_concluido', observacao: 'curta' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('allows diagnostico_concluido with valid observacao', () => {
    expect(() =>
      validateLeadTransition('diagnostico_agendado', {
        to: 'diagnostico_concluido',
        observacao: 'Escritório com demanda real e equipe de 5 advogados trabalhistas',
      }),
    ).not.toThrow();
  });

  it('throws VALIDATION_ERROR for nutricao without motivoNutricao', () => {
    try {
      validateLeadTransition('primeiro_contato', {
        to: 'nutricao',
        dataProximaAcao: '2026-03-15T00:00:00.000Z',
      });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('throws VALIDATION_ERROR for nutricao with invalid motivoNutricao', () => {
    try {
      validateLeadTransition('primeiro_contato', {
        to: 'nutricao',
        motivoNutricao: 'Motivo inválido qualquer',
        dataProximaAcao: '2026-03-15T00:00:00.000Z',
      });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('allows nutricao with valid reason and dataProximaAcao', () => {
    expect(() =>
      validateLeadTransition('primeiro_contato', {
        to: 'nutricao',
        motivoNutricao: 'Sem urgência no momento',
        dataProximaAcao: '2026-03-15T00:00:00.000Z',
      }),
    ).not.toThrow();
  });

  it('throws VALIDATION_ERROR for perdido without motivoPerda', () => {
    try {
      validateLeadTransition('primeiro_contato', { to: 'perdido' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('throws VALIDATION_ERROR for perdido with invalid motivoPerda', () => {
    try {
      validateLeadTransition('primeiro_contato', { to: 'perdido', motivoPerda: 'Não quis' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('allows perdido with valid motivoPerda', () => {
    expect(() =>
      validateLeadTransition('primeiro_contato', { to: 'perdido', motivoPerda: 'Sem orçamento' }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// CommercialLeadsService.createLead
// ---------------------------------------------------------------------------

describe('CommercialLeadsService.createLead', () => {
  it('creates a lead and returns mapped record', async () => {
    const leadRow = makeLeadRow();
    const pool = makePool(
      { rowCount: 0, rows: [] },          // dedupe check → no match
      { rowCount: 1, rows: [leadRow] },   // INSERT RETURNING *
    );
    const svc = new CommercialLeadsService(pool);

    const result = await svc.createLead({
      origem: 'instagram',
      nomeEscritorio: 'Escritório Exemplo Ltda',
      responsavel: 'Ana Souza',
      whatsapp: '+5511999990001',
    });

    expect(result.leadId).toBe('lead-uuid-001');
    expect(result.statusAtual).toBe('novo_lead');
    expect(result.nomeEscritorio).toBe('Escritório Exemplo Ltda');
  });

  it('throws DUPLICATE_LEAD when same whatsapp+escritório already in-progress', async () => {
    const pool = makePool(
      { rowCount: 1, rows: [{ lead_id: 'existing-id' }] }, // dedupe check → found
    );
    const svc = new CommercialLeadsService(pool);

    await expect(
      svc.createLead({
        origem: 'instagram',
        nomeEscritorio: 'Escritório Duplicado',
        responsavel: 'Carlos',
        whatsapp: '+5511999990001',
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_LEAD' });
  });

  it('throws DUPLICATE_LEAD on PG unique constraint violation (code 23505)', async () => {
    // Input has whatsapp → dedupe SELECT runs first (returns empty), then INSERT rejects with 23505
    const mockQuery = vi.fn()
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })      // dedupe ok
      .mockRejectedValueOnce(Object.assign(new Error('unique violation'), { code: '23505' }));

    const pool = { query: mockQuery } as unknown as Pool;
    const svc = new CommercialLeadsService(pool);

    await expect(
      svc.createLead({
        origem: 'site',
        nomeEscritorio: 'Escritório X',
        responsavel: 'Luís',
        whatsapp: '+5511999990002',
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_LEAD' });
  });

  it('creates lead without whatsapp (skips dedupe query)', async () => {
    const leadRow = makeLeadRow({ whatsapp: null });
    const pool = makePool(
      { rowCount: 1, rows: [leadRow] },  // only INSERT (no dedupe query)
    );
    const svc = new CommercialLeadsService(pool);

    const result = await svc.createLead({
      origem: 'indicacao',
      nomeEscritorio: 'Escritório Sem WA',
      responsavel: 'Pedro',
    });

    expect(result.leadId).toBe('lead-uuid-001');
  });
});

// ---------------------------------------------------------------------------
// CommercialLeadsService.getLead
// ---------------------------------------------------------------------------

describe('CommercialLeadsService.getLead', () => {
  it('returns lead when found', async () => {
    const leadRow = makeLeadRow({ status_atual: 'primeiro_contato' });
    const pool = makePool({ rowCount: 1, rows: [leadRow] });
    const svc = new CommercialLeadsService(pool);

    const result = await svc.getLead('lead-uuid-001');
    expect(result.leadId).toBe('lead-uuid-001');
    expect(result.statusAtual).toBe('primeiro_contato');
  });

  it('throws NOT_FOUND when lead does not exist', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool);

    try {
      await svc.getLead('non-existent-id');
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('NOT_FOUND');
    }
  });
});

// ---------------------------------------------------------------------------
// CommercialLeadsService.moveLeadStatus
// ---------------------------------------------------------------------------

describe('CommercialLeadsService.moveLeadStatus', () => {
  it('transitions novo_lead → primeiro_contato successfully', async () => {
    const existingRow = makeLeadRow({ status_atual: 'novo_lead' });
    const updatedRow = makeLeadRow({ status_atual: 'primeiro_contato' });

    const pool = makePool(
      { rowCount: 1, rows: [existingRow] },  // SELECT existing
      { rowCount: 1, rows: [updatedRow] },   // UPDATE RETURNING
      { rowCount: 1, rows: [] },             // INSERT transition
    );
    const svc = new CommercialLeadsService(pool);

    const result = await svc.moveLeadStatus('lead-uuid-001', { to: 'primeiro_contato' });
    expect(result.statusAtual).toBe('primeiro_contato');
  });

  it('transitions primeiro_contato → diagnostico_agendado with dor01Ok', async () => {
    const existingRow = makeLeadRow({ status_atual: 'primeiro_contato' });
    const updatedRow = makeLeadRow({ status_atual: 'diagnostico_agendado', dor01_ok: true });

    const pool = makePool(
      { rowCount: 1, rows: [existingRow] },
      { rowCount: 1, rows: [updatedRow] },
      { rowCount: 1, rows: [] },
    );
    const svc = new CommercialLeadsService(pool);

    const result = await svc.moveLeadStatus('lead-uuid-001', {
      to: 'diagnostico_agendado',
      dor01Ok: true,
    });
    expect(result.statusAtual).toBe('diagnostico_agendado');
  });

  it('throws DOR_BLOCKED when dor01Ok is missing on → diagnostico_agendado', async () => {
    const existingRow = makeLeadRow({ status_atual: 'primeiro_contato' });
    const pool = makePool({ rowCount: 1, rows: [existingRow] });
    const svc = new CommercialLeadsService(pool);

    try {
      await svc.moveLeadStatus('lead-uuid-001', {
        to: 'diagnostico_agendado',
        dor01Ok: false,
      });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('DOR_BLOCKED');
    }
  });

  it('throws INVALID_TRANSITION for disallowed move (novo_lead → negociacao)', async () => {
    const existingRow = makeLeadRow({ status_atual: 'novo_lead' });
    const pool = makePool({ rowCount: 1, rows: [existingRow] });
    const svc = new CommercialLeadsService(pool);

    try {
      await svc.moveLeadStatus('lead-uuid-001', { to: 'negociacao' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('INVALID_TRANSITION');
    }
  });

  it('throws NOT_FOUND when lead does not exist', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool);

    try {
      await svc.moveLeadStatus('ghost-id', { to: 'primeiro_contato' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('NOT_FOUND');
    }
  });

  it('throws VALIDATION_ERROR when moving to fechado without assinatura+pagamento', async () => {
    const existingRow = makeLeadRow({
      status_atual: 'negociacao',
      contract_status: 'pendente',
      payment_status: 'pendente',
    });
    const pool = makePool({ rowCount: 1, rows: [existingRow] });
    const svc = new CommercialLeadsService(pool);

    try {
      await svc.moveLeadStatus('lead-uuid-001', { to: 'fechado', dor03Ok: true });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('VALIDATION_ERROR');
      expect((e as CommercialFlowError).message).toMatch(/assinatura/i);
    }
  });

  it('moves nutricao → primeiro_contato (re-entry)', async () => {
    const existingRow = makeLeadRow({ status_atual: 'nutricao' });
    const updatedRow = makeLeadRow({ status_atual: 'primeiro_contato' });

    const pool = makePool(
      { rowCount: 1, rows: [existingRow] },
      { rowCount: 1, rows: [updatedRow] },
      { rowCount: 1, rows: [] },
    );
    const svc = new CommercialLeadsService(pool);

    const result = await svc.moveLeadStatus('lead-uuid-001', { to: 'primeiro_contato' });
    expect(result.statusAtual).toBe('primeiro_contato');
  });
});

// ---------------------------------------------------------------------------
// CommercialLeadsService.updateLeadProofs
// ---------------------------------------------------------------------------

describe('CommercialLeadsService.updateLeadProofs', () => {
  it('updates contractStatus to assinado', async () => {
    const existingRow = makeLeadRow({ contract_status: 'pendente', payment_status: 'pendente' });
    const updatedRow = makeLeadRow({ contract_status: 'assinado', payment_status: 'pendente' });

    const pool = makePool(
      { rowCount: 1, rows: [existingRow] },  // SELECT
      { rowCount: 1, rows: [updatedRow] },   // UPDATE
      { rowCount: 1, rows: [] },             // INSERT transition
    );
    const svc = new CommercialLeadsService(pool);

    const result = await svc.updateLeadProofs('lead-uuid-001', { contractStatus: 'assinado' });
    expect(result.contractStatus).toBe('assinado');
    expect(result.paymentStatus).toBe('pendente');
  });

  it('updates both contractStatus and paymentStatus', async () => {
    const existingRow = makeLeadRow({ contract_status: 'assinado', payment_status: 'pendente' });
    const updatedRow = makeLeadRow({ contract_status: 'assinado', payment_status: 'pago' });

    const pool = makePool(
      { rowCount: 1, rows: [existingRow] },
      { rowCount: 1, rows: [updatedRow] },
      { rowCount: 1, rows: [] },
    );
    const svc = new CommercialLeadsService(pool);

    const result = await svc.updateLeadProofs('lead-uuid-001', {
      contractStatus: 'assinado',
      paymentStatus: 'pago',
    });
    expect(result.paymentStatus).toBe('pago');
  });

  it('throws NOT_FOUND when lead does not exist', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool);

    try {
      await svc.updateLeadProofs('ghost-id', { contractStatus: 'assinado' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('NOT_FOUND');
    }
  });
});

// ---------------------------------------------------------------------------
// CommercialLeadsService.updateLeadPrivacy
// ---------------------------------------------------------------------------

describe('CommercialLeadsService.updateLeadPrivacy', () => {
  it('sets consentGiven and stamps consentGivenAt', async () => {
    const existingRow = makeLeadRow({ consent_given: false, consent_given_at: null });
    const updatedRow = makeLeadRow({ consent_given: true, consent_given_at: new Date().toISOString() });

    const pool = makePool(
      { rowCount: 1, rows: [existingRow] },
      { rowCount: 1, rows: [updatedRow] },
      { rowCount: 1, rows: [] },
    );
    const svc = new CommercialLeadsService(pool);

    const result = await svc.updateLeadPrivacy('lead-uuid-001', { consentGiven: true });
    expect(result.consentGiven).toBe(true);
  });

  it('throws NOT_FOUND for missing lead', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool);

    try {
      await svc.updateLeadPrivacy('ghost-id', { consentGiven: true });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('NOT_FOUND');
    }
  });
});

// ---------------------------------------------------------------------------
// CommercialLeadsService.deleteLeadPermanently
// ---------------------------------------------------------------------------

describe('CommercialLeadsService.deleteLeadPermanently', () => {
  it('throws DELETE_GUARD when confirmText is wrong', async () => {
    const pool = makePool();
    const svc = new CommercialLeadsService(pool);

    try {
      await svc.deleteLeadPermanently('lead-uuid-001', { confirmText: 'delete' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('DELETE_GUARD');
    }
  });

  it('throws NOT_FOUND when confirmText is correct but lead missing', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool);

    try {
      await svc.deleteLeadPermanently('ghost-id', { confirmText: 'EXCLUIR' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('NOT_FOUND');
    }
  });
});
