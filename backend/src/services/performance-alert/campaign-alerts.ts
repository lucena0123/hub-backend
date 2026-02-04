import type { Pool } from 'pg';

import type { PerformanceAlert } from './types';
import { formatCurrency, formatPercent, percentChange, safeFloat, safeInt } from './utils';

export const buildCampaignPerformanceAlerts = async (pool: Pool): Promise<PerformanceAlert[]> => {
  const alerts: PerformanceAlert[] = [];

  // Campaign metrics: last 7 days vs previous 7 days (last 14 days total window).
  const campaigns = await pool.query(`
    SELECT
      c.id as campaign_id,
      c.name as campaign_name,
      c.status as campaign_status,
      c."clientId" as client_id,
      cl.name as client_name,
      c.budget,
      c.platform,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.spend ELSE 0 END), 0) as spend_last7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '14 days' AND cm.date < CURRENT_DATE - INTERVAL '7 days' THEN cm.spend ELSE 0 END), 0) as spend_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.revenue ELSE 0 END), 0) as revenue_last7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.clicks ELSE 0 END), 0) as clicks_last7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.impressions ELSE 0 END), 0) as impressions_last7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.conversions ELSE 0 END), 0) as conversions_last7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '14 days' AND cm.date < CURRENT_DATE - INTERVAL '7 days' THEN cm.conversions ELSE 0 END), 0) as conversions_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.leads ELSE 0 END), 0) as leads_last7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '14 days' AND cm.date < CURRENT_DATE - INTERVAL '7 days' THEN cm.leads ELSE 0 END), 0) as leads_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.messaging_conversations ELSE 0 END), 0) as messaging_conversations_last7,
      COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '14 days' AND cm.date < CURRENT_DATE - INTERVAL '7 days' THEN cm.messaging_conversations ELSE 0 END), 0) as messaging_conversations_prev7
    FROM campaigns c
    JOIN clients cl ON c."clientId" = cl.id
    LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id
      AND cm.date >= CURRENT_DATE - INTERVAL '14 days'
    GROUP BY c.id, c.name, c.status, c."clientId", cl.name, c.budget, c.platform
  `);

  // Manual lead tracking: qualified leads (last 7 days vs previous 7 days).
  const leadTrackingAgg = await pool.query(`
    SELECT
      campaign_id,
      COUNT(*) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '7 days')::int as tracking_records_last7,
      COALESCE(SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN qualified_leads ELSE 0 END), 0)::int as qualified_last7,
      COALESCE(SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '14 days' AND date < CURRENT_DATE - INTERVAL '7 days' THEN qualified_leads ELSE 0 END), 0)::int as qualified_prev7
    FROM campaign_lead_tracking
    WHERE date >= CURRENT_DATE - INTERVAL '14 days'
    GROUP BY campaign_id
  `);

  const leadTrackingByCampaign = new Map<string, { recordsLast7: number; qualifiedLast7: number; qualifiedPrev7: number }>();
  for (const row of leadTrackingAgg.rows) {
    leadTrackingByCampaign.set(String(row.campaign_id), {
      recordsLast7: safeInt(row.tracking_records_last7),
      qualifiedLast7: safeInt(row.qualified_last7),
      qualifiedPrev7: safeInt(row.qualified_prev7),
    });
  }

  // Disqualification reasons (manual) for the last 7 days, per campaign.
  const reasonsAgg = await pool.query(`
    SELECT
      lt.campaign_id,
      e.key as reason_key,
      SUM((e.value)::int)::int as total_count
    FROM campaign_lead_tracking lt
    CROSS JOIN LATERAL jsonb_each_text(COALESCE(lt.disqualification_reasons, '{}'::jsonb)) e(key, value)
    WHERE lt.date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY lt.campaign_id, e.key
  `);

  const reasonsByCampaign = new Map<string, Array<{ key: string; count: number }>>();
  for (const row of reasonsAgg.rows) {
    const campaignId = String(row.campaign_id);
    const list = reasonsByCampaign.get(campaignId) ?? [];
    list.push({ key: String(row.reason_key), count: safeInt(row.total_count) });
    reasonsByCampaign.set(campaignId, list);
  }

  for (const camp of campaigns.rows) {
    const spendLast7 = safeFloat(camp.spend_last7);
    const spendPrev7 = safeFloat(camp.spend_prev7);
    const revenueLast7 = safeFloat(camp.revenue_last7);
    const clicksLast7 = safeInt(camp.clicks_last7);
    const impressionsLast7 = safeInt(camp.impressions_last7);
    const conversionsLast7 = safeInt(camp.conversions_last7);
    const conversionsPrev7 = safeInt(camp.conversions_prev7);
    const leadsLast7 = safeInt(camp.leads_last7);
    const leadsPrev7 = safeInt(camp.leads_prev7);
    const messagingLast7 = safeInt(camp.messaging_conversations_last7);
    const messagingPrev7 = safeInt(camp.messaging_conversations_prev7);
    const budget = safeFloat(camp.budget);
    const campaignStatus = String(camp.campaign_status || '');

    const isMessagingCampaign = messagingLast7 > 0 || messagingPrev7 > 0;
    const contactsLast7 = messagingLast7 > 0 ? messagingLast7 : leadsLast7 > 0 ? leadsLast7 : conversionsLast7;
    const contactsPrev7 = messagingPrev7 > 0 ? messagingPrev7 : leadsPrev7 > 0 ? leadsPrev7 : conversionsPrev7;

    const costPerContact = contactsLast7 > 0 ? spendLast7 / contactsLast7 : 0;
    const costPerContactPrev7 = contactsPrev7 > 0 ? spendPrev7 / contactsPrev7 : 0;

    const leadTracking = leadTrackingByCampaign.get(String(camp.campaign_id)) ?? {
      recordsLast7: 0,
      qualifiedLast7: 0,
      qualifiedPrev7: 0,
    };

    const qualificationRate =
      contactsLast7 > 0 && leadTracking.qualifiedLast7 > 0 && leadTracking.qualifiedLast7 <= contactsLast7
        ? (leadTracking.qualifiedLast7 / contactsLast7) * 100
        : null;

    const costPerQualified = leadTracking.qualifiedLast7 > 0 ? spendLast7 / leadTracking.qualifiedLast7 : null;

    const topReasons = (reasonsByCampaign.get(String(camp.campaign_id)) ?? [])
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map((r) => `${r.key.replaceAll('_', ' ')} (${r.count})`)
      .join(', ');

    // Ignore campaigns with no delivery (unless they are marked active, then we want to warn).
    if (spendLast7 === 0 && impressionsLast7 === 0) {
      if (campaignStatus === 'active') {
        alerts.push({
          id: `stalled-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'warning',
          category: 'stalled',
          message:
            'Campanha está ativa, mas não teve entrega (sem impressões/gasto) nos últimos 7 dias. Verifique status, público e limites de orçamento.',
          metric: 'Delivery',
          currentValue: 0,
          threshold: 1,
          createdAt: new Date().toISOString(),
        });
      }
      continue;
    }

    // Lead-gen "no results" alert: spend but no contacts.
    if (spendLast7 > 100 && contactsLast7 === 0) {
      alerts.push({
        id: `no-contacts-${camp.campaign_id}`,
        clientId: camp.client_id,
        clientName: camp.client_name,
        campaignId: camp.campaign_id,
        campaignName: camp.campaign_name,
        type: 'critical',
        category: 'contacts',
        message: `${formatCurrency(spendLast7)} de investimento nos últimos 7 dias sem gerar nenhum contato. Campanha precisa de ajuste imediato.`,
        metric: 'Contatos',
        currentValue: 0,
        threshold: 1,
        createdAt: new Date().toISOString(),
      });
    }

    // Trend: sharp drop in contacts week-over-week.
    const contactsDelta = percentChange(contactsLast7, contactsPrev7);
    if (contactsPrev7 >= 10 && contactsDelta !== null && contactsDelta <= -50) {
      alerts.push({
        id: `contacts-drop-${camp.campaign_id}`,
        clientId: camp.client_id,
        clientName: camp.client_name,
        campaignId: camp.campaign_id,
        campaignName: camp.campaign_name,
        type: 'warning',
        category: 'trend',
        message: `Queda brusca de contatos: ${contactsPrev7} → ${contactsLast7} (${formatPercent(contactsDelta)}). Pode ser fadiga de criativo ou mudança de público.`,
        metric: 'Contatos',
        currentValue: contactsLast7,
        threshold: contactsPrev7,
        createdAt: new Date().toISOString(),
      });
    }

    // Trend: cost per contact increased significantly.
    const cpcChange = percentChange(costPerContact, costPerContactPrev7);
    if (contactsPrev7 >= 10 && contactsLast7 >= 5 && cpcChange !== null && cpcChange >= 40) {
      alerts.push({
        id: `cpl-rise-${camp.campaign_id}`,
        clientId: camp.client_id,
        clientName: camp.client_name,
        campaignId: camp.campaign_id,
        campaignName: camp.campaign_name,
        type: 'warning',
        category: 'trend',
        message: `Custo por contato subiu: ${formatCurrency(costPerContactPrev7)} → ${formatCurrency(costPerContact)} (${formatPercent(cpcChange)}). Recomenda-se testar novos criativos.`,
        metric: 'Custo por contato',
        currentValue: costPerContact,
        threshold: costPerContactPrev7,
        createdAt: new Date().toISOString(),
      });
    }

    // Manual qualification tracking reminders / quality alerts.
    if (contactsLast7 > 0 && spendLast7 > 150 && leadTracking.recordsLast7 === 0) {
      alerts.push({
        id: `no-qualification-data-${camp.campaign_id}`,
        clientId: camp.client_id,
        clientName: camp.client_name,
        campaignId: camp.campaign_id,
        campaignName: camp.campaign_name,
        type: 'info',
        category: 'qualification',
        message: `Há ${contactsLast7} contatos esta semana, mas não há registros de qualificação. Preencha “Dados do Funil” para medir o custo por interessado real.`,
        metric: 'Qualificação',
        currentValue: 0,
        threshold: 1,
        createdAt: new Date().toISOString(),
      });
    }

    if (leadTracking.recordsLast7 > 0 && contactsLast7 > 0) {
      if (spendLast7 > 150 && leadTracking.qualifiedLast7 === 0) {
        alerts.push({
          id: `no-qualified-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'critical',
          category: 'qualification',
          message: `Contatos sem nenhum qualificado nesta semana com ${formatCurrency(spendLast7)} de gasto. Verifique mensagem, triagem e atendimento. ${topReasons ? `Motivos comuns: ${topReasons}.` : ''}`,
          metric: 'Qualificados',
          currentValue: 0,
          threshold: 1,
          createdAt: new Date().toISOString(),
        });
      }

      if (qualificationRate !== null && qualificationRate < 12) {
        alerts.push({
          id: `low-qualification-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: qualificationRate < 8 ? 'critical' : 'warning',
          category: 'qualification',
          message: `Qualificação baixa: ${leadTracking.qualifiedLast7} qualificados em ${contactsLast7} contatos (${formatPercent(qualificationRate)}). ${costPerQualified != null ? `Custo por qualificado: ${formatCurrency(costPerQualified)}.` : ''} ${topReasons ? `Motivos comuns: ${topReasons}.` : ''}`,
          metric: 'Qualificação',
          currentValue: qualificationRate,
          threshold: 12,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Budget sanity
    if (budget > 0 && spendLast7 > budget) {
      const utilization = (spendLast7 / budget) * 100;
      alerts.push({
        id: `budget-over-${camp.campaign_id}`,
        clientId: camp.client_id,
        clientName: camp.client_name,
        campaignId: camp.campaign_id,
        campaignName: camp.campaign_name,
        type: 'warning',
        category: 'budget',
        message: `Orçamento excedido em ${(utilization - 100).toFixed(1)}%. Gasto: ${formatCurrency(spendLast7)} / Budget: ${formatCurrency(budget)}.`,
        metric: 'Budget',
        currentValue: utilization,
        threshold: 100,
        createdAt: new Date().toISOString(),
      });
    }

    // Keep some classic alerts for non-messaging objectives (optional).
    if (!isMessagingCampaign) {
      const roas = spendLast7 > 0 ? revenueLast7 / spendLast7 : 0;
      const ctr = impressionsLast7 > 0 ? (clicksLast7 / impressionsLast7) * 100 : 0;

      if (roas > 0 && roas < 2) {
        alerts.push({
          id: `roas-critical-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'critical',
          category: 'roas',
          message: `ROAS de ${roas.toFixed(2)}x está abaixo do mínimo recomendado (2x).`,
          metric: 'ROAS',
          currentValue: roas,
          threshold: 2,
          createdAt: new Date().toISOString(),
        });
      } else if (roas > 0 && roas < 5) {
        alerts.push({
          id: `roas-warning-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'warning',
          category: 'roas',
          message: `ROAS de ${roas.toFixed(2)}x está abaixo da meta (5x).`,
          metric: 'ROAS',
          currentValue: roas,
          threshold: 5,
          createdAt: new Date().toISOString(),
        });
      }

      if (ctr > 0 && ctr < 1) {
        alerts.push({
          id: `ctr-critical-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'critical',
          category: 'ctr',
          message: `CTR de ${ctr.toFixed(2)}% é muito baixo. Revise criativos e segmentação.`,
          metric: 'CTR',
          currentValue: ctr,
          threshold: 1,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return alerts;
};

