export interface PerformanceAlert {
  id: string;
  clientId: string;
  clientName: string;
  campaignId?: string;
  campaignName?: string;
  type: 'warning' | 'critical' | 'info';
  category: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  createdAt: string;
  analysisWindow?: string;
  learningWindow?: string;
  learningWindowBasis?: 'since_start' | 'since_reset' | 'mixed' | 'unknown';
}

