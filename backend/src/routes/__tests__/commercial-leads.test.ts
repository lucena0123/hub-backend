/**
 * Smoke tests — commercial leads routes
 *
 * Uses Fastify's inject() to fire HTTP requests against the real route handlers,
 * with a mock services plugin instead of real DB/Redis connections.
 *
 * All CommercialLeadsService methods are stubbed via vi.fn().
 */

import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import fp from 'fastify-plugin';
import { buildApp } from '../../app';
import { CommercialFlowError } from '../../services/commercial-leads-service';

// ---------------------------------------------------------------------------
// Stub CommercialLeadsService
// ---------------------------------------------------------------------------

const mockLead = {
  leadId: 'lead-smoke-001',
  dataEntrada: '2026-02-26T00:00:00.000Z',
  origem: 'instagram',
  nomeEscritorio: 'Escritório Smoke Ltda',
  whatsapp: '+5511999990001',
  statusAtual: 'novo_lead',
  responsavel: 'Ana Smoke',
  dor01Ok: false,
  dor02Ok: false,
  dor03Ok: false,
  contractStatus: 'pendente',
  paymentStatus: 'pendente',
  consentGiven: false,
  onboardingD0Ok: false,
  onboardingD1Ok: false,
  onboardingD2Ok: false,
  onboardingD3D4Ok: false,
  onboardingD5D7Ok: false,
  createdAt: '2026-02-26T00:00:00.000Z',
  updatedAt: '2026-02-26T00:00:00.000Z',
};

const mockDashboard = {
  total: 5,
  novos: 2,
  diagnosticos: 1,
  propostas: 1,
  fechados: 0,
  rangeDays: 30,
};

