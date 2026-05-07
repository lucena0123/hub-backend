import type { BreakdownSegment } from './types';

type BreakdownRow = {
    breakdown_data: unknown;
};

type RawBreakdownSegment = {
    label?: string;
    impressions?: unknown;
    clicks?: unknown;
    spend?: unknown;
    reach?: unknown;
    conversions?: unknown;
    messaging_conversations?: unknown;
};

export function aggregateBreakdownSegments(rows: BreakdownRow[]): BreakdownSegment[] {
    const segmentMap = new Map<
        string,
        { label: string; impressions: number; clicks: number; spend: number; reach: number; conversions: number }
    >();

    for (const row of rows) {
        const segments = typeof row.breakdown_data === 'string'
            ? JSON.parse(row.breakdown_data)
            : row.breakdown_data;

        for (const seg of segments as RawBreakdownSegment[]) {
            const key = seg.label || 'unknown';
            const existing = segmentMap.get(key) || {
                label: seg.label || key,
                impressions: 0,
                clicks: 0,
                spend: 0,
                reach: 0,
                conversions: 0,
            };

            existing.impressions += Number(seg.impressions) || 0;
            existing.clicks += Number(seg.clicks) || 0;
            existing.spend += Number(seg.spend) || 0;
            existing.reach += Number(seg.reach) || 0;
            const conversions = Number(
                (seg.conversions ?? seg.messaging_conversations) ?? 0
            ) || 0;
            existing.conversions += conversions;

            segmentMap.set(key, existing);
        }
    }

    const segments = Array.from(segmentMap.values()).map((seg) => ({
        ...seg,
        ctr: seg.impressions > 0 ? (seg.clicks / seg.impressions) * 100 : 0,
        cpc: seg.clicks > 0 ? seg.spend / seg.clicks : 0,
        cpm: seg.impressions > 0 ? (seg.spend / seg.impressions) * 1000 : 0,
        conversionRate: seg.clicks > 0 ? (seg.conversions / seg.clicks) * 100 : 0,
        shareOfSpend: 0,
    }));

    const totalSpend = segments.reduce((sum, seg) => sum + seg.spend, 0);
    for (const seg of segments) {
        seg.shareOfSpend = totalSpend > 0 ? (seg.spend / totalSpend) * 100 : 0;
    }

    return segments;
}
