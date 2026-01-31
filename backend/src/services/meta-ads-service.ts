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
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
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

export class MetaAdsService {
  private accessToken: string;
  private adAccountId: string;
  private apiVersion: string;
  private requestDelay: number = 100; // Rate limiting: 100ms between requests

  constructor(options: { accessToken: string; adAccountId: string; apiVersion?: string }) {
    this.accessToken = options.accessToken;
    this.adAccountId = options.adAccountId.replace(/^act_/, '');
    this.apiVersion = options.apiVersion || 'v20.0';
  }

  /**
   * Fetch with timeout support
   */
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

  /**
   * Rate limiting delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchCampaignInsights(params: MetaInsightsParams): Promise<MetaInsightRow[]> {
    const { since, until, limit = 500 } = params;

    const baseUrl = `https://graph.facebook.com/${this.apiVersion}/act_${this.adAccountId}/insights`;
    const searchParams = new URLSearchParams({
      fields: [
        'campaign_id',
        'campaign_name',
        'date_start',
        'date_stop',
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'actions',
        'action_values',
      ].join(','),
      level: 'campaign',
      time_increment: '1',
      limit: String(limit),
    });

    searchParams.append('time_range[since]', since);
    searchParams.append('time_range[until]', until);

    let nextUrl: string | undefined = `${baseUrl}?${searchParams.toString()}`;
    const allRows: MetaInsightRow[] = [];
    let requestCount = 0;
    const maxRequests = 100; // Safety limit to prevent infinite loops

    while (nextUrl && requestCount < maxRequests) {
      // Rate limiting: wait between requests (except first)
      if (requestCount > 0) {
        await this.delay(this.requestDelay);
      }

      const response = await this.fetchWithTimeout(nextUrl);
      const payload = (await response.json()) as MetaInsightsResponse;

      if (!response.ok) {
        const errorMsg = payload.error?.message || 'Meta API request failed';
        const errorCode = payload.error?.code || response.status;
        const traceId = payload.error?.fbtrace_id || 'N/A';
        throw new Error(`Meta API Error ${errorCode}: ${errorMsg} (trace: ${traceId})`);
      }

      if (payload.data?.length) {
        allRows.push(...payload.data);
      }

      nextUrl = payload.paging?.next;
      requestCount++;
    }

    if (requestCount >= maxRequests && nextUrl) {
      console.warn(`Meta API pagination stopped at ${maxRequests} requests. More data may be available.`);
    }

    return allRows;
  }
}
