import type { Pool } from 'pg';

import { median, shiftIsoDateUtc, toIsoDateUtc } from '../utils';

import { fetchAdsetNames, fetchCreativeAggRows } from './queries';
import { scoreCreatives } from './scoring';
import { mapCreativeRows } from './transform';

export const getCreativeLibraryResponse = async (params: {
  pool: Pool;
  clientId: string;
  query: { period?: string; startDate?: string; endDate?: string; campaignId?: string };
}) => {
  const { pool, clientId, query } = params;
  const { period = '30d', startDate, endDate, campaignId } = query;

  const days =
    period === '7d'
      ? 7
      : period === '14d'
        ? 14
        : period === '60d'
          ? 60
          : period === '90d'
            ? 90
            : 30;

  const end = endDate || toIsoDateUtc(new Date());
  const start = startDate || toIsoDateUtc(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  const endMinus6 = shiftIsoDateUtc(end, -6);
  const endMinus13 = shiftIsoDateUtc(end, -13);

  const campaignFilter = campaignId || null;
  const adsetNameById = await fetchAdsetNames({ pool, clientId, start, end, campaignId: campaignFilter });
  const rows = await fetchCreativeAggRows({
    pool,
    clientId,
    start,
    end,
    campaignId: campaignFilter,
    endMinus6,
    endMinus13,
  });

  const creatives = mapCreativeRows({ rows, adsetNameById });

  const cplValues = creatives
    .map((c: any) => c.metrics.cpl)
    .filter((value: any): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  const medianCpl = median(cplValues);

  const scored = scoreCreatives({ creatives, medianCpl });

  return {
    clientId,
    period: { start, end },
    scope: campaignId ? { campaignId } : { clientId },
    total: scored.enriched.length,
    creatives: scored.enriched,
    insights: {
      medianCpl: medianCpl != null ? Number(medianCpl.toFixed(2)) : null,
      topCtas: scored.insights.topCtas,
      topHeadlines: scored.insights.topHeadlines,
      counts: scored.insights.counts,
    },
  };
};