// Stub object — methods replaced per test using mockResolvedValueOnce()
const stubCommercialLeads = {
  initialize: vi.fn().mockResolvedValue(undefined),
  createLead: vi.fn().mockResolvedValue(mockLead),
  getLead: vi.fn().mockResolvedValue(mockLead),
  listLeads: vi.fn().mockResolvedValue([mockLead]),
  moveLeadStatus: vi.fn().mockResolvedValue({ ...mockLead, statusAtual: 'primeiro_contato' }),
  dispatchStageCommunication: vi.fn().mockResolvedValue({ ok: true, leadId: 'lead-smoke-001', channel: 'whatsapp', stage: 'primeiro_contato', eventId: 'evt-001' }),
  ingestIntegrationEvent: vi.fn().mockResolvedValue({ eventId: 'evt-001', leadId: 'lead-smoke-001', channel: 'whatsapp', eventType: 'test', occurredAt: '2026-02-26T00:00:00.000Z', createdAt: '2026-02-26T00:00:00.000Z' }),
  requestScheduleSlots: vi.fn().mockResolvedValue({ leadId: 'lead-smoke-001', slots: [] }),
  confirmScheduledMeeting: vi.fn().mockResolvedValue({ ok: true, leadId: 'lead-smoke-001' }),
  updateScheduledMeeting: vi.fn().mockResolvedValue({ ok: true, leadId: 'lead-smoke-001' }),
  cancelScheduledMeeting: vi.fn().mockResolvedValue({ ok: true, leadId: 'lead-smoke-001', eventId: 'evt-001' }),
  createHybridSchedulingInvite: vi.fn().mockResolvedValue({
    inviteId: 'invite-smoke-001',
    leadId: 'lead-smoke-001',
    calendarUrl: 'https://hub.dev/forms/comercial/scheduling?token=tok&leadId=lead-smoke-001',
    provider: 'hub_public',
    suggestedSlots: [],
    channelsSent: ['whatsapp', 'gmail'],
    sentAt: '2026-02-26T00:00:00.000Z',
    expiresAt: '2026-03-12T00:00:00.000Z',
  }),
  listCalendarConfigs: vi.fn().mockResolvedValue([]),
  createCalendarConfig: vi.fn().mockResolvedValue({
    id: 'cfg-001',
    responsavelKey: 'Ana Smoke',
    calendarId: 'primary',
    bookingUrl: 'https://calendar.google.com/bookings/abc',
    ownerEmail: 'ana@lucena.com',
    timezone: 'America/Sao_Paulo',
    isActive: true,
    createdAt: '2026-02-26T00:00:00.000Z',
    updatedAt: '2026-02-26T00:00:00.000Z',
  }),
  updateCalendarConfig: vi.fn().mockResolvedValue({
    id: 'cfg-001',
    responsavelKey: 'Ana Smoke',
    calendarId: 'primary',
    bookingUrl: 'https://calendar.google.com/bookings/abc',
    ownerEmail: 'ana@lucena.com',
    timezone: 'America/Sao_Paulo',
    isActive: true,
    createdAt: '2026-02-26T00:00:00.000Z',
    updatedAt: '2026-02-26T00:00:00.000Z',
  }),
  syncGoogleBookingEvents: vi.fn().mockResolvedValue({ checkedCalendars: 1, processedEvents: 0, linkedLeads: 0, queued: 0 }),
  listCalendarReconciliationQueue: vi.fn().mockResolvedValue([]),
  resolveCalendarReconciliation: vi.fn().mockResolvedValue({
    id: 'recon-001',
    calendarConfigId: 'cfg-001',
    googleEventId: 'evt-001',
    reasonCode: 'booking_unmatched',
    status: 'ignored',
    createdAt: '2026-02-26T00:00:00.000Z',
    updatedAt: '2026-02-26T00:00:00.000Z',
  }),
  resolvePublicSchedulingRedirect: vi.fn().mockResolvedValue({ url: 'https://calendar.google.com/bookings/abc' }),
  updateLeadProofs: vi.fn().mockResolvedValue(mockLead),
  updateLeadOnboarding: vi.fn().mockResolvedValue(mockLead),
  updateLeadPrivacy: vi.fn().mockResolvedValue(mockLead),
  submitLeadForm: vi.fn().mockResolvedValue({ formLink: 'https://hub.dev/form/token', leadId: 'lead-smoke-001', formType: 'briefing', formToken: 'tok', url: 'https://hub.dev/form/tok' }),
  getDashboard: vi.fn().mockResolvedValue(mockDashboard),
  getDailySummary: vi.fn().mockResolvedValue({ date: '2026-02-26', novosLeads: 1, leadsAtrasadosSla24h: 0, propostasSemFollowup: 0, negociacoesAbertas: 0, fechadosHoje: 0 }),
  listSlaAlerts: vi.fn().mockResolvedValue([]),
  listFollowupsDue: vi.fn().mockResolvedValue([]),
  triggerFollowupDispatch: vi.fn().mockResolvedValue({ ok: true }),
  listRetentionDue: vi.fn().mockResolvedValue([]),
  listLeadTimeline: vi.fn().mockResolvedValue([]),
  listIntegrationEvents: vi.fn().mockResolvedValue([]),
  getOrCreateFormLink: vi.fn().mockResolvedValue({ leadId: 'lead-smoke-001', formType: 'briefing', formToken: 'tok', url: 'https://hub.dev/form/tok' }),
  deleteLeadPermanently: vi.fn().mockResolvedValue({ ok: true, leadId: 'lead-smoke-001' }),
  getDispatchHealthSummary: vi.fn().mockResolvedValue({ windowDays: 7, total: 0, success: 0, failed: 0, successRate: 0, byChannel: [] }),
  listTemplates: vi.fn().mockResolvedValue([]),
  createTemplate: vi.fn().mockResolvedValue({}),
  updateTemplate: vi.fn().mockResolvedValue({}),
  publishTemplate: vi.fn().mockResolvedValue({}),
  requestPublicScheduleSlots: vi.fn().mockResolvedValue({ leadId: 'lead-smoke-001', slots: [], suggestedSlots: [] }),
  confirmPublicScheduledMeeting: vi.fn().mockResolvedValue({ ok: true, leadId: 'lead-smoke-001', eventId: 'cal-smoke-001' }),
  quickConfirmPublicScheduledMeeting: vi.fn().mockResolvedValue({
    ok: true,
    leadId: 'lead-smoke-001',
    eventId: 'cal-smoke-001',
    slotStart: '2026-03-01T10:00:00.000Z',
    slotEnd: '2026-03-01T10:30:00.000Z',
  }),
  updatePublicScheduledMeeting: vi.fn().mockResolvedValue({ ok: true, leadId: 'lead-smoke-001', eventId: 'cal-smoke-001' }),
  cancelPublicScheduledMeeting: vi.fn().mockResolvedValue({ ok: true, leadId: 'lead-smoke-001', eventId: 'cal-smoke-001' }),
  processWhatsAppSchedulingReply: vi.fn().mockResolvedValue({ ok: true, status: 'processed' }),
};

