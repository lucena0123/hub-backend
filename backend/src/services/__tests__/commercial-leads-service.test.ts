/**
 * Unit tests — CommercialLeadsService
 *
 * Pool is fully mocked: no database connection needed.
 * createAuditLog is mocked to stay silent.
 */

import { vi, describe, it, expect } from 'vitest';
import type { Pool } from 'pg';

vi.mock('../../middleware/audit', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import {
  CommercialLeadsService,
  CommercialFlowError,
  validateLeadTransition,
} from '../commercial-leads-service';
import type { EvolutionApiService } from '../evolution-api-service';
import type { GoogleApiService } from '../google-api-service';

// Stub API services — not called by the unit-tested methods (createLead, getLead, etc.)
const stubEvolutionApi = {
  resolveTemplate: vi.fn().mockReturnValue('test message'),
  sendText: vi.fn().mockResolvedValue({ messageId: 'wa_test_001' }),
  sendInteractiveButtons: vi.fn().mockResolvedValue({ messageId: 'wa_interactive_test_001' }),
  getInstanceIntegrationType: vi.fn().mockResolvedValue('WHATSAPP-BAILEYS'),
} as unknown as EvolutionApiService;

const stubGoogleApi = {
  resolveGmailTemplate: vi.fn().mockReturnValue({ subject: 'test', html: '<p>test</p>' }),
  sendEmail: vi.fn().mockResolvedValue({ messageId: 'gm_test_001' }),
  getFreeBusy: vi.fn().mockResolvedValue([]),
  getFreeBusyForCalendar: vi.fn().mockResolvedValue([]),
  createEvent: vi.fn().mockResolvedValue({ eventId: 'cal_test_001' }),
  updateEvent: vi.fn().mockResolvedValue({ eventId: 'cal_test_001' }),
  deleteEvent: vi.fn().mockResolvedValue(undefined),
} as unknown as GoogleApiService;

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    const result = await svc.getLead('lead-uuid-001');
    expect(result.leadId).toBe('lead-uuid-001');
    expect(result.statusAtual).toBe('primeiro_contato');
  });

  it('throws NOT_FOUND when lead does not exist', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    const result = await svc.moveLeadStatus('lead-uuid-001', { to: 'primeiro_contato' });
    expect(result.statusAtual).toBe('primeiro_contato');
  });

  it('transitions primeiro_contato → diagnostico_agendado with dor01Ok', async () => {
    const existingRow = makeLeadRow({
      status_atual: 'primeiro_contato',
      cal_event_id: 'cal_001',
      cal_meet_url: 'https://meet.google.com/abc-defg-hij',
    });
    const updatedRow = makeLeadRow({ status_atual: 'diagnostico_agendado', dor01_ok: true });

    const pool = makePool(
      { rowCount: 1, rows: [existingRow] },
      { rowCount: 1, rows: [updatedRow] },
      { rowCount: 1, rows: [] },
    );
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    const result = await svc.moveLeadStatus('lead-uuid-001', {
      to: 'diagnostico_agendado',
      dor01Ok: true,
    });
    expect(result.statusAtual).toBe('diagnostico_agendado');
  });

  it('throws VALIDATION_ERROR when diagnostico_agendado has no calendar event', async () => {
    const existingRow = makeLeadRow({ status_atual: 'primeiro_contato', cal_event_id: null });
    const pool = makePool({ rowCount: 1, rows: [existingRow] });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    await expect(
      svc.moveLeadStatus('lead-uuid-001', { to: 'diagnostico_agendado', dor01Ok: true }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { reasonCode: 'MISSING_CALENDAR_EVENT' },
    });
  });

  it('throws VALIDATION_ERROR when diagnostico_agendado has no meet link', async () => {
    const existingRow = makeLeadRow({
      status_atual: 'primeiro_contato',
      cal_event_id: 'cal_001',
      cal_meet_url: null,
    });
    const pool = makePool({ rowCount: 1, rows: [existingRow] });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    await expect(
      svc.moveLeadStatus('lead-uuid-001', { to: 'diagnostico_agendado', dor01Ok: true }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { reasonCode: 'MISSING_MEET_LINK' },
    });
  });

  it('throws DOR_BLOCKED when dor01Ok is missing on → diagnostico_agendado', async () => {
    const existingRow = makeLeadRow({ status_atual: 'primeiro_contato' });
    const pool = makePool({ rowCount: 1, rows: [existingRow] });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    try {
      await svc.moveLeadStatus('lead-uuid-001', { to: 'negociacao' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('INVALID_TRANSITION');
    }
  });

  it('throws NOT_FOUND when lead does not exist', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    const result = await svc.updateLeadProofs('lead-uuid-001', {
      contractStatus: 'assinado',
      paymentStatus: 'pago',
    });
    expect(result.paymentStatus).toBe('pago');
  });

  it('throws NOT_FOUND when lead does not exist', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

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
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    const result = await svc.updateLeadPrivacy('lead-uuid-001', { consentGiven: true });
    expect(result.consentGiven).toBe(true);
  });

  it('throws NOT_FOUND for missing lead', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    try {
      await svc.updateLeadPrivacy('ghost-id', { consentGiven: true });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('NOT_FOUND');
    }
  });
});

