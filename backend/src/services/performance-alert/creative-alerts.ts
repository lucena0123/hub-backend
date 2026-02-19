import type { Pool } from 'pg';

import { OPTIMIZATION_CENTER_PLAYBOOK_V1 } from '../optimization-playbook';

import type { PerformanceAlert } from './types';
import { formatCurrency, formatPercent, percentChange, safeFloat, safeInt } from './utils';

const truncate = (value: string, max = 72) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1))}…`;
};

const formatCreativeLabel = (row: any) => {
  const headline = typeof row.headline === 'string' ? row.headline.trim() : '';
  if (headline) return truncate(headline, 80);

  const primaryText = typeof row.primary_text === 'string' ? row.primary_text.trim() : '';
  if (primaryText) return truncate(primaryText, 80);

  const snapshotId = typeof row.creative_snapshot_id === 'string' ? row.creative_snapshot_id : '';
  if (snapshotId) return `snapshot ${snapshotId.slice(0, 8)}`;

  return 'criativo';
};

export const buildCreativeAlerts = async (pool: Pool): Promise<PerformanceAlert[]> => {
  const alerts: PerformanceAlert[] = [];
  const createdAt = new Date().toISOString();

  const {
    creativeMinSpendWinner,
    creativeMinSpendLoser,
    creativeFatigueMinPrevConversations,
    creativeFatigueDropPct,
    creativeFatigueMinSpend,
    creativeFatigueCplMultiplier,
    hookRateMin,
    holdRateMin,
  } = OPTIMIZATION_CENTER_PLAYBOOK_V1.defaults;

  const loserZeroRows = await pool.query(
    `
      WITH creative_agg AS (
        SELECT
          cl.id as client_id,
          cl.name as client_name,
          c.id as campaign_id,
          c.name as campaign_name,
          m.creative_snapshot_id,
          COALESCE(SUM(m.spend), 0) as spend_last7,
          COALESCE(SUM(m.messaging_conversations), 0)::int as conv_last7
        FROM ad_creative_metrics m
        JOIN campaigns c ON c.id = m.campaign_id
        JOIN clients cl ON cl.id = c."clientId"
        WHERE m.date >= CURRENT_DATE - INTERVAL '7 days'
          AND m.creative_snapshot_id IS NOT NULL
        GROUP BY cl.id, cl.name, c.id, c.name, m.creative_snapshot_id
      )
      SELECT
        a.*,
        s.headline,
        s.primary_text,
        s.cta_type
      FROM creative_agg a
      LEFT JOIN ad_creative_snapshots s ON s.id = a.creative_snapshot_id
      WHERE a.spend_last7 >= $1 AND a.conv_last7 = 0
      ORDER BY a.spend_last7 DESC
      LIMIT 25
    `,
    [creativeMinSpendLoser]
  );

  for (const row of loserZeroRows.rows) {
    const spendLast7 = safeFloat(row.spend_last7);
    const severity: PerformanceAlert['type'] = spendLast7 >= 400 ? 'critical' : 'warning';

    alerts.push({
      id: `creative-loser-zero-${row.campaign_id}-${row.creative_snapshot_id}`,
      clientId: String(row.client_id),
      clientName: String(row.client_name),
      campaignId: String(row.campaign_id),
      campaignName: String(row.campaign_name),
      type: severity,
      category: 'creative',
      message: `Criativo sem conversas na última semana: “${formatCreativeLabel(row)}” (gasto ${formatCurrency(spendLast7)}). Pausar/substituir criativo ou revisar público/copy.`,
      metric: 'Conversas (7d)',
      currentValue: 0,
      threshold: 1,
      createdAt,
    });
  }

  const fatigueRows = await pool.query(
    `
      WITH creative_agg AS (
        SELECT
          cl.id as client_id,
          cl.name as client_name,
          c.id as campaign_id,
          c.name as campaign_name,
          m.creative_snapshot_id,
          COALESCE(SUM(CASE WHEN m.date >= CURRENT_DATE - INTERVAL '7 days' THEN m.spend ELSE 0 END), 0) as spend_last7,
          COALESCE(SUM(CASE WHEN m.date >= CURRENT_DATE - INTERVAL '7 days' THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_last7,
          COALESCE(SUM(CASE WHEN m.date >= CURRENT_DATE - INTERVAL '14 days' AND m.date < CURRENT_DATE - INTERVAL '7 days' THEN m.spend ELSE 0 END), 0) as spend_prev7,
          COALESCE(SUM(CASE WHEN m.date >= CURRENT_DATE - INTERVAL '14 days' AND m.date < CURRENT_DATE - INTERVAL '7 days' THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_prev7
        FROM ad_creative_metrics m
        JOIN campaigns c ON c.id = m.campaign_id
        JOIN clients cl ON cl.id = c."clientId"
        WHERE m.date >= CURRENT_DATE - INTERVAL '14 days'
          AND m.creative_snapshot_id IS NOT NULL
        GROUP BY cl.id, cl.name, c.id, c.name, m.creative_snapshot_id
      )
      SELECT
        a.*,
        s.headline,
        s.primary_text,
        s.cta_type
      FROM creative_agg a
      LEFT JOIN ad_creative_snapshots s ON s.id = a.creative_snapshot_id
      WHERE a.spend_last7 >= $1
        AND a.conv_prev7 >= 5
      ORDER BY a.spend_last7 DESC
      LIMIT 40
    `,
    [creativeFatigueMinSpend]
  );

  const fatigueDropFactor = 1 + creativeFatigueDropPct / 100;

  for (const row of fatigueRows.rows) {
    const convPrev = safeInt(row.conv_prev7);
    const convLast = safeInt(row.conv_last7);
    const spendPrev = safeFloat(row.spend_prev7);
    const spendLast = safeFloat(row.spend_last7);

    const cplPrev = convPrev > 0 ? spendPrev / convPrev : null;
    const cplLast = convLast > 0 ? spendLast / convLast : null;

    if (
      convPrev >= creativeFatigueMinPrevConversations &&
      convLast <= convPrev * fatigueDropFactor &&
      spendLast >= Math.min(spendPrev * 0.8, creativeFatigueMinSpend) &&
      spendLast >= creativeFatigueMinSpend
    ) {
      const deltaPct = percentChange(convLast, convPrev);
      const deltaLabel = deltaPct != null ? formatPercent(deltaPct) : '—';

      alerts.push({
        id: `creative-fatigue-drop-${row.campaign_id}-${row.creative_snapshot_id}`,
        clientId: String(row.client_id),
        clientName: String(row.client_name),
        campaignId: String(row.campaign_id),
        campaignName: String(row.campaign_name),
        type: 'warning',
        category: 'creative-fatigue',
        message: `Sinal de fadiga (queda de conversas): “${formatCreativeLabel(row)}” (prev 7d: ${convPrev} → 7d: ${convLast}, Δ ${deltaLabel}). Considere testar variações de copy/criativo.`,
        metric: 'Δ conversas (7d vs 7d)',
        currentValue: deltaPct != null ? Number(deltaPct.toFixed(1)) : 0,
        threshold: creativeFatigueDropPct,
        createdAt,
      });
      continue;
    }

    if (
      convPrev >= 5 &&
      convLast >= 3 &&
      spendLast >= creativeFatigueMinSpend &&
      typeof cplPrev === 'number' &&
      typeof cplLast === 'number' &&
      cplLast >= cplPrev * creativeFatigueCplMultiplier
    ) {
      const thresholdValue = Number((cplPrev * creativeFatigueCplMultiplier).toFixed(2));

      alerts.push({
        id: `creative-fatigue-cpl-${row.campaign_id}-${row.creative_snapshot_id}`,
        clientId: String(row.client_id),
        clientName: String(row.client_name),
        campaignId: String(row.campaign_id),
        campaignName: String(row.campaign_name),
        type: 'warning',
        category: 'creative-fatigue',
        message: `Sinal de fadiga (CPL subiu): “${formatCreativeLabel(row)}” (CPL prev 7d: ${formatCurrency(cplPrev)} → 7d: ${formatCurrency(cplLast)}). Teste novos criativos/ângulos.`,
        metric: 'CPL (7d)',
        currentValue: Number(cplLast.toFixed(2)),
        threshold: thresholdValue,
        createdAt,
      });
    }
  }

  const videoRows = await pool.query(
    `
      WITH creative_agg AS (
        SELECT
          cl.id as client_id,
          cl.name as client_name,
          c.id as campaign_id,
          c.name as campaign_name,
          m.creative_snapshot_id,
          COALESCE(SUM(m.spend), 0) as spend_last7,
          COALESCE(SUM(m.messaging_conversations), 0)::int as conv_last7,
          AVG(NULLIF(m.hook_rate, 0)) as hook_rate_avg,
          AVG(NULLIF(m.hold_rate, 0)) as hold_rate_avg
        FROM ad_creative_metrics m
        JOIN campaigns c ON c.id = m.campaign_id
        JOIN clients cl ON cl.id = c."clientId"
        WHERE m.date >= CURRENT_DATE - INTERVAL '7 days'
          AND m.creative_snapshot_id IS NOT NULL
        GROUP BY cl.id, cl.name, c.id, c.name, m.creative_snapshot_id
      )
      SELECT
        a.*,
        s.headline,
        s.primary_text,
        s.video_id,
        s.format
      FROM creative_agg a
      JOIN ad_creative_snapshots s ON s.id = a.creative_snapshot_id
      WHERE a.spend_last7 >= $1
        AND (s.video_id IS NOT NULL OR lower(COALESCE(s.format, '')) LIKE '%video%')
        AND (
          (a.hook_rate_avg IS NOT NULL AND a.hook_rate_avg < $2)
          OR (a.hold_rate_avg IS NOT NULL AND a.hold_rate_avg < $3)
        )
      ORDER BY a.spend_last7 DESC
      LIMIT 40
    `,
    [creativeMinSpendWinner, hookRateMin, holdRateMin]
  );

  for (const row of videoRows.rows) {
    const hookRate = row.hook_rate_avg != null ? safeFloat(row.hook_rate_avg) : null;
    const holdRate = row.hold_rate_avg != null ? safeFloat(row.hold_rate_avg) : null;

    if (typeof hookRate === 'number' && Number.isFinite(hookRate) && hookRate > 0 && hookRate < hookRateMin) {
      alerts.push({
        id: `creative-video-hook-${row.campaign_id}-${row.creative_snapshot_id}`,
        clientId: String(row.client_id),
        clientName: String(row.client_name),
        campaignId: String(row.campaign_id),
        campaignName: String(row.campaign_name),
        type: 'info',
        category: 'creative-video',
        message: `Vídeo com hook rate abaixo do mínimo: “${formatCreativeLabel(row)}” (${hookRate.toFixed(1)}% < ${hookRateMin}%). Ajuste os 3 primeiros segundos.`,
        metric: 'Hook rate',
        currentValue: Number(hookRate.toFixed(1)),
        threshold: hookRateMin,
        createdAt,
      });
    }

    if (typeof holdRate === 'number' && Number.isFinite(holdRate) && holdRate > 0 && holdRate < holdRateMin) {
      alerts.push({
        id: `creative-video-hold-${row.campaign_id}-${row.creative_snapshot_id}`,
        clientId: String(row.client_id),
        clientName: String(row.client_name),
        campaignId: String(row.campaign_id),
        campaignName: String(row.campaign_name),
        type: 'info',
        category: 'creative-video',
        message: `Vídeo com hold rate abaixo do mínimo: “${formatCreativeLabel(row)}” (${holdRate.toFixed(1)}% < ${holdRateMin}%). Ajuste ritmo/estrutura do vídeo.`,
        metric: 'Hold rate',
        currentValue: Number(holdRate.toFixed(1)),
        threshold: holdRateMin,
        createdAt,
      });
    }
  }

  const winnerRows = await pool.query(
    `
      WITH creative_agg AS (
        SELECT
          cl.id as client_id,
          cl.name as client_name,
          c.id as campaign_id,
          c.name as campaign_name,
          m.creative_snapshot_id,
          COALESCE(SUM(m.spend), 0) as spend_last7,
          COALESCE(SUM(m.messaging_conversations), 0)::int as conv_last7
        FROM ad_creative_metrics m
        JOIN campaigns c ON c.id = m.campaign_id
        JOIN clients cl ON cl.id = c."clientId"
        WHERE m.date >= CURRENT_DATE - INTERVAL '7 days'
          AND m.creative_snapshot_id IS NOT NULL
        GROUP BY cl.id, cl.name, c.id, c.name, m.creative_snapshot_id
      ),
      ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (PARTITION BY campaign_id ORDER BY conv_last7 DESC, spend_last7 DESC) as rn
        FROM creative_agg
        WHERE spend_last7 >= $1 AND conv_last7 > 0
      )
      SELECT
        r.*,
        s.headline,
        s.primary_text,
        s.cta_type
      FROM ranked r
      LEFT JOIN ad_creative_snapshots s ON s.id = r.creative_snapshot_id
      WHERE r.rn = 1
      ORDER BY r.conv_last7 DESC
      LIMIT 20
    `,
    [creativeMinSpendWinner]
  );

  for (const row of winnerRows.rows) {
    const spendLast7 = safeFloat(row.spend_last7);
    const convLast7 = safeInt(row.conv_last7);
    const cplLast7 = convLast7 > 0 ? spendLast7 / convLast7 : null;

    alerts.push({
      id: `creative-winner-${row.campaign_id}-${row.creative_snapshot_id}`,
      clientId: String(row.client_id),
      clientName: String(row.client_name),
      campaignId: String(row.campaign_id),
      campaignName: String(row.campaign_name),
      type: 'info',
      category: 'creative-winner',
      message: `Criativo vencedor por conversas (7d): “${formatCreativeLabel(row)}” (${convLast7} conversas${cplLast7 != null ? ` · CPL ${formatCurrency(cplLast7)}` : ''} · gasto ${formatCurrency(spendLast7)}).`,
      metric: 'Conversas (7d)',
      currentValue: convLast7,
      threshold: 0,
      createdAt,
    });
  }

  return alerts.map((alert) => ({
    ...alert,
    analysisWindow: alert.analysisWindow ?? 'Acumulado criativo (últimos 7 dias)',
    learningWindow: alert.learningWindow ?? 'Aprendizado criativo (start/reset validar na tela de Performance)',
    learningWindowBasis: alert.learningWindowBasis ?? 'unknown',
  }));
};

