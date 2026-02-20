import { createHmac } from 'node:crypto';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export type CommercialLeadStatus =
  | 'novo_lead'
  | 'primeiro_contato'
  | 'diagnostico_agendado'
  | 'diagnostico_concluido'
  | 'proposta_enviada'
  | 'negociacao'
  | 'fechado'
  | 'nutricao'
  | 'perdido';

export interface CreateCommercialLeadInput {
  origem: 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro';
  nomeEscritorio: string;
  responsavel: string;
  instagram?: string;
  whatsapp?: string;
  cidade?: string;
  areaPrincipal?: string;
  proximaAcao?: string;
  dataProximaAcao?: string;
}

export interface MoveLeadStatusInput {
  to: CommercialLeadStatus;
  observacao?: string;
  actor?: string;
  dor01Ok?: boolean;
  dor02Ok?: boolean;
  dor03Ok?: boolean;
  motivoNutricao?: string;
  motivoPerda?: string;
  dataProximaAcao?: string;
}

export interface SubmitCommercialFormInput {
  formType: CommercialFormType;
  payload: Record<string, unknown>;
  submittedAt?: string;
}

export type ContractStatus = 'pendente' | 'assinado';
export type PaymentStatus = 'pendente' | 'pago';

export interface UpdateCommercialLeadProofsInput {
  contractStatus?: ContractStatus;
  paymentStatus?: PaymentStatus;
  observacao?: string;
}

export interface UpdateCommercialLeadOnboardingInput {
  d0Ok?: boolean;
  d1Ok?: boolean;
  d2Ok?: boolean;
  d3D4Ok?: boolean;
  d5D7Ok?: boolean;
  observacao?: string;
}

export interface UpdateCommercialLeadPrivacyInput {
  consentGiven?: boolean;
  retentionUntil?: string;
  observacao?: string;
}

export interface IngestCommercialIntegrationEventInput {
  leadId: string;
  channel: 'whatsapp' | 'gmail' | 'calendar' | 'zapsign' | 'custom';
  eventType: string;
  payload?: Record<string, unknown>;
  externalEventId?: string;
  occurredAt?: string;
}

export interface DispatchCommercialCommunicationInput {
  leadId: string;
  channel: 'whatsapp' | 'gmail';
  stage: 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado';
  templateKey: string;
  recipient?: string;
  variables?: Record<string, unknown>;
}

export interface CommercialDashboard {
  total: number;
  novos: number;
  diagnosticos: number;
  propostas: number;
  fechados: number;
  rangeDays?: number;
}

export interface CommercialSlaAlert {
  leadId: string;
  nomeEscritorio: string;
  statusAtual: CommercialLeadStatus;
  responsavel: string;
  updatedAt: string;
  hoursInStatus: number;
}

export interface CommercialDailySummary {
  date: string;
  novosLeads: number;
  leadsAtrasadosSla24h: number;
  propostasSemFollowup: number;
  negociacoesAbertas: number;
  fechadosHoje: number;
}

export interface CommercialLeadTimelineEvent {
  id: string;
  leadId: string;
  statusOrigem: string;
  statusDestino: string;
  actor?: string;
  observacao?: string;
  createdAt: string;
}

export interface CommercialFormLink {
  leadId: string;
  formType: CommercialFormType;
  formToken: string;
  url: string;
}

export interface CommercialFollowupDue {
  leadId: string;
  nomeEscritorio: string;
  responsavel: string;
  statusAtual: CommercialLeadStatus;
  followupType: 'D+2' | 'D+5';
  dueAt: string;
}

export interface CommercialRetentionAlert {
  leadId: string;
  nomeEscritorio: string;
  responsavel: string;
  retentionUntil: string;
  daysOverdue: number;
}

