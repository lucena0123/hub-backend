import { OPTIMIZATION_CENTER_PLAYBOOK_V1 } from '../../../services/optimization-playbook';

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
  } = OPTIMIZATION_CENTER_PLAYBOOK_V1.defaults;

  const eligible = creatives.filter((c: any) => c.metrics.totalSpend >= creativeMinSpendWinner && c.metrics.totalConversations > 0);
  const winnerCount = Math.min(creativeWinnerMaxCount, Math.max(1, Math.ceil(eligible.length * creativeWinnerPercentile)));
  const winners = [...eligible].sort((a: any, b: any) => b.metrics.totalConversations - a.metrics.totalConversations).slice(0, winnerCount);
  const winnerIds = new Set<string>(winners.map((c: any) => c.snapshotId));

  const loserIds = new Set<string>(
    creatives
      .filter((c: any) => {
        const spend = c.metrics.totalSpend || 0;
        const conv = c.metrics.totalConversations || 0;
        const cpl = c.metrics.cpl;

        if (spend >= creativeMinSpendLoser && conv === 0) return true;
        if (
          spend >= creativeMinSpendLoser &&
          medianCpl &&
          typeof cpl === 'number' &&
          cpl >= medianCpl * creativeLoserCplMultiplier &&
          conv <= creativeLoserMaxConversations
        ) {
          return true;
        }

        return false;
      })
      .map((c: any) => c.snapshotId)
  );

  const fatigueDropFactor = 1 + creativeFatigueDropPct / 100;

  const fatiguedIds = new Set<string>(
    creatives
      .filter((c: any) => {
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
          return true;
        }

        if (
          convPrev >= 5 &&
          convLast >= 3 &&
          spendLast >= creativeFatigueMinSpend &&
          typeof cplPrev === 'number' &&
          typeof cplLast === 'number' &&
          cplLast >= cplPrev * creativeFatigueCplMultiplier
        ) {
          return true;
        }

        return false;
      })
      .map((c: any) => c.snapshotId)
  );

  const enriched = creatives.map((c: any) => {
    const isWinner = winnerIds.has(c.snapshotId);
    const isLoser = loserIds.has(c.snapshotId);
    const isFatigued = fatiguedIds.has(c.snapshotId);
    const status = isFatigued ? 'fatigued' : isWinner ? 'winner' : isLoser ? 'loser' : 'neutral';

    return {
      ...c,
      flags: {
        winner: isWinner,
        loser: isLoser,
        fatigued: isFatigued,
      },
      status,
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

