/**
 * Types for Campaign Metrics and Performance Tracking
 */

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  platform: 'meta' | 'google' | 'linkedin' | 'tiktok' | 'other';
  budget: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  startDate: string;
  endDate?: string;
  objective?: string;
  targetAudience?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMetrics {
  id: string;
  campaignId: string;
  date: string;

  // Performance Metrics
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;

  // Calculated Metrics
  ctr: number; // Click-Through Rate (%)
  cpc: number; // Cost Per Click
  cpl: number; // Cost Per Lead
  cpa: number; // Cost Per Acquisition
  roas: number; // Return on Ad Spend

  // Additional Data
  leads: number;
  qualifiedLeads: number;
  revenue: number;

  // Metadata
  platform: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpl: number;
  roas: number;
  // Lead Generation fields (optional for backward compatibility)
  messagingConversations?: number;
  messagingFirstReply?: number;
  linkClicks?: number;
  landingPageViews?: number;
}

export interface CampaignAd {
  id: string;
  campaignId: string;
  adName: string;
  adType: 'image' | 'video' | 'carousel' | 'text';
  status: 'active' | 'paused' | 'archived';

  // Content
  headline?: string;
  description?: string;
  callToAction?: string;
  imageUrl?: string;
  videoUrl?: string;
  landingPageUrl?: string;

  // Performance (aggregated)
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  avgCtr: number;
  avgCpc: number;

  // Metadata
  platform: string;
  platformAdId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceSummary {
  campaignId: string;
  campaignName: string;
  platform: string;
  period: {
    start: string;
    end: string;
  };

  // Aggregated Metrics
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  totalLeads: number;

  // Lead Generation Metrics (for service businesses)
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;

  // Campaign Health Metrics
  totalReach: number;
  avgFrequency: number;
  avgCpm: number;
  qualityRanking?: string | null;
  engagementRateRanking?: string | null;
  conversionRateRanking?: string | null;

  // Averages
  avgCtr: number;
  avgCpc: number;
  avgCpl: number;
  avgCpa: number;
  roas: number;

  // Budget
  budget: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetUtilization: number; // %

  // Trends
  dailyMetrics: DailyMetric[];

  // Comparisons
  vsLastPeriod?: {
    impressions: number; // % change
    clicks: number;
    conversions: number;
    spend: number;
    roas: number;
  };

  // Goals
  goals?: {
    targetCpl?: number;
    targetRoas?: number;
    targetConversions?: number;
  };

  // Performance Status
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ClientPerformanceSummary {
  clientId: string;
  clientName: string;
  period: {
    start: string;
    end: string;
  };

  // All campaigns summary
  totalCampaigns: number;
  activeCampaigns: number;

  // Aggregated metrics across all campaigns
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  totalLeads: number; // Added explicitly

  // Lead Generation Metrics (aggregated)
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;

  // Campaign Health Metrics (aggregated)
  totalReach: number;
  avgFrequency: number;
  avgCpm: number;


  // Overall performance
  avgCtr: number;
  avgCpl: number;
  avgCpa: number;
  avgRoas: number;

  // Per campaign breakdown
  campaigns: PerformanceSummary[];

  // Daily Aggregated Metrics (for charts)
  dailyMetrics: DailyMetric[];

  // BPMN Progress
  bpmnProgress?: BPMNProgress;
}


export interface BPMNProgress {
  id: string;
  clientId: string;
  currentSubprocess: string; // '4.1', '4.2', '5.1', etc
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  progressPercentage: number; // 0-100

  // Tasks
  completedTasks: string[];
  pendingTasks: string[];
  blockedTasks: string[];

  // Timeline
  startedAt?: string;
  estimatedCompletion?: string;
  completedAt?: string;

  // Details
  notes?: string;
  blockers?: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
  }>;

  // History
  subprocessHistory?: Array<{
    subprocess: string;
    startedAt: string;
    completedAt: string;
    duration: number; // in days
  }>;

  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReport {
  id: string;
  clientId: string;
  reportType: 'monthly' | 'quarterly' | 'custom';
  periodStart: string;
  periodEnd: string;
  title: string;

  // Data snapshot
  summaryData: {
    performance: ClientPerformanceSummary;
    aiContent?: AIReportContent;
    insights?: string[];
    recommendations?: string[];
    highlights?: string[];
  };

  // File info
  filePath?: string;
  fileSize?: number;
  pdfUrl?: string;

  // Generation
  generatedBy?: string;
  generatedAt: string;
  version: number;
  status: 'generating' | 'generated' | 'failed';

  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AIReportContent {
  executiveSummary: string;
  interpretation: string;
  positives: string[];
  improvements: string[];
  recommendations: string[];
}

// Utility Types
export type MetricsPeriod = '7d' | '14d' | '30d' | '60d' | '90d' | 'custom';

export interface MetricsQuery {
  period?: MetricsPeriod;
  startDate?: string;
  endDate?: string;
  platform?: string;
  campaignId?: string;
}