export interface CommercialIntegrationEvent {
  id: string;
  leadId: string;
  channel: string;
  eventType: string;
  externalEventId?: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export type CommercialFormType = 'briefing' | 'onboarding' | 'custom';

export interface CommercialLeadRecord {
  leadId: string;
  dataEntrada: string;
  origem: string;
  nomeEscritorio: string;
  instagram?: string;
  whatsapp?: string;
  cidade?: string;
  areaPrincipal?: string;
  statusAtual: CommercialLeadStatus;
  responsavel: string;
  proximaAcao?: string;
  dataProximaAcao?: string;
  motivoNutricao?: string;
  motivoPerda?: string;
  dor01Ok: boolean;
  dor02Ok: boolean;
  dor03Ok: boolean;
  formToken?: string;
  formType?: CommercialFormType;
  formSubmittedAt?: string;
  formPayloadJson?: Record<string, unknown>;
  contractStatus: ContractStatus;
  paymentStatus: PaymentStatus;
  followupD2At?: string;
  followupD5At?: string;
  onboardingD0Ok: boolean;
  onboardingD1Ok: boolean;
  onboardingD2Ok: boolean;
  onboardingD3D4Ok: boolean;
  onboardingD5D7Ok: boolean;
  consentGiven: boolean;
  consentGivenAt?: string;
  retentionUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export class CommercialFlowError extends Error {
  constructor(
    public code: 'INVALID_TRANSITION' | 'DOR_BLOCKED' | 'VALIDATION_ERROR' | 'NOT_FOUND',
    message: string,
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

export class CommercialLeadsService {
  constructor(private pool: Pool) {}

  getFormLink(leadId: string, formType: CommercialFormType, formToken?: string): CommercialFormLink {
    const token = formToken || uuidv4();
    const baseUrl = process.env.HUB_FORMS_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
    const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return {
      leadId,
      formType,
      formToken: token,
      url: `${normalized}/forms/${formType}?token=${token}&leadId=${leadId}`,
    };
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS commercial_leads (
        lead_id UUID PRIMARY KEY,
        data_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        origem TEXT NOT NULL,
        nome_escritorio TEXT NOT NULL,
        instagram TEXT,
        whatsapp TEXT,
        cidade TEXT,
        area_principal TEXT,
        status_atual TEXT NOT NULL,
        responsavel TEXT NOT NULL,
        proxima_acao TEXT,
        data_proxima_acao TIMESTAMPTZ,
        motivo_nutricao TEXT,
        motivo_perda TEXT,
        dor01_ok BOOLEAN NOT NULL DEFAULT FALSE,
        dor02_ok BOOLEAN NOT NULL DEFAULT FALSE,
        dor03_ok BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_lead_transitions (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        status_origem TEXT NOT NULL,
        status_destino TEXT NOT NULL,
        actor TEXT,
        observacao TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_integration_events (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        channel TEXT NOT NULL,
        event_type TEXT NOT NULL,
        external_event_id TEXT,
        payload_json JSONB,
        occurred_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_token TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_type TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_submitted_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_payload_json JSONB;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS contract_status TEXT NOT NULL DEFAULT 'pendente';
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendente';
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS followup_d2_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS followup_d5_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d0_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d1_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d2_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d3_d4_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d5_d7_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ;

      CREATE INDEX IF NOT EXISTS idx_commercial_leads_status ON commercial_leads(status_atual);
      CREATE INDEX IF NOT EXISTS idx_commercial_leads_responsavel ON commercial_leads(responsavel);
      CREATE INDEX IF NOT EXISTS idx_commercial_leads_form_type ON commercial_leads(form_type);
      CREATE INDEX IF NOT EXISTS idx_commercial_transitions_lead ON commercial_lead_transitions(lead_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_integration_events_lead ON commercial_integration_events(lead_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_integration_events_channel ON commercial_integration_events(channel);
    `);
  }

  async createLead(input: CreateCommercialLeadInput): Promise<CommercialLeadRecord> {
    const leadId = uuidv4();
    const formToken = uuidv4();

    if (input.whatsapp) {
      const dedupe = await this.pool.query(
        `SELECT lead_id
         FROM commercial_leads
         WHERE status_atual NOT IN ('fechado', 'perdido')
           AND whatsapp = $1
           AND LOWER(nome_escritorio) = LOWER($2)
         LIMIT 1`,
        [input.whatsapp, input.nomeEscritorio],
      );

      if (dedupe.rowCount && dedupe.rowCount > 0) {
        throw new CommercialFlowError(
          'VALIDATION_ERROR',
          'Lead duplicado detectado (mesmo WhatsApp e escritório em aberto).',
        );
      }
    }

    const result = await this.pool.query(
      `INSERT INTO commercial_leads (
        lead_id, origem, nome_escritorio, instagram, whatsapp, cidade, area_principal,
        status_atual, responsavel, proxima_acao, data_proxima_acao, form_token
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        leadId,
        input.origem,
        input.nomeEscritorio,
        input.instagram || null,
        input.whatsapp || null,
        input.cidade || null,
        input.areaPrincipal || null,
        'novo_lead',
        input.responsavel,
        input.proximaAcao || null,
        input.dataProximaAcao || null,
        formToken,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async listLeads(filters?: { status?: CommercialLeadStatus; responsavel?: string; limit?: number; offset?: number }): Promise<CommercialLeadRecord[]> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filters?.status) {
      params.push(filters.status);
      where.push(`status_atual = $${params.length}`);
    }

    if (filters?.responsavel) {
      params.push(filters.responsavel);
      where.push(`responsavel = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 200);
    const offset = Math.max(filters?.offset ?? 0, 0);

    params.push(limit);
    params.push(offset);

    const result = await this.pool.query(
      `SELECT * FROM commercial_leads ${whereSql} ORDER BY updated_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async getDashboard(rangeDays?: number): Promise<CommercialDashboard> {
    const useRange = typeof rangeDays === 'number' && Number.isFinite(rangeDays) && rangeDays > 0;

    const params: unknown[] = [];
    const whereSql = useRange
      ? `WHERE data_entrada >= NOW() - ($1::text || ' days')::interval`
      : '';

    if (useRange) params.push(Math.floor(rangeDays as number));

    const result = await this.pool.query(
      `SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status_atual = 'novo_lead')::int as novos,
        COUNT(*) FILTER (WHERE status_atual IN ('diagnostico_agendado', 'diagnostico_concluido'))::int as diagnosticos,
        COUNT(*) FILTER (WHERE status_atual IN ('proposta_enviada', 'negociacao'))::int as propostas,
        COUNT(*) FILTER (WHERE status_atual = 'fechado')::int as fechados
      FROM commercial_leads
      ${whereSql}`,
      params,
    );

    const row = result.rows[0] || {};
    return {
      total: Number(row.total || 0),
      novos: Number(row.novos || 0),
      diagnosticos: Number(row.diagnosticos || 0),
      propostas: Number(row.propostas || 0),
      fechados: Number(row.fechados || 0),
      rangeDays: useRange ? Math.floor(rangeDays as number) : undefined,
    };
  }

  async updateLeadProofs(leadId: string, input: UpdateCommercialLeadProofsInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET contract_status = COALESCE($2, contract_status),
           payment_status = COALESCE($3, payment_status),
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [leadId, input.contractStatus ?? null, input.paymentStatus ?? null],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        leadId,
        current.status_atual,
        current.status_atual,
        'proofs-update',
        input.observacao || `proofs_update:${input.contractStatus || '-'}:${input.paymentStatus || '-'}`,
      ],
    );

    return this.mapRow(updated.rows[0]);
  }

  async updateLeadPrivacy(leadId: string, input: UpdateCommercialLeadPrivacyInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const consentGivenAt = input.consentGiven === true ? new Date().toISOString() : current.consent_given_at;

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET consent_given = COALESCE($2, consent_given),
           consent_given_at = $3,
           retention_until = COALESCE($4, retention_until),
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [leadId, input.consentGiven ?? null, consentGivenAt, input.retentionUntil ?? null],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        leadId,
        current.status_atual,
        current.status_atual,
        'privacy-update',
        input.observacao || 'privacy_update',
      ],
    );

    return this.mapRow(updated.rows[0]);
  }

  async updateLeadOnboarding(leadId: string, input: UpdateCommercialLeadOnboardingInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET onboarding_d0_ok = COALESCE($2, onboarding_d0_ok),
           onboarding_d1_ok = COALESCE($3, onboarding_d1_ok),
           onboarding_d2_ok = COALESCE($4, onboarding_d2_ok),
           onboarding_d3_d4_ok = COALESCE($5, onboarding_d3_d4_ok),
           onboarding_d5_d7_ok = COALESCE($6, onboarding_d5_d7_ok),
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [leadId, input.d0Ok ?? null, input.d1Ok ?? null, input.d2Ok ?? null, input.d3D4Ok ?? null, input.d5D7Ok ?? null],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        leadId,
        current.status_atual,
        current.status_atual,
        'onboarding-update',
        input.observacao || 'onboarding_update',
      ],
    );

    return this.mapRow(updated.rows[0]);
  }

  async submitLeadForm(leadId: string, input: SubmitCommercialFormInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const submittedAt = input.submittedAt || new Date().toISOString();

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET form_type = $2,
           form_submitted_at = $3,
           form_payload_json = $4::jsonb,
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [leadId, input.formType, submittedAt, JSON.stringify(input.payload || {})],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        leadId,
        current.status_atual,
        current.status_atual,
        'forms-webhook',
        `form_submit:${input.formType}`,
      ],
    );

    return this.mapRow(updated.rows[0]);
  }

  async ingestIntegrationEvent(input: IngestCommercialIntegrationEventInput): Promise<{ ok: true; eventId: string; leadId: string }> {
    const lead = await this.pool.query(
      'SELECT lead_id, status_atual FROM commercial_leads WHERE lead_id = $1 LIMIT 1',
      [input.leadId],
    );

    const current = lead.rows[0];
    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado para o evento de integração.');
    }

    const eventId = uuidv4();
    const occurredAt = input.occurredAt || new Date().toISOString();

    await this.pool.query(
      `INSERT INTO commercial_integration_events (
         id, lead_id, channel, event_type, external_event_id, payload_json, occurred_at
       ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [
        eventId,
        input.leadId,
        input.channel,
        input.eventType,
        input.externalEventId || null,
        JSON.stringify(input.payload || {}),
        occurredAt,
      ],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        input.leadId,
        current.status_atual,
        current.status_atual,
        `integration:${input.channel}`,
        `event:${input.eventType}`,
      ],
    );

    return { ok: true, eventId, leadId: input.leadId };
  }

  async dispatchStageCommunication(input: DispatchCommercialCommunicationInput): Promise<{ ok: true; leadId: string; channel: string; stage: string; eventId: string }> {
    if (!input.templateKey?.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'templateKey é obrigatório para disparo de comunicação.');
    }

    const recipient = await this.resolveDispatchRecipient(input.leadId, input.channel, input.recipient);
    const providerResult = await this.sendDispatchToProvider({
      leadId: input.leadId,
      channel: input.channel,
      stage: input.stage,
      templateKey: input.templateKey,
      recipient,
      variables: input.variables || {},
    });

    const event = await this.ingestIntegrationEvent({
      leadId: input.leadId,
      channel: input.channel,
      eventType: `dispatch:${input.stage}:${input.templateKey}`,
      externalEventId: providerResult.externalEventId,
      payload: {
        recipient,
        variables: input.variables || {},
        provider: providerResult.provider,
        providerAck: providerResult.ack,
      },
      occurredAt: new Date().toISOString(),
    });

    return {
      ok: true,
      leadId: input.leadId,
      channel: input.channel,
      stage: input.stage,
      eventId: event.eventId,
    };
  }

  private async resolveDispatchRecipient(leadId: string, channel: 'whatsapp' | 'gmail', explicitRecipient?: string): Promise<string> {
    if (explicitRecipient?.trim()) return explicitRecipient.trim();

    const lead = await this.pool.query(
      'SELECT lead_id, whatsapp FROM commercial_leads WHERE lead_id = $1 LIMIT 1',
      [leadId],
    );

    const current = lead.rows[0];
    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado para dispatch.');
    }

    if (channel === 'whatsapp' && current.whatsapp) {
      return String(current.whatsapp);
    }

    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      `Recipient é obrigatório para dispatch via ${channel}.`,
    );
  }

  private async sendDispatchToProvider(input: {
    leadId: string;
    channel: 'whatsapp' | 'gmail';
    stage: string;
    templateKey: string;
    recipient: string;
    variables: Record<string, unknown>;
  }): Promise<{ provider: string; externalEventId?: string; ack: Record<string, unknown> }> {
    const webhookEnvByChannel: Record<'whatsapp' | 'gmail', string | undefined> = {
      whatsapp: process.env.COMMERCIAL_DISPATCH_WHATSAPP_WEBHOOK_URL,
      gmail: process.env.COMMERCIAL_DISPATCH_GMAIL_WEBHOOK_URL,
    };

    const relayEnabled = process.env.COMMERCIAL_DISPATCH_TEMP_RELAY_ENABLED === 'true';
    const relayBaseUrl = process.env.COMMERCIAL_DISPATCH_TEMP_RELAY_BASE_URL || `http://127.0.0.1:${process.env.PORT || '3001'}`;
    const relaySecret = process.env.COMMERCIAL_DISPATCH_RELAY_SECRET;

    const webhookUrl = webhookEnvByChannel[input.channel]
      || (relayEnabled ? `${relayBaseUrl}/api/comercial/relay/${input.channel}` : undefined);

    if (!webhookUrl) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        `Webhook de dispatch não configurado para canal ${input.channel}.`,
      );
    }

    const signingSecret = process.env.COMMERCIAL_DISPATCH_WEBHOOK_SIGNING_SECRET;
    const sharedToken = process.env.COMMERCIAL_DISPATCH_SHARED_TOKEN;
    const timeoutMs = Number.parseInt(process.env.COMMERCIAL_DISPATCH_WEBHOOK_TIMEOUT_MS || '8000', 10);
    const maxRetries = Math.min(Math.max(Number.parseInt(process.env.COMMERCIAL_DISPATCH_WEBHOOK_MAX_RETRIES || '2', 10), 0), 5);
    const retryBaseMs = Math.min(Math.max(Number.parseInt(process.env.COMMERCIAL_DISPATCH_WEBHOOK_RETRY_BASE_MS || '500', 10), 100), 5000);

    const sentAt = new Date().toISOString();
    const body = {
      leadId: input.leadId,
      channel: input.channel,
      stage: input.stage,
      templateKey: input.templateKey,
      recipient: input.recipient,
      variables: input.variables,
      sentAt,
    };

    const rawPayload = JSON.stringify(body);
    const signature = signingSecret
      ? createHmac('sha256', signingSecret).update(`${sentAt}.${rawPayload}`).digest('hex')
      : undefined;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(relaySecret ? { 'x-relay-secret': relaySecret } : {}),
            ...(signature ? { 'x-dispatch-signature': signature, 'x-dispatch-timestamp': sentAt } : {}),
            ...(sharedToken ? { 'x-dispatch-shared-token': sharedToken } : {}),
          },
          body: rawPayload,
          signal: controller.signal,
        });