describe('CommercialLeadsService.submitLeadForm', () => {
  it('auto-dispatches scheduling invite on first briefing submission when hybrid flag is enabled', async () => {
    const prevHybrid = process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED;
    const prevPublic = process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED;
    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = 'true';
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = 'true';

    const existingRow = makeLeadRow({
      form_type: null,
      form_submitted_at: null,
      timezone: 'America/Sao_Paulo',
    });
    const updatedRow = makeLeadRow({
      form_type: 'briefing',
      form_submitted_at: new Date().toISOString(),
    });

    const pool = makePool(
      { rowCount: 1, rows: [existingRow] },
      { rowCount: 1, rows: [updatedRow] },
      { rowCount: 1, rows: [] },
    );

    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);
    vi.spyOn(svc, 'ingestIntegrationEvent').mockResolvedValue({
      ok: true,
      eventId: 'evt-briefing-001',
      leadId: 'lead-uuid-001',
    });
    const inviteSpy = vi.spyOn(svc, 'createHybridSchedulingInvite').mockResolvedValue({
      inviteId: 'invite-001',
      leadId: 'lead-uuid-001',
      calendarUrl: 'https://hub.dev/forms/comercial/scheduling?token=t1&leadId=lead-uuid-001',
      suggestedSlots: [],
      channelsSent: ['whatsapp', 'gmail'],
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await svc.submitLeadForm('lead-uuid-001', {
      formType: 'briefing',
      payload: { source: 'public_form' },
    });

    expect(inviteSpy).toHaveBeenCalledWith('lead-uuid-001', expect.objectContaining({
      timezone: 'America/Sao_Paulo',
    }));

    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = prevHybrid;
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = prevPublic;
  });
});

// ---------------------------------------------------------------------------
// CommercialLeadsService.deleteLeadPermanently
// ---------------------------------------------------------------------------

describe('CommercialLeadsService.deleteLeadPermanently', () => {
  it('throws DELETE_GUARD when confirmText is wrong', async () => {
    const pool = makePool();
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    try {
      await svc.deleteLeadPermanently('lead-uuid-001', { confirmText: 'delete' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('DELETE_GUARD');
    }
  });

  it('throws NOT_FOUND when confirmText is correct but lead missing', async () => {
    const pool = makePool({ rowCount: 0, rows: [] });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    try {
      await svc.deleteLeadPermanently('ghost-id', { confirmText: 'EXCLUIR' });
    } catch (e) {
      expect((e as CommercialFlowError).code).toBe('NOT_FOUND');
    }
  });
});

describe('CommercialLeadsService.message context', () => {
  it('uses gmail followup template when channel is gmail', async () => {
    const pool = makePool(
      {
        rowCount: 1,
        rows: [{
          lead_id: 'lead-uuid-001',
          nome_escritorio: 'Escritório Exemplo Ltda',
          status_atual: 'proposta_enviada',
          followup_d2_at: new Date(Date.now() - 60_000).toISOString(),
          followup_d5_at: null,
        }],
      },
      { rowCount: 0, rows: [] },
    );
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);
    const dispatchSpy = vi.spyOn(svc, 'dispatchStageCommunication').mockResolvedValue({
      ok: true,
      leadId: 'lead-uuid-001',
      channel: 'gmail',
      stage: 'proposta_enviada',
      eventId: 'evt-001',
    });
    vi.spyOn(svc, 'ingestIntegrationEvent').mockResolvedValue({ ok: true, eventId: 'evt-002', leadId: 'lead-uuid-001' });

    await svc.triggerFollowupDispatch({
      leadId: 'lead-uuid-001',
      followupType: 'D+2',
      channel: 'gmail',
    });

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'gmail',
      stage: 'proposta_enviada',
      templateKey: 'gm_proposta_enviada_followup_v1',
    }));
  });

  it('blocks scheduling invite without briefing and returns BRIEFING_REQUIRED', async () => {
    const prevHybrid = process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED;
    const prevPublic = process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED;
    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = 'true';
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = 'true';

    const pool = makePool({
      rowCount: 1,
      rows: [makeLeadRow({ form_type: null, email: 'lead@exemplo.com' })],
    });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);
    const ingestSpy = vi.spyOn(svc, 'ingestIntegrationEvent').mockResolvedValue({
      ok: true,
      eventId: 'evt-ctx-001',
      leadId: 'lead-uuid-001',
    });

    await expect(svc.createHybridSchedulingInvite('lead-uuid-001')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { reasonCode: 'BRIEFING_REQUIRED' },
    });

    expect(ingestSpy).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'dispatch:context_blocked',
    }));

    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = prevHybrid;
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = prevPublic;
  });

  it('uses link template when quick confirm is disabled', async () => {
    const prevHybrid = process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED;
    const prevPublic = process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED;
    const prevQuick = process.env.COMMERCIAL_SCHEDULING_QUICK_CONFIRM_ENABLED;
    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = 'true';
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = 'true';
    process.env.COMMERCIAL_SCHEDULING_QUICK_CONFIRM_ENABLED = 'false';

    const pool = makePool(
      { rowCount: 1, rows: [makeLeadRow({ form_type: 'briefing', email: 'lead@exemplo.com' })] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [] },
    );
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    vi.spyOn(svc, 'createSchedulingLink').mockResolvedValue({
      leadId: 'lead-uuid-001',
      token: 'tok_001',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://hub.dev/forms/comercial/scheduling?token=tok_001&leadId=lead-uuid-001',
    });
    vi.spyOn(svc as any, 'collectSuggestedSlots').mockResolvedValue([
      { start: '2026-03-01T10:00:00.000Z', end: '2026-03-01T10:30:00.000Z' },
    ]);

    const dispatchSpy = vi.spyOn(svc, 'dispatchStageCommunication').mockResolvedValue({
      ok: true,
      leadId: 'lead-uuid-001',
      channel: 'whatsapp',
      stage: 'diagnostico_agendado',
      eventId: 'evt-ds-001',
    });
    vi.spyOn(svc, 'ingestIntegrationEvent').mockResolvedValue({
      ok: true,
      eventId: 'evt-invite-001',
      leadId: 'lead-uuid-001',
    });

    await svc.createHybridSchedulingInvite('lead-uuid-001');

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'whatsapp',
      templateKey: 'wa_briefing_recebido_agendamento_link_v1',
    }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'gmail',
      templateKey: 'gm_briefing_recebido_agendamento_link_v1',
    }));

    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = prevHybrid;
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = prevPublic;
    process.env.COMMERCIAL_SCHEDULING_QUICK_CONFIRM_ENABLED = prevQuick;
  });

  it('blocks google booking invite when lead has no email', async () => {
    const prevHybrid = process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED;
    const prevPublic = process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED;
    const prevGoogle = process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED;
    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = 'true';
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = 'true';
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = 'true';

    const pool = makePool({
      rowCount: 1,
      rows: [makeLeadRow({ form_type: 'briefing', email: null })],
    });
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    await expect(svc.createHybridSchedulingInvite('lead-uuid-001')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { reasonCode: 'LEAD_EMAIL_REQUIRED' },
    });

    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = prevHybrid;
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = prevPublic;
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = prevGoogle;
  });

  it('blocks google booking invite when responsável has no booking config', async () => {
    const prevHybrid = process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED;
    const prevPublic = process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED;
    const prevGoogle = process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED;
    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = 'true';
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = 'true';
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = 'true';

    const pool = makePool(
      { rowCount: 1, rows: [makeLeadRow({ form_type: 'briefing', email: 'lead@exemplo.com', responsavel: 'Sem Config' })] },
      { rowCount: 0, rows: [] },
    );
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    await expect(svc.createHybridSchedulingInvite('lead-uuid-001')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { reasonCode: 'CALENDAR_LINK_NOT_CONFIGURED' },
    });

    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = prevHybrid;
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = prevPublic;
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = prevGoogle;
  });

  it('uses google suggestions template when 2 slots are available in google booking mode', async () => {
    const prevHybrid = process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED;
    const prevPublic = process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED;
    const prevGoogle = process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED;
    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = 'true';
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = 'true';
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = 'true';

    const pool = makePool(
      { rowCount: 1, rows: [makeLeadRow({ form_type: 'briefing', email: 'lead@exemplo.com', responsavel: 'Matheus' })] },
      {
        rowCount: 1,
        rows: [{
          id: 'cfg-001',
          responsavel_key: 'Matheus',
          calendar_id: 'primary',
          booking_url: 'https://calendar.google.com/calendar/u/0/appointments/schedules/abc123',
          owner_email: 'matheus@lucena.com',
          timezone: 'America/Sao_Paulo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      },
    );

    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);
    vi.spyOn(svc as any, 'collectGoogleBookingSuggestedSlots').mockResolvedValue([
      { start: '2026-03-01T10:00:00.000Z', end: '2026-03-01T10:30:00.000Z' },
      { start: '2026-03-01T14:00:00.000Z', end: '2026-03-01T14:30:00.000Z' },
    ]);

    const dispatchSpy = vi.spyOn(svc, 'dispatchStageCommunication').mockResolvedValue({
      ok: true,
      leadId: 'lead-uuid-001',
      channel: 'whatsapp',
      stage: 'diagnostico_agendado',
      eventId: 'evt-google-001',
    });
    const ingestSpy = vi.spyOn(svc, 'ingestIntegrationEvent').mockResolvedValue({
      ok: true,
      eventId: 'evt-google-002',
      leadId: 'lead-uuid-001',
    });

    const result = await svc.createHybridSchedulingInvite('lead-uuid-001');
    expect(result.provider).toBe('google_booking');
    expect(result.suggestedSlots).toHaveLength(2);
    expect(result.whatsappMode).toBe('text_reply');
    expect(result.interactiveAttempted).toBe(false);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'whatsapp',
      templateKey: 'wa_briefing_recebido_agendamento_google_sugestoes_v1',
    }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'gmail',
      templateKey: 'gm_briefing_recebido_agendamento_google_sugestoes_v1',
    }));
    expect(ingestSpy).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'scheduling:invite_sent',
      payload: expect.objectContaining({
        suggestionCount: 2,
      }),
    }));

    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = prevHybrid;
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = prevPublic;
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = prevGoogle;
  });

  it('keeps text reply mode in baileys even when interactive flag is enabled', async () => {
    const prevHybrid = process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED;
    const prevPublic = process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED;
    const prevGoogle = process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED;
    const prevInteractive = process.env.COMMERCIAL_WHATSAPP_INTERACTIVE_SCHEDULING_ENABLED;
    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = 'true';
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = 'true';
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = 'true';
    process.env.COMMERCIAL_WHATSAPP_INTERACTIVE_SCHEDULING_ENABLED = 'true';

    const pool = makePool(
      { rowCount: 1, rows: [makeLeadRow({ form_type: 'briefing', email: 'lead@exemplo.com', responsavel: 'Matheus' })] },
      {
        rowCount: 1,
        rows: [{
          id: 'cfg-001',
          responsavel_key: 'Matheus',
          calendar_id: 'primary',
          booking_url: 'https://calendar.google.com/calendar/u/0/appointments/schedules/abc123',
          owner_email: 'matheus@lucena.com',
          timezone: 'America/Sao_Paulo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      },
    );

    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);
    vi.spyOn(svc as any, 'collectGoogleBookingSuggestedSlots').mockResolvedValue([
      { start: '2026-03-01T10:00:00.000Z', end: '2026-03-01T10:30:00.000Z' },
      { start: '2026-03-01T14:00:00.000Z', end: '2026-03-01T14:30:00.000Z' },
    ]);

    const dispatchSpy = vi.spyOn(svc, 'dispatchStageCommunication').mockResolvedValue({
      ok: true,
      leadId: 'lead-uuid-001',
      channel: 'whatsapp',
      stage: 'diagnostico_agendado',
      eventId: 'evt-google-001',
    });
    vi.spyOn(svc, 'ingestIntegrationEvent').mockResolvedValue({
      ok: true,
      eventId: 'evt-google-003',
      leadId: 'lead-uuid-001',
    });

    const sendInteractiveSpy = vi.spyOn(stubEvolutionApi as unknown as { sendInteractiveButtons: (...args: unknown[]) => unknown }, 'sendInteractiveButtons');
    const result = await svc.createHybridSchedulingInvite('lead-uuid-001');

    expect(result.whatsappMode).toBe('text_reply');
    expect(result.interactiveAttempted).toBe(false);
    expect(sendInteractiveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'whatsapp',
      templateKey: 'wa_briefing_recebido_agendamento_google_sugestoes_v1',
    }));

    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = prevHybrid;
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = prevPublic;
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = prevGoogle;
    process.env.COMMERCIAL_WHATSAPP_INTERACTIVE_SCHEDULING_ENABLED = prevInteractive;
  });

  it('uses link-only template when google booking has less than 2 suggestions', async () => {
    const prevHybrid = process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED;
    const prevPublic = process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED;
    const prevGoogle = process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED;
    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = 'true';
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = 'true';
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = 'true';

    const pool = makePool(
      { rowCount: 1, rows: [makeLeadRow({ form_type: 'briefing', email: 'lead@exemplo.com', responsavel: 'Matheus' })] },
      {
        rowCount: 1,
        rows: [{
          id: 'cfg-001',
          responsavel_key: 'Matheus',
          calendar_id: 'primary',
          booking_url: 'https://calendar.google.com/calendar/u/0/appointments/schedules/abc123',
          owner_email: 'matheus@lucena.com',
          timezone: 'America/Sao_Paulo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      },
    );

    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);
    vi.spyOn(svc as any, 'collectGoogleBookingSuggestedSlots').mockResolvedValue([
      { start: '2026-03-01T10:00:00.000Z', end: '2026-03-01T10:30:00.000Z' },
    ]);

    const dispatchSpy = vi.spyOn(svc, 'dispatchStageCommunication').mockResolvedValue({
      ok: true,
      leadId: 'lead-uuid-001',
      channel: 'whatsapp',
      stage: 'diagnostico_agendado',
      eventId: 'evt-google-003',
    });
    vi.spyOn(svc, 'ingestIntegrationEvent').mockResolvedValue({
      ok: true,
      eventId: 'evt-google-004',
      leadId: 'lead-uuid-001',
    });

    const result = await svc.createHybridSchedulingInvite('lead-uuid-001');
    expect(result.provider).toBe('google_booking');
    expect(result.suggestedSlots).toHaveLength(0);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'whatsapp',
      templateKey: 'wa_briefing_recebido_agendamento_link_v1',
    }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'gmail',
      templateKey: 'gm_briefing_recebido_agendamento_link_v1',
    }));

    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = prevHybrid;
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = prevPublic;
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = prevGoogle;
  });

  it('considers invite sent when one channel fails and the other succeeds', async () => {
    const prevHybrid = process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED;
    const prevPublic = process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED;
    const prevQuick = process.env.COMMERCIAL_SCHEDULING_QUICK_CONFIRM_ENABLED;
    const prevGoogle = process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED;
    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = 'true';
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = 'true';
    process.env.COMMERCIAL_SCHEDULING_QUICK_CONFIRM_ENABLED = 'false';
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = 'false';

    const pool = makePool(
      { rowCount: 1, rows: [makeLeadRow({ form_type: 'briefing', email: 'lead@exemplo.com', whatsapp: '+5511999990001' })] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [] },
    );
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    vi.spyOn(svc, 'createSchedulingLink').mockResolvedValue({
      leadId: 'lead-uuid-001',
      token: 'tok_001',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://hub.dev/forms/comercial/scheduling?token=tok_001&leadId=lead-uuid-001',
    });
    vi.spyOn(svc as any, 'collectSuggestedSlots').mockResolvedValue([
      { start: '2026-03-01T10:00:00.000Z', end: '2026-03-01T10:30:00.000Z' },
    ]);

    const dispatchSpy = vi.spyOn(svc, 'dispatchStageCommunication');
    dispatchSpy
      .mockRejectedValueOnce(new Error('whatsapp outage'))
      .mockResolvedValueOnce({
        ok: true,
        leadId: 'lead-uuid-001',
        channel: 'gmail',
        stage: 'diagnostico_agendado',
        eventId: 'evt-gmail-001',
      });

    const ingestSpy = vi.spyOn(svc, 'ingestIntegrationEvent').mockResolvedValue({
      ok: true,
      eventId: 'evt-invite-001',
      leadId: 'lead-uuid-001',
    });

    const result = await svc.createHybridSchedulingInvite('lead-uuid-001');
    expect(result.channelsSent).toEqual(['gmail']);
    expect(result.channelErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ channel: 'whatsapp' }),
      ]),
    );
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    expect(ingestSpy).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'scheduling:invite_sent',
      payload: expect.objectContaining({
        channels: ['gmail'],
        channelErrors: expect.arrayContaining([
          expect.objectContaining({ channel: 'whatsapp' }),
        ]),
      }),
    }));

    process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED = prevHybrid;
    process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED = prevPublic;
    process.env.COMMERCIAL_SCHEDULING_QUICK_CONFIRM_ENABLED = prevQuick;
    process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED = prevGoogle;
  });

  it('emits dispatch:template_error when strict mode has no configured template', async () => {
    const prevStrict = process.env.COMMERCIAL_TEMPLATE_STRICT_MODE_ENABLED;
    process.env.COMMERCIAL_TEMPLATE_STRICT_MODE_ENABLED = 'true';

    const pool = makePool(
      { rowCount: 0, rows: [] },
      { rowCount: 1, rows: [{ lead_id: 'lead-uuid-001', status_atual: 'primeiro_contato' }] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [] },
    );
    const svc = new CommercialLeadsService(pool, stubEvolutionApi, stubGoogleApi);

    await expect(
      svc.dispatchStageCommunication({
        leadId: 'lead-uuid-001',
        channel: 'whatsapp',
        stage: 'primeiro_contato',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { reasonCode: 'TEMPLATE_NOT_CONFIGURED' },
    });

    const queryMock = (pool as unknown as { query: ReturnType<typeof vi.fn> }).query;
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO commercial_integration_events'),
      expect.arrayContaining(['lead-uuid-001', 'custom', 'dispatch:template_error']),
    );

    process.env.COMMERCIAL_TEMPLATE_STRICT_MODE_ENABLED = prevStrict;
  });
});
