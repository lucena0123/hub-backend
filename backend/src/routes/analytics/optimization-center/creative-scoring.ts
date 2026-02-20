import type { OptimizationThemeTargets } from '../../../services/optimization-playbook';
import { median } from '../../../utils';

export const scoreCreatives = (creatives: any[], targets: OptimizationThemeTargets) => {
  const cplValues = creatives
    .map((c: any) => c.metrics.cpl)
    .filter((value: any): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  const medianCpl = median(cplValues);

  const eligible = creatives.filter(
    (c: any) => c.metrics.totalSpend >= targets.creativeMinSpendWinner && c.metrics.totalConversations > 0
  );
  const winnerCount = Math.min(
    targets.creativeWinnerMaxCount,
    Math.max(1, Math.ceil(eligible.length * targets.creativeWinnerPercentile))
  );
  const winners = [...eligible]
    .sort((a: any, b: any) => b.metrics.totalConversations - a.metrics.totalConversations)
    .slice(0, winnerCount);
  const winnerIds = new Set<string>(winners.map((c: any) => c.snapshotId));

  const loserIds = new Set<string>(
    creatives
      .filter((c: any) => {
        const spend = c.metrics.totalSpend || 0;
        const conv = c.metrics.totalConversations || 0;
        const cplValue = c.metrics.cpl;
        if (spend >= targets.creativeMinSpendLoser && conv === 0) return true;
        if (
          spend >= targets.creativeMinSpendLoser &&
          medianCpl &&
          typeof cplValue === 'number' &&
          cplValue >= medianCpl * targets.creativeLoserCplMultiplier &&
          conv <= targets.creativeLoserMaxConversations
        ) {
          return true;
        }
        return false;
      })
      .map((c: any) => c.snapshotId)
  );

  const fatiguedIds = new Set<string>(
    creatives
      .filter((c: any) => {
        const convPrev = c.previous.conversations || 0;
        const convLast = c.recent.conversations || 0;
        const spendPrev = c.previous.spend || 0;
        const spendLast = c.recent.spend || 0;
        const cplPrev = c.previous.cpl;
        const cplLast = c.recent.cpl;

        const minConvFactor = (100 + targets.creativeFatigueDropPct) / 100;

        if (
          convPrev >= targets.creativeFatigueMinPrevConversations &&
          convLast <= convPrev * minConvFactor &&
          spendLast >= Math.min(spendPrev * 0.8, targets.creativeFatigueMinSpend) &&
          spendLast >= targets.creativeFatigueMinSpend
        ) {
          return true;
        }
        if (
          convPrev >= 5 &&
          convLast >= 3 &&
          spendLast >= targets.creativeFatigueMinSpend &&
          typeof cplPrev === 'number' &&
          typeof cplLast === 'number' &&
          cplLast >= cplPrev * targets.creativeFatigueCplMultiplier
        ) {
          return true;
        }
        return false;
      })
      .map((c: any) => c.snapshotId)
  );

  const enrichedCreatives = creatives.map((c: any) => {
    const isWinner = winnerIds.has(c.snapshotId);
    const isLoser = loserIds.has(c.snapshotId);
    const isFatigued = fatiguedIds.has(c.snapshotId);
    const status = isFatigued ? 'fatigued' : isWinner ? 'winner' : isLoser ? 'loser' : 'neutral';
    return {
      ...c,
      status,
    };
  });

  return { enrichedCreatives, winners, medianCpl };
};

