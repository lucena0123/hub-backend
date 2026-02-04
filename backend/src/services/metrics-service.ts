/**
 * Metrics Service
 * Handles all campaign performance calculations and aggregations
 */

import type { Pool } from 'pg';

import type { ClientPerformanceSummary, DailyMetric, MetricsQuery, PerformanceSummary } from '../types/metrics';
import {
  calculateCPA,
  calculateCPM,
  calculateCPC,
  calculateCPL,
  calculateCTR,
  calculateROAS,
} from './metrics/calculations';
import { getCampaignMetrics } from './metrics/get-campaign-metrics';
import { getClientPerformanceSummary } from './metrics/get-client-performance-summary';
import { getPerformanceSummary } from './metrics/get-performance-summary';

export class MetricsService {
  constructor(private pool: Pool) {}

  calculateCPL(spend: number, leads: number): number {
    return calculateCPL(spend, leads);
  }

  calculateCPA(spend: number, conversions: number): number {
    return calculateCPA(spend, conversions);
  }

  calculateCPC(spend: number, clicks: number): number {
    return calculateCPC(spend, clicks);
  }

  calculateCTR(clicks: number, impressions: number): number {
    return calculateCTR(clicks, impressions);
  }

  calculateROAS(revenue: number, spend: number): number {
    return calculateROAS(revenue, spend);
  }

  calculateCPM(spend: number, impressions: number): number {
    return calculateCPM(spend, impressions);
  }

  async getCampaignMetrics(campaignId: string, query: MetricsQuery = {}): Promise<DailyMetric[]> {
    return getCampaignMetrics(this.pool, campaignId, query);
  }

  async getPerformanceSummary(campaignId: string, query: MetricsQuery = {}): Promise<PerformanceSummary> {
    return getPerformanceSummary(this.pool, campaignId, query);
  }

  async getClientPerformanceSummary(clientId: string, query: MetricsQuery = {}): Promise<ClientPerformanceSummary> {
    return getClientPerformanceSummary(this.pool, clientId, query);
  }
}

