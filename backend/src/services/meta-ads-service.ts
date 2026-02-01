/**
 * Meta Ads API Integration
 * Fetches campaign insights from Meta Marketing API
 */

export type MetaInsightRow = {
  campaign_id: string;
  campaign_name?: string;
  date_start: string;
  date_stop: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  ctr?: string;
  cpc?: string;
  reach?: string;
  frequency?: string;
  cpm?: string;
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  conversion_rate_ranking?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
};

export type MetaAdAccount = {
  id: string;
  account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  business_name?: string;
  spend_cap?: string;
  amount_spent?: string;
};

export type MetaCampaign = {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
  updated_time?: string;
};

export type MetaAdSetInsightRow = {
  campaign_id: string;
  adset_id: string;
  adset_name?: string;
  date_start: string;
  date_stop: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  spend?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  conversion_rate_ranking?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
};

export type MetaAdInsightRow = {
  campaign_id: string;
  adset_id?: string;
  ad_id: string;
  ad_name?: string;
  date_start: string;
  date_stop: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  spend?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  conversion_rate_ranking?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  video_thruplay_actions?: Array<{ action_type: string; value: string }>;
  video_p25_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p50_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p75_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p100_watched_actions?: Array<{ action_type: string; value: string }>;
};

type MetaInsightsResponse = {
  data: MetaInsightRow[];
  paging?: {
    next?: string;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
  };
};

type MetaInsightsParams = {
  since: string;
  until: string;
  limit?: number;
};

type PaginatedFetchOptions = {
  fields: string[];
  level: string;
  since: string;
  until: string;
  limit: number;
  breakdowns?: string[];
};

export class MetaAdsService {
  private accessToken: string;
  private adAccountId: string;
  private apiVersion: string;
  private requestDelay: number = 100;

  constructor(options: { accessToken: string; adAccountId: string; apiVersion?: string }) {
    this.accessToken = options.accessToken;
    this.adAccountId = options.adAccountId.replace(/^act_/, '');
    this.apiVersion = options.apiVersion || 'v20.0';
  }

  private async fetchWithTimeout(url: string, timeoutMs: number = 30000): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Meta API request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isRetryable = error instanceof Error &&
          (error.message.includes('timeout') ||
           error.message.includes('500') ||
           error.message.includes('503'));

        if (isLastAttempt || !isRetryable) {
          throw error;
        }

        const delayMs = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms`);
        await this.delay(delayMs);
      }
    }
    throw new Error('Retry logic error');
  }

  /**
   * Generic paginated fetch for Meta Insights API.
   * All insight methods delegate to this to avoid duplicating the pagination loop.
   */
  private async fetchPaginatedInsights<T>(options: PaginatedFetchOptions): Promise<T[]> {
    const { fields, level, since, until, limit, breakdowns } = options;

    const baseUrl = `https://graph.facebook.com/${this.apiVersion}/act_${this.adAccountId}/insights`;
    const searchParams = new URLSearchParams({
      fields: fields.join(','),
      level,
      time_increment: '1',
      limit: String(limit),
    });

    if (breakdowns && breakdowns.length > 0) {
      searchParams.set('breakdowns', breakdowns.join(','));
    }

    searchParams.append('time_range[since]', since);
    searchParams.append('time_range[until]', until);

    let nextUrl: string | undefined = `${baseUrl}?${searchParams.toString()}`;
    const allRows: T[] = [];
    let requestCount = 0;
    const maxRequests = 100;

    while (nextUrl && requestCount < maxRequests) {
      if (requestCount > 0) {
        await this.delay(this.requestDelay);
      }

      const payload = await this.retryWithBackoff(async () => {
        const res = await this.fetchWithTimeout(nextUrl!);
        const data = (await res.json()) as MetaInsightsResponse;

        if (!res.ok) {
          const errorMsg = data.error?.message || 'Meta API request failed';
          const errorCode = data.error?.code || res.status;
          const traceId = data.error?.fbtrace_id || 'N/A';
          throw new Error(`Meta API Error ${errorCode}: ${errorMsg} (trace: ${traceId})`);
        }

        return data;
      });

      if (payload.data?.length) {
        allRows.push(...(payload.data as unknown as T[]));
      }

      nextUrl = payload.paging?.next;
      requestCount++;
    }

    if (requestCount >= maxRequests && nextUrl) {
      console.warn(`Meta API pagination stopped at ${maxRequests} requests. More data may be available.`);
    }