// ---------------------------------------------------------------------------
// Mock services plugin — replaces the real services plugin (no DB/Redis)
// ---------------------------------------------------------------------------

const mockServicesPlugin = fp(async (fastify) => {
  const fakePrisma = {} as any;
  const fakePool = { query: vi.fn(), end: vi.fn(), connect: vi.fn() } as any;
  fastify.decorate('pool', fakePool);
  fastify.decorate('prisma', fakePrisma);
  fastify.decorate('services', {
    commercialLeads: stubCommercialLeads,
    // Minimal stubs for other services used by non-commercial routes
    queue: { available: false },
    clients: {},
    auth: {},
    processes: {},
    metrics: {},
    bpmn: {},
    bpmnDefinitions: {},
    reports: {},
    dashboard: {},
    cache: null,
    aiOutputs: {},
    syncHistory: {},
    leadTracking: {},
    clientAudit: {},
    notification: {},
    campaigns: {},
    analytics: {},
    anomaly: {},
    metaAds: {},
    optimizationAction: {},
    optimizationTaskGenerator: {},
  } as any);

  fastify.addHook('onClose', async () => {});
});

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

let app: ReturnType<typeof buildApp>;
let authToken: string;

beforeAll(async () => {
  app = buildApp(mockServicesPlugin);
  await app.ready();
  // Sign a token for the test admin user
  authToken = app.jwt.sign({ id: 'test-user-id', email: 'admin@hub.dev', name: 'Admin Test', role: 'admin' });
});