        const rawBody = await response.text();
        let parsedBody: Record<string, unknown> = {};
        if (rawBody) {
          try {
            parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
          } catch {
            parsedBody = { raw: rawBody };
          }
        }

        if (!response.ok) {
          throw new Error(`Falha no dispatch para ${input.channel}: HTTP ${response.status}`);
        }

        const externalEventId =
          (typeof parsedBody.externalEventId === 'string' && parsedBody.externalEventId) ||
          (typeof parsedBody.messageId === 'string' && parsedBody.messageId) ||
          (typeof parsedBody.id === 'string' && parsedBody.id) ||
          undefined;

        return {
          provider: webhookUrl.includes('/api/comercial/relay/') ? 'temp-relay' : 'webhook',
          externalEventId,
          ack: {
            ...parsedBody,
            retryAttempt: attempt,
            retriesConfigured: maxRetries,
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Falha desconhecida no dispatch');
        if (attempt === maxRetries) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, retryBaseMs * (attempt + 1)));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError || new Error(`Falha no dispatch para ${input.channel}`);
  }

  async getLeadFormLink(leadId: string, formType: CommercialFormType): Promise<CommercialFormLink> {
    const existing = await this.pool.query('SELECT lead_id, form_token FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    let token = current.form_token as string | null;
    if (!token) {
      token = uuidv4();
      await this.pool.query(
        `UPDATE commercial_leads SET form_token = $2, updated_at = NOW() WHERE lead_id = $1`,
        [leadId, token],
      );
    }

    return this.getFormLink(leadId, formType, token);
  }

  async getDailySummary(): Promise<CommercialDailySummary> {
    const result = await this.pool.query(`
      WITH today AS (
        SELECT DATE_TRUNC('day', NOW()) AS start_day,
               DATE_TRUNC('day', NOW()) + INTERVAL '1 day' AS end_day
      )
      SELECT
        TO_CHAR(NOW(), 'YYYY-MM-DD') AS date,
        (SELECT COUNT(*)::int FROM commercial_leads c, today t
          WHERE c.data_entrada >= t.start_day AND c.data_entrada < t.end_day) AS novos_leads,
        (SELECT COUNT(*)::int FROM commercial_leads
          WHERE status_atual NOT IN ('fechado','perdido')
            AND updated_at <= NOW() - INTERVAL '24 hours') AS leads_atrasados_sla_24h,
        (SELECT COUNT(*)::int FROM commercial_leads
          WHERE status_atual = 'proposta_enviada'
            AND (followup_d2_at IS NULL OR followup_d5_at IS NULL)) AS propostas_sem_followup,
        (SELECT COUNT(*)::int FROM commercial_leads
          WHERE status_atual = 'negociacao') AS negociacoes_abertas,
        (SELECT COUNT(*)::int FROM commercial_leads c, today t
          WHERE c.status_atual = 'fechado'
            AND c.updated_at >= t.start_day AND c.updated_at < t.end_day) AS fechados_hoje
    `);

    const row = result.rows[0] || {};
    return {
      date: row.date || new Date().toISOString().slice(0, 10),
      novosLeads: Number(row.novos_leads || 0),
      leadsAtrasadosSla24h: Number(row.leads_atrasados_sla_24h || 0),
      propostasSemFollowup: Number(row.propostas_sem_followup || 0),
      negociacoesAbertas: Number(row.negociacoes_abertas || 0),
      fechadosHoje: Number(row.fechados_hoje || 0),
    };
  }

  async listIntegrationEvents(leadId: string, limit = 50): Promise<CommercialIntegrationEvent[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const result = await this.pool.query(
      `SELECT id, lead_id, channel, event_type, external_event_id, payload_json, occurred_at, created_at
       FROM commercial_integration_events
       WHERE lead_id = $1
       ORDER BY occurred_at DESC
       LIMIT $2`,
      [leadId, safeLimit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      leadId: row.lead_id,
      channel: row.channel,
      eventType: row.event_type,
      externalEventId: row.external_event_id || undefined,
      payload: row.payload_json || undefined,
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
    }));
  }

  async listLeadTimeline(leadId: string, limit = 50): Promise<CommercialLeadTimelineEvent[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const result = await this.pool.query(
      `SELECT id, lead_id, status_origem, status_destino, actor, observacao, created_at
       FROM commercial_lead_transitions
       WHERE lead_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [leadId, safeLimit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      leadId: row.lead_id,
      statusOrigem: row.status_origem,
      statusDestino: row.status_destino,
      actor: row.actor || undefined,
      observacao: row.observacao || undefined,
      createdAt: row.created_at,
    }));
  }

  async listRetentionDue(limit = 50): Promise<CommercialRetentionAlert[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const result = await this.pool.query(
      `SELECT
         lead_id,
         nome_escritorio,
         responsavel,
         retention_until,
         ROUND(EXTRACT(EPOCH FROM (NOW() - retention_until)) / 86400.0, 1) AS days_overdue
       FROM commercial_leads
       WHERE retention_until IS NOT NULL
         AND retention_until <= NOW()
         AND status_atual NOT IN ('perdido')
       ORDER BY retention_until ASC
       LIMIT $1`,
      [safeLimit],
    );

    return result.rows.map((row) => ({
      leadId: row.lead_id,
      nomeEscritorio: row.nome_escritorio,
      responsavel: row.responsavel,
      retentionUntil: row.retention_until,
      daysOverdue: Number(row.days_overdue || 0),
    }));
  }

  async listFollowupsDue(limit = 50): Promise<CommercialFollowupDue[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const result = await this.pool.query(
      `(
        SELECT lead_id, nome_escritorio, responsavel, status_atual, 'D+2'::text AS followup_type, followup_d2_at AS due_at
        FROM commercial_leads
        WHERE status_atual IN ('proposta_enviada', 'negociacao')
          AND followup_d2_at IS NOT NULL
          AND followup_d2_at <= NOW()
      )
      UNION ALL
      (
        SELECT lead_id, nome_escritorio, responsavel, status_atual, 'D+5'::text AS followup_type, followup_d5_at AS due_at
        FROM commercial_leads
        WHERE status_atual IN ('proposta_enviada', 'negociacao')
          AND followup_d5_at IS NOT NULL
          AND followup_d5_at <= NOW()
      )
      ORDER BY due_at ASC
      LIMIT $1`,
      [safeLimit],
    );

    return result.rows.map((row) => ({
      leadId: row.lead_id,
      nomeEscritorio: row.nome_escritorio,
      responsavel: row.responsavel,
      statusAtual: row.status_atual as CommercialLeadStatus,
      followupType: row.followup_type as 'D+2' | 'D+5',
      dueAt: row.due_at,
    }));
  }

  async listSlaAlerts(maxAgeHours = 24, limit = 50): Promise<CommercialSlaAlert[]> {
    const safeMaxAge = Math.min(Math.max(maxAgeHours, 1), 168);
    const safeLimit = Math.min(Math.max(limit, 1), 200);

    const result = await this.pool.query(
      `SELECT
         lead_id,
         nome_escritorio,
         status_atual,
         responsavel,
         updated_at,
         ROUND(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600.0, 1) AS hours_in_status
       FROM commercial_leads
       WHERE status_atual NOT IN ('fechado', 'perdido')
         AND updated_at <= NOW() - ($1::text || ' hours')::interval
       ORDER BY updated_at ASC
       LIMIT $2`,
      [safeMaxAge, safeLimit],
    );

    return result.rows.map((row) => ({
      leadId: row.lead_id,
      nomeEscritorio: row.nome_escritorio,
      statusAtual: row.status_atual as CommercialLeadStatus,
      responsavel: row.responsavel,
      updatedAt: row.updated_at,
      hoursInStatus: Number(row.hours_in_status || 0),
    }));
  }

  async moveLeadStatus(leadId: string, input: MoveLeadStatusInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const from = current.status_atual as CommercialLeadStatus;
    validateLeadTransition(from, input);

    if (input.to === 'proposta_enviada' && current.form_type !== 'briefing') {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Para enviar proposta, o briefing do lead precisa estar submetido.',
      );
    }

    if (input.to === 'proposta_enviada' && current.consent_given !== true) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Para enviar proposta, o consentimento LGPD deve estar confirmado.',
      );
    }

    if (input.to === 'fechado' && (current.contract_status !== 'assinado' || current.payment_status !== 'pago')) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Para fechar o lead, assinatura e pagamento inicial devem estar confirmados.',
      );
    }

    const nextDor01 = input.to === 'diagnostico_agendado' ? Boolean(input.dor01Ok) : current.dor01_ok;
    const nextDor02 = input.to === 'proposta_enviada' ? Boolean(input.dor02Ok) : current.dor02_ok;
    const nextDor03 = input.to === 'fechado' ? Boolean(input.dor03Ok) : current.dor03_ok;

    const followupD2At =
      input.to === 'proposta_enviada'
        ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        : current.followup_d2_at;

    const followupD5At =
      input.to === 'proposta_enviada'
        ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        : current.followup_d5_at;

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET status_atual = $2,
           dor01_ok = $3,
           dor02_ok = $4,
           dor03_ok = $5,
           motivo_nutricao = $6,
           motivo_perda = $7,
           data_proxima_acao = $8,
           followup_d2_at = $9,
           followup_d5_at = $10,
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [
        leadId,
        input.to,
        nextDor01,
        nextDor02,
        nextDor03,
        input.to === 'nutricao' ? input.motivoNutricao || null : current.motivo_nutricao,
        input.to === 'perdido' ? input.motivoPerda || null : current.motivo_perda,
        input.to === 'nutricao' ? input.dataProximaAcao || null : current.data_proxima_acao,
        followupD2At,
        followupD5At,
      ],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), leadId, from, input.to, input.actor || null, input.observacao || null],
    );

    return this.mapRow(updated.rows[0]);
  }

  private mapRow(row: any): CommercialLeadRecord {
    return {
      leadId: row.lead_id,
      dataEntrada: row.data_entrada,
      origem: row.origem,
      nomeEscritorio: row.nome_escritorio,
      instagram: row.instagram || undefined,
      whatsapp: row.whatsapp || undefined,
      cidade: row.cidade || undefined,
      areaPrincipal: row.area_principal || undefined,
      statusAtual: row.status_atual,
      responsavel: row.responsavel,
      proximaAcao: row.proxima_acao || undefined,
      dataProximaAcao: row.data_proxima_acao || undefined,
      motivoNutricao: row.motivo_nutricao || undefined,
      motivoPerda: row.motivo_perda || undefined,
      dor01Ok: row.dor01_ok,
      dor02Ok: row.dor02_ok,
      dor03Ok: row.dor03_ok,
      formToken: row.form_token || undefined,
      formType: row.form_type || undefined,
      formSubmittedAt: row.form_submitted_at || undefined,
      formPayloadJson: row.form_payload_json || undefined,
      contractStatus: (row.contract_status || 'pendente') as ContractStatus,
      paymentStatus: (row.payment_status || 'pendente') as PaymentStatus,
      followupD2At: row.followup_d2_at || undefined,
      followupD5At: row.followup_d5_at || undefined,
      onboardingD0Ok: Boolean(row.onboarding_d0_ok),
      onboardingD1Ok: Boolean(row.onboarding_d1_ok),
      onboardingD2Ok: Boolean(row.onboarding_d2_ok),
      onboardingD3D4Ok: Boolean(row.onboarding_d3_d4_ok),
      onboardingD5D7Ok: Boolean(row.onboarding_d5_d7_ok),
      consentGiven: Boolean(row.consent_given),
      consentGivenAt: row.consent_given_at || undefined,
      retentionUntil: row.retention_until || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
