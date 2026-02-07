import { PrismaClient, Prisma } from '@prisma/client';
import type { DailyMetric, MetricsQuery, PerformanceSummary } from '../types/metrics';
import { getDateRange } from './metrics/date-range';
import { calculateCPL } from './metrics/calculations';
import { getClientPerformanceSummary } from './metrics/get-client-performance-summary';
import { getPerformanceSummary } from './metrics/get-performance-summary';
// We will need to update getClientPerformanceSummary to accept PrismaClient or refactor it completely.
// For now, let's keep the signature compatible or update usage.

export class MetricsService {
  constructor(private prisma: PrismaClient) { }

  /**
   * Get metrics for a specific campaign
   */
  async getCampaignMetrics(campaignId: string, query: MetricsQuery = {}): Promise<DailyMetric[]> {
    const { period = '30d', startDate, endDate, platform } = query;
    const dates = getDateRange(period, startDate, endDate);

    const where: Prisma.CampaignMetricWhereInput = {
      campaignId,
      date: {
        gte: new Date(dates.start),
        lte: new Date(dates.end),
      },
    };

    if (platform) {
      where.platform = platform;
    }

    const metrics = await this.prisma.campaignMetric.groupBy({
      by: ['date'],
      where,
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        messagingConversations: true,
        messagingFirstReply: true,
        linkClicks: true,
        landingPageViews: true,
        spend: true,
        revenue: true,
      },
      _avg: {
        ctr: true,
        cpc: true,
        cpl: true,
        roas: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return metrics.map((m) => ({
      date: m.date.toISOString().split('T')[0],
      impressions: m._sum.impressions || 0,
      clicks: m._sum.clicks || 0,
      conversions: m._sum.conversions || 0,
      messagingConversations: m._sum.messagingConversations || 0,
      messagingFirstReply: m._sum.messagingFirstReply || 0,
      linkClicks: m._sum.linkClicks || 0,
      landingPageViews: m._sum.landingPageViews || 0,
      spend: m._sum.spend || 0,
      revenue: m._sum.revenue || 0,
      ctr: m._avg.ctr || 0,
      cpc: m._avg.cpc || 0,
      cpl: m._avg.cpl || 0,
      roas: m._avg.roas || 0,
    }));
  }

  /**
   * Import or update metrics
   */
  async importMetrics(metrics: any[], overwrite = false) {
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const entry of metrics) {
      // Basic upsert logic. 
      // Optimized batching could be done with createMany but conflicting on (campaignId, date, platform)
      // Prisma createMany doesn't support ON CONFLICT update in all databases easily via API yet (skipDuplicates exists).
      // For overwrite=true, we want update. For overwrite=false, we want skip.

      const data = {
        campaignId: entry.campaignId,
        date: new Date(entry.date),
        platform: entry.platform || 'other', // We might need to fetch platform if not provided
        impressions: entry.impressions,
        clicks: entry.clicks,
        spend: entry.spend,
        conversions: entry.conversions,
        revenue: entry.revenue,
        leads: entry.leads,
        // Calculated fields - simplistic version, simpler to calculate in DB or App?
        // Let's calculate them here
        ctr: entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0,
        cpc: entry.clicks > 0 ? entry.spend / entry.clicks : 0,
        cpl: entry.leads > 0 ? entry.spend / entry.leads : 0,
        cpa: entry.conversions > 0 ? entry.spend / entry.conversions : 0,
        roas: entry.spend > 0 ? entry.revenue / entry.spend : 0,
      };

      try {
        if (overwrite) {
          await this.prisma.campaignMetric.upsert({
            where: {
              campaignId_date_platform: {
                campaignId: data.campaignId,
                date: data.date,
                platform: data.platform,
              },
            },
            update: data,
            create: data,
          });
          updated++;
        } else {
          // Try create, ignore if fails (or use findUnique first)
          // createMany with skipDuplicates is better for bulk but loop is fine for now
          try {
            await this.prisma.campaignMetric.create({ data });
            imported++;
          } catch (e: any) {
            if (e.code === 'P2002') {
              skipped++;
            } else {
              throw e;
            }
          }
        }
      } catch (error) {
        console.error('Error importing metric', error);
      }
    }

    return { imported, updated, skipped };
  }

  async upsertMetric(entry: any) {
    const data = {
      campaignId: entry.campaignId,
      date: new Date(entry.date),
      platform: entry.platform || 'other',
      impressions: entry.impressions,
      clicks: entry.clicks,
      spend: entry.spend,
      conversions: entry.conversions,
      revenue: entry.revenue,
      leads: entry.leads,
      ctr: entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0,
      cpc: entry.clicks > 0 ? entry.spend / entry.clicks : 0,
      cpl: entry.leads > 0 ? entry.spend / entry.leads : 0,
      cpa: entry.conversions > 0 ? entry.spend / entry.conversions : 0,
      roas: entry.spend > 0 ? entry.revenue / entry.spend : 0,
    };

    return this.prisma.campaignMetric.upsert({
      where: {
        campaignId_date_platform: {
          campaignId: data.campaignId,
          date: data.date,
          platform: data.platform,
        },
      },
      update: data,
      create: data,
    });
  }

  calculateCPL(spend: number, leads: number): number {
    return calculateCPL(spend, leads);
  }

  // Proxy methods for now, need to be updated to use Prisma if they query DB
  // getClientPerformanceSummary will need heavy refactoring.
  async getClientPerformanceSummary(clientId: string, query: MetricsQuery = {}) {
    // This function is too complex to inline right now, needs its own refactor task.
    // For now, we need to pass the raw pool or refactor it to use Prisma.$queryRaw
    // But we removed 'pool' from the service constructor.
    // Option: Refactor getClientPerformanceSummary to take prisma instance and use $queryRaw.
    return getClientPerformanceSummary(this.prisma, clientId, query);
  }

  async getPerformanceSummary(campaignId: string, query: MetricsQuery = {}): Promise<PerformanceSummary> {
    // This one also needs refactoring
    // return getPerformanceSummary(this.prisma, campaignId, query);
    return getPerformanceSummary(this.prisma, campaignId, query);
  }
}
