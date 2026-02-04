import { OPTIMIZATION_CENTER_PLAYBOOK_V1 } from '../../../services/optimization-playbook';

type CreativeReason = {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  thresholds?: Record<string, number>;
};

export const scoreCreatives = (params: { creatives: any[]; medianCpl: number | null }) => {
  const { creatives, medianCpl } = params;

  const {
    creativeMinSpendWinner,
    creativeMinSpendLoser,
    creativeWinnerPercentile,
    creativeWinnerMaxCount,
    creativeLoserCplMultiplier,
    creativeLoserMaxConversations,
    creativeFatigueMinPrevConversations,
    creativeFatigueDropPct,
    creativeFatigueMinSpend,
    creativeFatigueCplMultiplier,
    hookRateMin,
    holdRateMin,
  } = OPTIMIZATION_CENTER_PLAYBOOK_V1.defaults;

  const eligible = creatives.filter((c: any) => c.metrics.totalSpend >= creativeMinSpendWinner && c.metrics.totalConversations > 0);
  const winnerCount = Math.min(creativeWinnerMaxCount, Math.max(1, Math.ceil(eligible.length * creativeWinnerPercentile)));
  const sortedEligible = [...eligible].sort((a: any, b: any) => b.metrics.totalConversations - a.metrics.totalConversations);
  const winners = sortedEligible.slice(0, winnerCount);
  const winnerIds = new Set<string>(winners.map((c: any) => c.snapshotId));
  const winnerRankById = new Map<string, number>(sortedEligible.map((c: any, idx: number) => [c.snapshotId, idx + 1]));

  const loserIds = new Set<string>();
  const loserReasonById = new Map<string, CreativeReason>();

  for (const c of creatives as any[]) {
    const spend = c.metrics.totalSpend || 0;
    const conv = c.metrics.totalConversations || 0;
    const cpl = c.metrics.cpl;

    if (spend >= creativeMinSpendLoser && conv === 0) {
      loserIds.add(c.snapshotId);
      loserReasonById.set(c.snapshotId, {
        code: 'loser.zero_conversations',
        severity: spend >= 400 ? 'critical' : 'warning',
        message: `Investiu ${spend.toFixed(2)} e não gerou conversas no período.`,
        thresholds: { creativeMinSpendLoser },
      });
      continue;
    }

    if (
      spend >= creativeMinSpendLoser &&
      medianCpl &&
      typeof cpl === 'number' &&
      cpl >= medianCpl * creativeLoserCplMultiplier &&
      conv <= creativeLoserMaxConversations
    ) {
      loserIds.add(c.snapshotId);
      loserReasonById.set(c.snapshotId, {
        code: 'loser.cpl_high',
        severity: 'warning',
        message: `Custo por conversa acima da mediana do período (${cpl.toFixed(2)} vs ~${medianCpl.toFixed(2)}).`,
        thresholds: { creativeMinSpendLoser, creativeLoserCplMultiplier, creativeLoserMaxConversations },
      });
    }
  }

  const fatigueDropFactor = 1 + creativeFatigueDropPct / 100;

  const fatiguedIds = new Set<string>();
  const fatigueReasonById = new Map<string, CreativeReason>();

  for (const c of creatives as any[]) {
    const convPrev = c.previous.conversations || 0;
    const convLast = c.recent.conversations || 0;
    const spendPrev = c.previous.spend || 0;
    const spendLast = c.recent.spend || 0;
    const cplPrev = c.previous.cpl;
    const cplLast = c.recent.cpl;

    if (
      convPrev >= creativeFatigueMinPrevConversations &&
      convLast <= convPrev * fatigueDropFactor &&
      spendLast >= Math.min(spendPrev * 0.8, creativeFatigueMinSpend) &&
      spendLast >= creativeFatigueMinSpend
    ) {
      fatiguedIds.add(c.snapshotId);
      fatigueReasonById.set(c.snapshotId, {
        code: 'fatigue.conversations_drop',
        severity: 'warning',
        message: `Queda de conversas (prev 7d: ${convPrev} → últimos 7d: ${convLast}).`,
        thresholds: { creativeFatigueMinPrevConversations, creativeFatigueDropPct, creativeFatigueMinSpend },
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
      fatiguedIds.add(c.snapshotId);
      fatigueReasonById.set(c.snapshotId, {
        code: 'fatigue.cpl_rise',
        severity: 'warning',
        message: `Custo por conversa subiu (prev 7d: ${cplPrev.toFixed(2)} → últimos 7d: ${cplLast.toFixed(2)}).`,
        thresholds: { creativeFatigueCplMultiplier, creativeFatigueMinSpend },
      });
    }
  }

  const enriched = creatives.map((c: any) => {
    const isWinner = winnerIds.has(c.snapshotId);
    const isLoser = loserIds.has(c.snapshotId);
    const isFatigued = fatiguedIds.has(c.snapshotId);
    const status = isFatigued ? 'fatigued' : isWinner ? 'winner' : isLoser ? 'loser' : 'neutral';

    const reasons: CreativeReason[] = [];

    if (status === 'winner') {
      const rank = winnerRankById.get(c.snapshotId);
      const eligibleCount = sortedEligible.length;
      reasons.push({
        code: 'winner.top_conversations',
        severity: 'info',
        message: `Entre os melhores por conversas no período${rank && eligibleCount ? ` (rank ${rank}/${eligibleCount})` : ''}.`,
        thresholds: { creativeMinSpendWinner, creativeWinnerPercentile },
      });
    }

    if (status === 'loser') {
      reasons.push(
        loserReasonById.get(c.snapshotId) ?? {
          code: 'loser.low_performance',
          severity: 'warning',
          message: 'Baixo desempenho no período (regras do playbook).',
          thresholds: { creativeMinSpendLoser },
        }
      );
    }

    if (status === 'fatigued') {
      reasons.push(
        fatigueReasonById.get(c.snapshotId) ?? {
          code: 'fatigue.detected',
          severity: 'warning',
          message: 'Sinal de fadiga detectado (regras do playbook).',
          thresholds: { creativeFatigueMinSpend },
        }
      );
    }

    const formatRaw = typeof c.format === 'string' ? c.format.trim().toLowerCase() : '';
    const isVideo = Boolean(c.videoId) || formatRaw.includes('video');
    const hookRate = c.metrics?.hookRateAvg;
    const holdRate = c.metrics?.holdRateAvg;
    const spend = c.metrics?.totalSpend || 0;

    if (isVideo && spend >= creativeMinSpendWinner) {
      if (typeof hookRate === 'number' && Number.isFinite(hookRate) && hookRate > 0 && hookRate < hookRateMin) {
        reasons.push({
          code: 'video.hook_low',
          severity: 'info',
          message: `Hook rate abaixo do mínimo (${hookRate.toFixed(1)}% < ${hookRateMin}%).`,
          thresholds: { hookRateMin, creativeMinSpendWinner },
        });
      }

      if (typeof holdRate === 'number' && Number.isFinite(holdRate) && holdRate > 0 && holdRate < holdRateMin) {
        reasons.push({
          code: 'video.hold_low',
          severity: 'info',
          message: `Hold rate abaixo do mínimo (${holdRate.toFixed(1)}% < ${holdRateMin}%).`,
          thresholds: { holdRateMin, creativeMinSpendWinner },
        });
      }
    }

    return {
      ...c,
      flags: {
        winner: isWinner,
        loser: isLoser,
        fatigued: isFatigued,
      },
      status,
      analysis: {
        reasons: reasons.slice(0, 3),
      },
    };
  });

  const insightsSource = winners.length > 0 ? winners : enriched;
  const ctaAgg = new Map<string, { conversations: number; spend: number }>();
  const headlineAgg = new Map<string, { conversations: number; spend: number }>();

  for (const c of insightsSource as any[]) {
    const conv = c.metrics.totalConversations || 0;
    const spend = c.metrics.totalSpend || 0;

    if (c.ctaType) {
      const current = ctaAgg.get(c.ctaType) ?? { conversations: 0, spend: 0 };
      current.conversations += conv;
      current.spend += spend;
      ctaAgg.set(c.ctaType, current);
    }

    if (c.headline) {
      const key = String(c.headline).trim();
      if (key) {
        const current = headlineAgg.get(key) ?? { conversations: 0, spend: 0 };
        current.conversations += conv;
        current.spend += spend;
        headlineAgg.set(key, current);
      }
    }
  }

  const topCtas = Array.from(ctaAgg.entries())
    .map(([ctaType, data]) => ({
      ctaType,
      conversations: data.conversations,
      spend: Number(data.spend.toFixed(2)),
      cpl: data.conversations > 0 ? Number((data.spend / data.conversations).toFixed(2)) : null,
    }))
    .sort((a, b) => b.conversations - a.conversations)
    .slice(0, 6);

  const topHeadlines = Array.from(headlineAgg.entries())
    .map(([headline, data]) => ({
      headline,
      conversations: data.conversations,
      spend: Number(data.spend.toFixed(2)),
      cpl: data.conversations > 0 ? Number((data.spend / data.conversations).toFixed(2)) : null,
    }))
    .sort((a, b) => b.conversations - a.conversations)
    .slice(0, 6);

  return {
    enriched,
    insights: {
      topCtas,
      topHeadlines,
      counts: {
        winners: winnerIds.size,
        losers: loserIds.size,
        fatigued: fatiguedIds.size,
      },
    },
  };
};