afterAll(async () => {
  await app.close();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeader() {
  return { Authorization: `Bearer ${authToken}` };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/comercial/leads', () => {
  it('returns 201 with created lead on success', async () => {
    stubCommercialLeads.createLead.mockResolvedValueOnce(mockLead);

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads',
      headers: authHeader(),
      payload: {
        origem: 'instagram',
        nomeEscritorio: 'Escritório Smoke Ltda',
        responsavel: 'Ana Smoke',
        whatsapp: '+5511999990001',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.leadId).toBe('lead-smoke-001');
    expect(body.statusAtual).toBe('novo_lead');
  });

  it('returns 409 on DUPLICATE_LEAD error', async () => {
    stubCommercialLeads.createLead.mockRejectedValueOnce(
      new CommercialFlowError('DUPLICATE_LEAD', 'Lead duplicado detectado.'),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads',
      headers: authHeader(),
      payload: {
        origem: 'instagram',
        nomeEscritorio: 'Escritório Duplicado',
        responsavel: 'João',
        whatsapp: '+5511999990002',
      },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('DUPLICATE_LEAD');
  });

  it('returns 401 without auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads',
      payload: { origem: 'instagram', nomeEscritorio: 'X', responsavel: 'Y' },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/comercial/leads/:leadId', () => {
  it('returns 200 with lead data when found', async () => {
    stubCommercialLeads.getLead.mockResolvedValueOnce(mockLead);

    const res = await app.inject({
      method: 'GET',
      url: '/api/comercial/leads/lead-smoke-001',
      headers: authHeader(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().leadId).toBe('lead-smoke-001');
  });

  it('returns 404 when lead does not exist', async () => {
    stubCommercialLeads.getLead.mockRejectedValueOnce(
      new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.'),
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/comercial/leads/ghost-id',
      headers: authHeader(),
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('NOT_FOUND');
  });
});

describe('POST /api/comercial/leads/:leadId/move', () => {
  it('returns 200 on successful status transition', async () => {
    stubCommercialLeads.moveLeadStatus.mockResolvedValueOnce({
      ...mockLead,
      statusAtual: 'primeiro_contato',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads/lead-smoke-001/move',
      headers: authHeader(),
      payload: { to: 'primeiro_contato' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().statusAtual).toBe('primeiro_contato');
  });

  it('returns 409 on DOR_BLOCKED', async () => {
    stubCommercialLeads.moveLeadStatus.mockRejectedValueOnce(
      new CommercialFlowError('DOR_BLOCKED', 'DoR01 não foi cumprido.'),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads/lead-smoke-001/move',
      headers: authHeader(),
      payload: { to: 'diagnostico_agendado', dor01Ok: false },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('DOR_BLOCKED');
  });

  it('returns 409 on INVALID_TRANSITION', async () => {
    stubCommercialLeads.moveLeadStatus.mockRejectedValueOnce(
      new CommercialFlowError('INVALID_TRANSITION', 'Transição inválida: fechado -> novo_lead'),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads/lead-smoke-001/move',
      headers: authHeader(),
      payload: { to: 'novo_lead' },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('INVALID_TRANSITION');
  });

  it('returns 400 with reasonCode on missing calendar event', async () => {
    stubCommercialLeads.moveLeadStatus.mockRejectedValueOnce(
      new CommercialFlowError(
        'VALIDATION_ERROR',
        'Para avançar para diagnóstico agendado é necessário confirmar reunião no calendário.',
        { reasonCode: 'MISSING_CALENDAR_EVENT' },
      ),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads/lead-smoke-001/move',
      headers: authHeader(),
      payload: { to: 'diagnostico_agendado', dor01Ok: true },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('VALIDATION_ERROR');
    expect(res.json().details?.reasonCode).toBe('MISSING_CALENDAR_EVENT');
  });
});

describe('GET /api/comercial/dashboard', () => {
  it('returns 200 with dashboard data', async () => {
    stubCommercialLeads.getDashboard.mockResolvedValueOnce(mockDashboard);

    const res = await app.inject({
      method: 'GET',
      url: '/api/comercial/dashboard',
      headers: authHeader(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(5);
    expect(body.fechados).toBe(0);
  });

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/comercial/dashboard' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/comercial/daily-summary', () => {
  it('returns 200 with summary', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/comercial/daily-summary',
      headers: authHeader(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('novosLeads');
  });
});

describe('POST /api/comercial/dispatch', () => {
  it('returns 200 on successful dispatch', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/dispatch',
      headers: authHeader(),
      payload: {
        leadId: 'lead-smoke-001',
        channel: 'whatsapp',
        stage: 'primeiro_contato',
        recipient: '+5511999990001',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('returns 400 on VALIDATION_ERROR (webhook not configured)', async () => {
    stubCommercialLeads.dispatchStageCommunication.mockRejectedValueOnce(
      new CommercialFlowError('VALIDATION_ERROR', 'Webhook de dispatch não configurado para canal whatsapp.'),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/dispatch',
      headers: authHeader(),
      payload: {
        leadId: 'lead-smoke-001',
        channel: 'whatsapp',
        stage: 'primeiro_contato',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/comercial/leads/:leadId/scheduling/invite', () => {
  it('returns 200 with invite payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads/lead-smoke-001/scheduling/invite',
      headers: authHeader(),
      payload: { daysWindow: 14, durationMin: 30, timezone: 'America/Sao_Paulo' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().inviteId).toBe('invite-smoke-001');
  });

  it('returns 400 with reasonCode when briefing is missing', async () => {
    stubCommercialLeads.createHybridSchedulingInvite.mockRejectedValueOnce(
      new CommercialFlowError('VALIDATION_ERROR', 'Briefing obrigatório.', { reasonCode: 'BRIEFING_REQUIRED' }),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads/lead-smoke-001/scheduling/invite',
      headers: authHeader(),
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().details?.reasonCode).toBe('BRIEFING_REQUIRED');
  });

  it('returns 400 with reasonCode when lead email is missing for google booking', async () => {
    stubCommercialLeads.createHybridSchedulingInvite.mockRejectedValueOnce(
      new CommercialFlowError('VALIDATION_ERROR', 'Lead sem e-mail.', { reasonCode: 'LEAD_EMAIL_REQUIRED' }),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads/lead-smoke-001/scheduling/invite',
      headers: authHeader(),
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().details?.reasonCode).toBe('LEAD_EMAIL_REQUIRED');
  });

  it('returns 400 with reasonCode when booking link is not configured', async () => {
    stubCommercialLeads.createHybridSchedulingInvite.mockRejectedValueOnce(
      new CommercialFlowError('VALIDATION_ERROR', 'Sem booking link.', { reasonCode: 'CALENDAR_LINK_NOT_CONFIGURED' }),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/comercial/leads/lead-smoke-001/scheduling/invite',
      headers: authHeader(),
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().details?.reasonCode).toBe('CALENDAR_LINK_NOT_CONFIGURED');
  });
});

describe('POST /api/public/comercial/scheduling/quick-confirm', () => {
  it('returns 200 on successful quick confirm', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/public/comercial/scheduling/quick-confirm',
      payload: {
        leadId: 'lead-smoke-001',
        quickToken: 'quick-smoke-token',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('returns 409 for slot conflict', async () => {
    stubCommercialLeads.quickConfirmPublicScheduledMeeting.mockRejectedValueOnce(
      new CommercialFlowError('VALIDATION_ERROR', 'slot ocupado', { reasonCode: 'SLOT_CONFLICT' }),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/public/comercial/scheduling/quick-confirm',
      payload: {
        leadId: 'lead-smoke-001',
        quickToken: 'quick-smoke-token',
      },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/public/comercial/scheduling/redirect', () => {
  it('returns 302 redirect to google booking url', async () => {
    stubCommercialLeads.resolvePublicSchedulingRedirect.mockResolvedValueOnce({
      url: 'https://calendar.google.com/calendar/u/0/appointments/schedules/abc123',
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/public/comercial/scheduling/redirect?token=tok-001&leadId=lead-smoke-001',
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('https://calendar.google.com/calendar/u/0/appointments/schedules/abc123');
  });

  it('returns 400 when token/leadId are missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/public/comercial/scheduling/redirect',
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/public/webhooks/evolution/whatsapp', () => {
  it('returns 200 and forwards payload to processWhatsAppSchedulingReply', async () => {
    stubCommercialLeads.processWhatsAppSchedulingReply.mockResolvedValueOnce({
      ok: true,
      status: 'processed',
      leadId: 'lead-smoke-001',
      inviteId: 'invite-smoke-001',
      intent: 'confirm_option_1',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/public/webhooks/evolution/whatsapp',
      payload: {
        providerMessageId: 'msg-123',
        from: '5511999990001@s.whatsapp.net',
        buttonPayload: 'SCHED_OPT_1',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('processed');
    expect(stubCommercialLeads.processWhatsAppSchedulingReply).toHaveBeenCalled();
  });

  it('returns 401 when webhook secret is configured and header is missing', async () => {
    const prevSecret = process.env.EVOLUTION_WEBHOOK_SECRET;
    process.env.EVOLUTION_WEBHOOK_SECRET = 'secret-smoke';

    const res = await app.inject({
      method: 'POST',
      url: '/api/public/webhooks/evolution/whatsapp',
      payload: {
        providerMessageId: 'msg-unauth',
        from: '5511999990001@s.whatsapp.net',
        text: '1',
      },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('UNAUTHORIZED');
    process.env.EVOLUTION_WEBHOOK_SECRET = prevSecret;
  });
});
