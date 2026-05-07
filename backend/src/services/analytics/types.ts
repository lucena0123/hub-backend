export interface BreakdownSegment {
    label: string;
    impressions: number;
    clicks: number;
    spend: number;
    reach: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversionRate: number;
    shareOfSpend: number;
}

export interface BusinessMetrics {
    campaignId: string;
    totalSpend: number;
    totalConversations: number;
    totalContracts: number;
    totalRevenue: number;
    avgTicket: number;
    cac: number;
    costPerLead: number;
    conversionRate: number;
    ltv: number;
    ltvCacRatio: number;
    ltvCacHealth: 'excellent' | 'good' | 'fair' | 'poor';
    roi: number;
    config: {
        lifetimeMonths: number;
        monthlyRevenue: number;
    };
}

export interface AdSetMetric {
  adsetId: string;
  adsetName: string;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  totalSpend: number;
  totalConversions: number;
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  avgCtr: number;
  avgCpc: number;
  avgCpm: number;
  avgFrequency: number;
  cpl: number;
  status?: string | null;
  effectiveStatus?: string | null;
  configuredStatus?: string | null;
  dailyBudget?: number | null;
  lifetimeBudget?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface AdMetric {
    adId: string;
    adName: string;
    adsetId: string;
    creativeId: string | null;
    creativeSnapshotId: string | null;
    creative: any | null;
    totalImpressions: number;
    totalReach: number;
    totalClicks: number;
    totalLinkClicks: number;
    totalLandingPageViews: number;
    totalSpend: number;
    totalConversions: number;
    totalLeads?: number;
    totalPurchases?: number;
    totalMessagingConversations: number;
    avgCtr: number;
    avgCpm: number;
    cpl: number;
    videoThruplay: number;
    video3secViews: number;
    videoP25: number;
    videoP50: number;
    videoP75: number;
    videoP100: number;
    hookRate: number;
    holdRate: number;
}

export interface TemporalAnalysisConfig {
    dayOfWeek: number;
    dayName: string;
    totalImpressions: number;
    totalClicks: number;
    totalSpend: number;
    totalConversions: number;
    totalConversations: number;
    avgCtr: number;
    avgCpm: number;
    cpl: number;
    daysCount: number;
}

export interface CreativeSnapshot {
    snapshotId: string;
    creativeId: string;
    platform: string;
    contentHash: string;
    capturedAt: string;
    lastSeenAt: string;
    headline: string | null;
    primaryText: string | null;
    description: string | null;
    ctaType: string | null;
    destinationUrl: string | null;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    videoId: string | null;
    format: string | null;
    isDynamic: boolean;
    headlines: string[] | null;
    primaryTexts: string[] | null;
    descriptions: string[] | null;
    ctaTypes: string[] | null;
    destinationUrls: string[] | null;
    objectStorySpec: any | null;
    assetFeedSpec: any | null;
    visualAttributes: any | null;
}

export interface AdSetNameRow {
    adset_id: string;
    adset_name: string | null;
}

export interface CopyInsight {
    snapshotId: string;
    themeKey: string | null;
    themeName: string | null;
    status: string;
    model: string | null;
    promptId: string | null;
    promptVersion: string | null;
    analysis: any | null;
    errorMessage: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}
