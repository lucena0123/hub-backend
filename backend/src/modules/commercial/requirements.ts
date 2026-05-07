import type { Pool } from 'pg';
import type { CommercialRequirementType } from './types';

export async function evaluateRequirementSystem(
  pool: Pool,
  leadId: string,
  lead: any,
  requirement: any,
): Promise<{ satisfied: boolean; reason?: string; evidence?: Record<string, unknown> }> {
  const config = (requirement.config_json || {}) as Record<string, unknown>;
  const type = requirement.requirement_type as CommercialRequirementType;

  if (type === 'field') {
    const mode = String(config.mode || '').trim().toLowerCase();
    if (mode === 'contact_any') {
      const satisfied = Boolean(lead.whatsapp || lead.email);
      return {
        satisfied,
        reason: satisfied ? undefined : 'WhatsApp ou e-mail é obrigatório.',
        evidence: { whatsapp: Boolean(lead.whatsapp), email: Boolean(lead.email) },
      };
    }

    if (mode === 'observacao_min_length') {
      const min = Number(config.min || 10);
      const summary = await pool.query(
        `SELECT observacao
         FROM commercial_lead_transitions
         WHERE lead_id = $1
           AND status_destino = 'diagnostico_concluido'
           AND observacao IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [leadId],
      );
      const text = String(summary.rows[0]?.observacao || '');
      const satisfied = text.trim().length >= min;
      return {
        satisfied,
        reason: satisfied ? undefined : `Resumo de diagnóstico exige mínimo de ${min} caracteres.`,
        evidence: { length: text.trim().length, min },
      };
    }

    if (mode === 'followup_any') {
      const satisfied = Boolean(lead.followup_d2_at || lead.followup_d5_at);
      return {
        satisfied,
        reason: satisfied ? undefined : 'Lead sem follow-up configurado.',
      };
    }

    const field = String(config.field || '').trim().toLowerCase();
    const equals = config.equals;
    if (field) {
      const current = lead[field];
      const satisfied = equals !== undefined ? String(current || '') === String(equals) : Boolean(current);
      return {
        satisfied,
        reason: satisfied ? undefined : `Campo obrigatório pendente: ${field}.`,
        evidence: { field, current },
      };
    }

    return { satisfied: false, reason: `Configuração inválida para requisito ${requirement.requirement_key}.` };
  }

  if (type === 'boolean') {
    const source = String(config.source || '').trim().toLowerCase();
    const equals = config.equals;
    const current = lead[source];
    const satisfied =
      equals !== undefined
        ? String(current ?? '').toLowerCase() === String(equals).toLowerCase()
        : Boolean(current);
    return {
      satisfied,
      reason: satisfied ? undefined : `Condição booleana pendente: ${source}.`,
      evidence: { source, current, equals: equals ?? true },
    };
  }

  if (type === 'file') {
    const assetType = String(config.assetType || '').trim();
    if (!assetType) {
      return { satisfied: false, reason: `assetType ausente em ${requirement.requirement_key}.` };
    }
    const assetResult = await pool.query(
      `SELECT id
       FROM commercial_assets
       WHERE lead_id = $1
         AND asset_type = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [leadId, assetType],
    );
    const satisfied = Boolean(assetResult.rows[0]);
    return {
      satisfied,
      reason: satisfied ? undefined : `Arquivo obrigatório ausente (${assetType}).`,
    };
  }

  if (type === 'event') {
    const eventType = String(config.eventType || '').trim();
    if (!eventType) {
      return { satisfied: false, reason: `eventType ausente em ${requirement.requirement_key}.` };
    }

    if (eventType === 'calendar:meeting_scheduled' && lead.cal_event_id) {
      return { satisfied: true };
    }

    const eventResult = await pool.query(
      `SELECT id
       FROM commercial_integration_events
       WHERE lead_id = $1
         AND event_type = $2
       ORDER BY occurred_at DESC
       LIMIT 1`,
      [leadId, eventType],
    );
    const satisfied = Boolean(eventResult.rows[0]);
    return {
      satisfied,
      reason: satisfied ? undefined : `Evento obrigatório ausente (${eventType}).`,
    };
  }

  return {
    satisfied: false,
    reason: `Tipo de requisito não suportado: ${type}`,
  };
}
