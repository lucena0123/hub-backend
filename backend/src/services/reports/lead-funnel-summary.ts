import { PrismaClient } from '@prisma/client';

import type { ClientLeadFunnelSummary, ClientPerformanceSummary } from '../../types/metrics';

export const getClientLeadFunnelSummary = async (params: {
  prisma: PrismaClient;
  clientId: string;
  startDate: string;
  endDate: string;
  performance: ClientPerformanceSummary;
}): Promise<ClientLeadFunnelSummary | null> => {
  const { prisma, clientId, startDate, endDate, performance } = params;

  const totalContacts = performance.totalMessagingConversations || performance.totalLeads || performance.totalConversions;

  const totalsResult = await prisma.$queryRaw<any[]>`
    SELECT
      COUNT(*)::int as records_count,
      COALESCE(SUM(qualified_leads), 0)::int as total_qualified_leads,
      COALESCE(SUM(contracts_closed), 0)::int as total_contracts_closed,
      COALESCE(SUM(revenue_generated), 0) as total_revenue_generated
     FROM campaign_lead_tracking lt
     INNER JOIN campaigns c ON c.id = lt.campaign_id
     WHERE c."clientId" = ${clientId}
       AND lt.date >= ${new Date(startDate)}
       AND lt.date <= ${new Date(endDate)}
  `;

  const totals = totalsResult[0] || {
    records_count: 0,
    total_qualified_leads: 0,
    total_contracts_closed: 0,
    total_revenue_generated: 0,
  };

  const reasonsResult = await prisma.$queryRaw<any[]>`
    SELECT
      e.key as reason_key,
      SUM((e.value)::int)::int as total_count
     FROM campaign_lead_tracking lt
     INNER JOIN campaigns c ON c.id = lt.campaign_id
     CROSS JOIN LATERAL jsonb_each_text(COALESCE(lt.disqualification_reasons, '{}'::jsonb)) e(key, value)
     WHERE c."clientId" = ${clientId}
       AND lt.date >= ${new Date(startDate)}
       AND lt.date <= ${new Date(endDate)}
     GROUP BY e.key
     ORDER BY total_count DESC
  `;

  const disqualificationReasons: Record<string, number> = {};
  for (const row of reasonsResult) {
    const key = String(row.reason_key);
    const count = parseInt(row.total_count) || 0;
    if (!key || count <= 0) continue;
    disqualificationReasons[key] = count;
  }

  const recordsCount = Number(totals.records_count) || 0;
  const totalQualifiedLeads = Number(totals.total_qualified_leads) || 0;
  const totalContractsClosed = Number(totals.total_contracts_closed) || 0;
  const totalRevenueGenerated = parseFloat(totals.total_revenue_generated) || 0;

  const qualificationRate =
    totalContacts > 0 && totalQualifiedLeads > 0 && totalQualifiedLeads <= totalContacts
      ? Number(((totalQualifiedLeads / totalContacts) * 100).toFixed(2))
      : null;

  const costPerQualifiedLead =
    performance.totalSpend > 0 && totalQualifiedLeads > 0 ? Number((performance.totalSpend / totalQualifiedLeads).toFixed(2)) : null;

  const hasAnyData =
    recordsCount > 0 ||
    totalQualifiedLeads > 0 ||
    totalContractsClosed > 0 ||
    totalRevenueGenerated > 0 ||
    Object.keys(disqualificationReasons).length > 0;

  if (!hasAnyData) return null;

  return {
    recordsCount,
    totalQualifiedLeads,
    totalContractsClosed,
    totalRevenueGenerated,
    qualificationRate,
    costPerQualifiedLead,
    disqualificationReasons,
  };
};

