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

export interface CommercialDashboard {
  total: number;
  novos: number;
  diagnosticos: number;
  propostas: number;
  fechados: number;
  rangeDays?: number;
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

  if (to === 'perdido' && !input.motivoPerda) {
    throw new CommercialFlowError('VALIDATION_ERROR', 'Perdido exige motivo da perda.');
  }
}

export class CommercialLeadsService {
  constructor(private pool: Pool) {}

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

      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_token TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_type TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_submitted_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_payload_json JSONB;

      CREATE INDEX IF NOT EXISTS idx_commercial_leads_status ON commercial_leads(status_atual);
      CREATE INDEX IF NOT EXISTS idx_commercial_leads_responsavel ON commercial_leads(responsavel);
      CREATE INDEX IF NOT EXISTS idx_commercial_leads_form_type ON commercial_leads(form_type);
      CREATE INDEX IF NOT EXISTS idx_commercial_transitions_lead ON commercial_lead_transitions(lead_id);
    `);
  }

  async createLead(input: CreateCommercialLeadInput): Promise<CommercialLeadRecord> {
    const leadId = uuidv4();
    const formToken = uuidv4();

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

    const nextDor01 = input.to === 'diagnostico_agendado' ? Boolean(input.dor01Ok) : current.dor01_ok;
    const nextDor02 = input.to === 'proposta_enviada' ? Boolean(input.dor02Ok) : current.dor02_ok;
    const nextDor03 = input.to === 'fechado' ? Boolean(input.dor03Ok) : current.dor03_ok;

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET status_atual = $2,
           dor01_ok = $3,
           dor02_ok = $4,
           dor03_ok = $5,
           motivo_nutricao = $6,
           motivo_perda = $7,
           data_proxima_acao = $8,
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