    return allRows;
  }

  async fetchCampaignInsights(params: MetaInsightsParams): Promise<MetaInsightRow[]> {
    return this.fetchPaginatedInsights<MetaInsightRow>({
      fields: [
        'campaign_id', 'campaign_name', 'date_start', 'date_stop',
        'impressions', 'clicks', 'spend', 'ctr', 'cpc', 'reach',
        'frequency', 'cpm', 'quality_ranking', 'engagement_rate_ranking',
        'conversion_rate_ranking', 'actions', 'action_values',
      ],
      level: 'campaign',
      since: params.since,
      until: params.until,
      limit: params.limit || 500,
    });
  }

  async fetchAdSetInsights(params: MetaInsightsParams): Promise<MetaAdSetInsightRow[]> {
    return this.fetchPaginatedInsights<MetaAdSetInsightRow>({
      fields: [
        'campaign_id', 'adset_id', 'adset_name', 'date_start', 'date_stop',
        'impressions', 'reach', 'clicks', 'spend', 'ctr', 'cpc', 'cpm',
        'frequency', 'quality_ranking', 'engagement_rate_ranking',
        'conversion_rate_ranking', 'actions', 'action_values',
      ],
      level: 'adset',
      since: params.since,
      until: params.until,
      limit: params.limit || 500,
    });
  }

  async fetchBreakdownInsights(params: MetaInsightsParams & { breakdowns: string[] }): Promise<any[]> {
    return this.fetchPaginatedInsights<any>({
      fields: [
        'campaign_id', 'date_start', 'date_stop',
        'impressions', 'clicks', 'spend', 'reach', 'actions',
      ],
      level: 'campaign',
      since: params.since,
      until: params.until,
      limit: params.limit || 500,
      breakdowns: params.breakdowns,
    });
  }

  async fetchAdInsights(params: MetaInsightsParams): Promise<MetaAdInsightRow[]> {
    return this.fetchPaginatedInsights<MetaAdInsightRow>({
      fields: [
        'campaign_id', 'adset_id', 'ad_id', 'ad_name', 'date_start', 'date_stop',
        'impressions', 'reach', 'clicks', 'spend', 'ctr', 'cpc', 'cpm',
        'frequency', 'quality_ranking', 'engagement_rate_ranking',
        'conversion_rate_ranking', 'actions', 'action_values',
        'video_thruplay_actions', 'video_p25_watched_actions',
        'video_p50_watched_actions', 'video_p75_watched_actions',
        'video_p100_watched_actions',
      ],
      level: 'ad',
      since: params.since,
      until: params.until,
      limit: params.limit || 500,
    });
  }

  async fetchAdAccounts(): Promise<MetaAdAccount[]> {
    const url = `https://graph.facebook.com/${this.apiVersion}/me/adaccounts?fields=id,account_id,name,account_status,currency,timezone_name,business_name,spend_cap,amount_spent&limit=100`;

    const response = await this.retryWithBackoff(async () => {
      const res = await this.fetchWithTimeout(url);
      const data = (await res.json()) as any;

      if (!res.ok) {
        const errorMsg = data.error?.message || 'Failed to fetch ad accounts';
        const errorCode = data.error?.code || res.status;
        throw new Error(`Meta API Error ${errorCode}: ${errorMsg}`);
      }

      return data;
    });

    return (response as any).data || [];
  }

  async fetchCampaigns(): Promise<MetaCampaign[]> {
    const url = `https://graph.facebook.com/${this.apiVersion}/act_${this.adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time&limit=100`;

    const response = await this.retryWithBackoff(async () => {
      const res = await this.fetchWithTimeout(url);
      const data = (await res.json()) as any;

      if (!res.ok) {
        const errorMsg = data.error?.message || 'Failed to fetch campaigns';
        const errorCode = data.error?.code || res.status;
        throw new Error(`Meta API Error ${errorCode}: ${errorMsg}`);
      }

      return data;
    });

    return (response as any).data || [];
  }

  async fetchAdAccountDetails(): Promise<MetaAdAccount> {
    const url = `https://graph.facebook.com/${this.apiVersion}/act_${this.adAccountId}?fields=id,account_id,name,account_status,currency,timezone_name,business_name,spend_cap,amount_spent`;

    const response = await this.retryWithBackoff(async () => {
      const res = await this.fetchWithTimeout(url);
      const data = (await res.json()) as any;

      if (!res.ok) {
        const errorMsg = data.error?.message || 'Failed to fetch account details';
        const errorCode = data.error?.code || res.status;
        throw new Error(`Meta API Error ${errorCode}: ${errorMsg}`);
      }

      return data;
    });

    return response as MetaAdAccount;
  }
}
