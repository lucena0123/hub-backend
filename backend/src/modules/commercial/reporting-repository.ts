import type { Pool } from 'pg';
import type {
  CommercialDailySummary,
  CommercialDispatchHealthByChannel,
  CommercialDispatchHealthSummary,
  CommercialFollowupDue,
  CommercialIntegrationEvent,
  CommercialLeadStatus,
  CommercialLeadTimelineEvent,
  CommercialRetentionAlert,
  CommercialSlaAlert,
} from './types';

export class CommercialReportingRepository {
  constructor(private readonly pool: Pool) {}

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

  async getDispatchHealthSummary(windowDays = 7): Promise<CommercialDispatchHealthSummary> {
    const safeWindowDays = Math.min(Math.max(windowDays, 1), 90);

    const result = await this.pool.query(
      `WITH dispatch_events AS (
         SELECT
           channel,
           COALESCE((payload_json->'providerAck'->>'ok')::boolean, false) AS ack_ok,
           CASE WHEN external_event_id IS NOT NULL AND external_event_id <> '' THEN true ELSE false END AS has_external_id
         FROM commercial_integration_events
         WHERE event_type LIKE 'dispatch:%'
           AND occurred_at >= NOW() - ($1::text || ' days')::interval
       )
       SELECT
         channel,
         COUNT(*)::int AS total,
         SUM(CASE WHEN (ack_ok OR has_external_id) THEN 1 ELSE 0 END)::int AS success,
         SUM(CASE WHEN NOT (ack_ok OR has_external_id) THEN 1 ELSE 0 END)::int AS failed
       FROM dispatch_events
       GROUP BY channel
       ORDER BY channel ASC`,
      [safeWindowDays],
    );

    const byChannel: CommercialDispatchHealthByChannel[] = result.rows.map((row) => {
      const total = Number(row.total || 0);
      const success = Number(row.success || 0);
      const failed = Number(row.failed || 0);
      return {
        channel: String(row.channel || 'unknown'),
        total,
        success,
        failed,
        successRate: total > 0 ? Number(((success / total) * 100).toFixed(1)) : 0,
      };
    });

    const total = byChannel.reduce((acc, item) => acc + item.total, 0);
    const success = byChannel.reduce((acc, item) => acc + item.success, 0);
    const failed = byChannel.reduce((acc, item) => acc + item.failed, 0);

    return {
      windowDays: safeWindowDays,
      total,
      success,
      failed,
      successRate: total > 0 ? Number(((success / total) * 100).toFixed(1)) : 0,
      byChannel,
    };
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
}
