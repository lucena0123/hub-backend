/**
 * Meta Ads API Integration
 * Fetches campaign insights from Meta Marketing API
 */

import type {
  MetaAd,
  MetaAdAccount,
  MetaAdInsightRow,
  MetaAdSet,
  MetaAdSetInsightRow,
  MetaCampaign,
  MetaGraphIdMapResponse,
  MetaGraphObjectError,
  MetaInsightRow,
  MetaInsightsResponse,
  MetaListResponse,
} from './types';

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

export type MetaWriteOperation =
  | 'pause_ad'
  | 'resume_ad'
  | 'set_adset_daily_budget'
  | 'set_campaign_daily_budget'
  | 'pause_campaign'
  | 'activate_campaign'
  | 'pause_adset'
  | 'activate_adset';

export type MetaWritebackError = {
  message: string;
  status: number | null;
  code: number | null;
  fbtraceId: string | null;
  raw: unknown;
};

export type MetaWritebackResult = {
  success: boolean;
  dryRun: boolean;
  operation: MetaWriteOperation;
  objectId: string;
  request: {
    method: 'GET' | 'POST';
    url: string;
    body?: Record<string, string>;
  };
  response: Record<string, unknown> | null;
  error: MetaWritebackError | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

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
          Authorization: `Bearer ${this.accessToken}`,
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

  private normalizeAccountId(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.replace(/^act_/i, '');
  }

  private buildGraphUrl(path: string, query?: Record<string, string>) {
    const base = `https://graph.facebook.com/${this.apiVersion}/${path}`;
    if (!query || Object.keys(query).length === 0) return base;
    const params = new URLSearchParams(query);
    return `${base}?${params.toString()}`;
  }

  private async requestGraph(params: {
    method: 'GET' | 'POST';
    path: string;
    query?: Record<string, string>;
    body?: Record<string, string>;
    timeoutMs?: number;
  }): Promise<{ ok: true; url: string; data: any } | { ok: false; url: string; error: MetaWritebackError; data: any }> {
    const url = this.buildGraphUrl(params.path, params.query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 30000);

    try {
      const bodySearchParams = params.body ? new URLSearchParams(params.body) : null;

      const response = await fetch(url, {
        method: params.method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': bodySearchParams ? 'application/x-www-form-urlencoded' : 'application/json',
        },
        ...(bodySearchParams ? { body: bodySearchParams } : {}),
        signal: controller.signal,
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        const message = (data && typeof data === 'object' && data.error && typeof data.error.message === 'string' ? data.error.message : null) ??
          `Meta API request failed (HTTP ${response.status})`;
        const code =
          data && typeof data === 'object' && data.error && typeof data.error.code === 'number' ? data.error.code : null;
        const fbtraceId =
          data && typeof data === 'object' && data.error && typeof data.error.fbtrace_id === 'string' ? data.error.fbtrace_id : null;

        return {
          ok: false,
          url,
          data,
          error: {
            message,
            status: response.status,
            code,
            fbtraceId,
            raw: data,
          },
        };
      }

      if (data && typeof data === 'object' && data.error) {
        const message = typeof data.error.message === 'string' ? data.error.message : 'Meta API returned an error payload';
        const code = typeof data.error.code === 'number' ? data.error.code : null;
        const fbtraceId = typeof data.error.fbtrace_id === 'string' ? data.error.fbtrace_id : null;
        return {
          ok: false,
          url,
          data,
          error: {
            message,
            status: response.status,
            code,
            fbtraceId,
            raw: data,
          },
        };
      }

      return { ok: true, url, data };
    } catch (error) {
      const message =
        (error as Error)?.name === 'AbortError'
          ? `Meta API request timeout after ${params.timeoutMs ?? 30000}ms`
          : error instanceof Error
            ? error.message
            : 'Meta API request failed';

      return {
        ok: false,
        url,
        data: null,
        error: {
          message,
          status: null,
          code: null,
          fbtraceId: null,
          raw: error,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async assertObjectBelongsToAccount(params: {
    objectId: string;
    objectType: 'ad' | 'adset';
  }): Promise<{ ok: true } | { ok: false; error: MetaWritebackError }> {
    const objectId = params.objectId.trim();
    const expected = this.normalizeAccountId(this.adAccountId);

    if (!objectId) {
      return {
        ok: false,
        error: {
          message: `Missing ${params.objectType} id`,
          status: null,
          code: null,
          fbtraceId: null,
          raw: null,
        },
      };
    }

    if (!expected) {
      return {
        ok: false,
        error: {
          message: 'Missing Meta ad account id in service configuration',
          status: null,
          code: null,
          fbtraceId: null,
          raw: null,
        },
      };
    }

    const res = await this.requestGraph({
      method: 'GET',
      path: objectId,
      query: { fields: 'account_id' },
    });

    if (!res.ok) {
      return { ok: false, error: res.error };
    }

    const accountId = this.normalizeAccountId(res.data?.account_id);
    if (!accountId) {
      return {
        ok: false,
        error: {
          message: `Unable to validate ${params.objectType} scope (missing account_id)`,
          status: null,
          code: null,
          fbtraceId: null,
          raw: res.data,
        },
      };
    }

    if (accountId !== expected) {
      return {
        ok: false,
        error: {
          message: `Scope mismatch: ${params.objectType} belongs to account ${accountId}, expected ${expected}`,
          status: null,
          code: null,
          fbtraceId: null,
          raw: res.data,
        },
      };
    }

    return { ok: true };
  }

  async pauseAd(adId: string, options?: { dryRun?: boolean }): Promise<MetaWritebackResult> {
    const objectId = String(adId ?? '').trim();
    const dryRun = Boolean(options?.dryRun);

    const request = {
      method: 'POST' as const,
      url: this.buildGraphUrl(objectId),
      body: { status: 'PAUSED' },
    };

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        operation: 'pause_ad',
        objectId,
        request,
        response: { success: true, dryRun: true },
        error: null,
      };
    }

    const scope = await this.assertObjectBelongsToAccount({ objectId, objectType: 'ad' });
    if (!scope.ok) {
      return {
        success: false,
        dryRun: false,
        operation: 'pause_ad',
        objectId,
        request,
        response: null,
        error: scope.error,
      };
    }

    const res = await this.requestGraph({
      method: 'POST',
      path: objectId,
      body: request.body,
    });

    if (!res.ok) {
      return {
        success: false,
        dryRun: false,
        operation: 'pause_ad',
        objectId,
        request: { ...request, url: res.url },
        response: isRecord(res.data) ? (res.data as any) : null,
        error: res.error,
      };
    }

    return {
      success: true,
      dryRun: false,
      operation: 'pause_ad',
      objectId,
      request: { ...request, url: res.url },
      response: isRecord(res.data) ? (res.data as any) : { success: true },
      error: null,
    };
  }

  async resumeAd(adId: string, options?: { dryRun?: boolean }): Promise<MetaWritebackResult> {
    const objectId = String(adId ?? '').trim();
    const dryRun = Boolean(options?.dryRun);

    const request = {
      method: 'POST' as const,
      url: this.buildGraphUrl(objectId),
      body: { status: 'ACTIVE' },
    };

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        operation: 'resume_ad',
        objectId,
        request,
        response: { success: true, dryRun: true },
        error: null,
      };
    }

    const scope = await this.assertObjectBelongsToAccount({ objectId, objectType: 'ad' });
    if (!scope.ok) {
      return {
        success: false,
        dryRun: false,
        operation: 'resume_ad',
        objectId,
        request,
        response: null,
        error: scope.error,
      };
    }

    const res = await this.requestGraph({
      method: 'POST',
      path: objectId,
      body: request.body,
    });

    if (!res.ok) {
      return {
        success: false,
        dryRun: false,
        operation: 'resume_ad',
        objectId,
        request: { ...request, url: res.url },
        response: isRecord(res.data) ? (res.data as any) : null,
        error: res.error,
      };
    }

    return {
      success: true,
      dryRun: false,
      operation: 'resume_ad',
      objectId,
      request: { ...request, url: res.url },
      response: isRecord(res.data) ? (res.data as any) : { success: true },
      error: null,
    };
  }

  async setAdSetDailyBudget(
    adsetId: string,
    amount: number,
    options?: { dryRun?: boolean; minorUnitMultiplier?: number }
  ): Promise<MetaWritebackResult> {
    const objectId = String(adsetId ?? '').trim();
    const dryRun = Boolean(options?.dryRun);
    const multiplier = Number.isFinite(options?.minorUnitMultiplier as number) ? Number(options?.minorUnitMultiplier) : 100;

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        dryRun,
        operation: 'set_adset_daily_budget',
        objectId,
        request: {
          method: 'POST',
          url: this.buildGraphUrl(objectId),
          body: {},
        },
        response: null,
        error: {
          message: `Invalid budget amount: ${amount}`,
          status: null,
          code: null,
          fbtraceId: null,
          raw: amount,
        },
      };
    }

    const cents = Math.round(amount * multiplier);
    const request = {
      method: 'POST' as const,
      url: this.buildGraphUrl(objectId),
      body: { daily_budget: String(cents) },
    };

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        operation: 'set_adset_daily_budget',
        objectId,
        request,
        response: { success: true, dryRun: true, daily_budget: String(cents) },
        error: null,
      };
    }

    const scope = await this.assertObjectBelongsToAccount({ objectId, objectType: 'adset' });
    if (!scope.ok) {
      return {
        success: false,
        dryRun: false,
        operation: 'set_adset_daily_budget',
        objectId,
        request,
        response: null,
        error: scope.error,
      };
    }

    const res = await this.requestGraph({
      method: 'POST',
      path: objectId,
      body: request.body,
    });

    if (!res.ok) {
      return {
        success: false,
        dryRun: false,
        operation: 'set_adset_daily_budget',
        objectId,
        request: { ...request, url: res.url },
        response: isRecord(res.data) ? (res.data as any) : null,
        error: res.error,
      };
    }

    return {
      success: true,
      dryRun: false,
      operation: 'set_adset_daily_budget',
      objectId,
      request: { ...request, url: res.url },
      response: isRecord(res.data) ? (res.data as any) : { success: true },
      error: null,
    };
  }

  async setCampaignDailyBudget(
    campaignId: string,
    amount: number,
    options?: { dryRun?: boolean; minorUnitMultiplier?: number }
  ): Promise<MetaWritebackResult> {
    const objectId = String(campaignId ?? '').trim();
    const dryRun = Boolean(options?.dryRun);
    const multiplier = Number.isFinite(options?.minorUnitMultiplier as number) ? Number(options?.minorUnitMultiplier) : 100;

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        dryRun,
        operation: 'set_campaign_daily_budget',
        objectId,
        request: {
          method: 'POST',
          url: this.buildGraphUrl(objectId),
          body: {},
        },
        response: null,
        error: {
          message: `Invalid budget amount: ${amount}`,
          status: null,
          code: null,
          fbtraceId: null,
          raw: amount,
        },
      };
    }

    const cents = Math.round(amount * multiplier);
    const request = {
      method: 'POST' as const,
      url: this.buildGraphUrl(objectId),
      body: { daily_budget: String(cents) },
    };

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        operation: 'set_campaign_daily_budget',
        objectId,
        request,
        response: { success: true, dryRun: true, daily_budget: String(cents) },
        error: null,
      };
    }

    const res = await this.requestGraph({
      method: 'POST',
      path: objectId,
      body: request.body,
    });

    if (!res.ok) {
      return {
        success: false,
        dryRun: false,
        operation: 'set_campaign_daily_budget',
        objectId,
        request: { ...request, url: res.url },
        response: isRecord(res.data) ? (res.data as any) : null,
        error: res.error,
      };
    }

    return {
      success: true,
      dryRun: false,
      operation: 'set_campaign_daily_budget',
      objectId,
      request: { ...request, url: res.url },
      response: isRecord(res.data) ? (res.data as any) : { success: true },
      error: null,
    };
  }

  async pauseCampaign(campaignId: string, options?: { dryRun?: boolean }): Promise<MetaWritebackResult> {
    const objectId = String(campaignId ?? '').trim();
    const dryRun = Boolean(options?.dryRun);

    const request = {
      method: 'POST' as const,
      url: this.buildGraphUrl(objectId),
      body: { status: 'PAUSED' },
    };

    if (dryRun) {
      return { success: true, dryRun: true, operation: 'pause_campaign', objectId, request, response: { success: true, dryRun: true }, error: null };
    }

    const res = await this.requestGraph({ method: 'POST', path: objectId, body: request.body });
    if (!res.ok) {
      return { success: false, dryRun: false, operation: 'pause_campaign', objectId, request: { ...request, url: res.url }, response: isRecord(res.data) ? (res.data as any) : null, error: res.error };
    }
    return { success: true, dryRun: false, operation: 'pause_campaign', objectId, request: { ...request, url: res.url }, response: isRecord(res.data) ? (res.data as any) : { success: true }, error: null };
  }

  async activateCampaign(campaignId: string, options?: { dryRun?: boolean }): Promise<MetaWritebackResult> {
    const objectId = String(campaignId ?? '').trim();
    const dryRun = Boolean(options?.dryRun);

    const request = {
      method: 'POST' as const,
      url: this.buildGraphUrl(objectId),
      body: { status: 'ACTIVE' },
    };

    if (dryRun) {
      return { success: true, dryRun: true, operation: 'activate_campaign', objectId, request, response: { success: true, dryRun: true }, error: null };
    }

    const res = await this.requestGraph({ method: 'POST', path: objectId, body: request.body });
    if (!res.ok) {
      return { success: false, dryRun: false, operation: 'activate_campaign', objectId, request: { ...request, url: res.url }, response: isRecord(res.data) ? (res.data as any) : null, error: res.error };
    }
    return { success: true, dryRun: false, operation: 'activate_campaign', objectId, request: { ...request, url: res.url }, response: isRecord(res.data) ? (res.data as any) : { success: true }, error: null };
  }

  async pauseAdSet(adsetId: string, options?: { dryRun?: boolean }): Promise<MetaWritebackResult> {
    const objectId = String(adsetId ?? '').trim();
    const dryRun = Boolean(options?.dryRun);

    const request = {
      method: 'POST' as const,
      url: this.buildGraphUrl(objectId),
      body: { status: 'PAUSED' },
    };

    if (dryRun) {
      return { success: true, dryRun: true, operation: 'pause_adset', objectId, request, response: { success: true, dryRun: true }, error: null };
    }

    const scope = await this.assertObjectBelongsToAccount({ objectId, objectType: 'adset' });
    if (!scope.ok) {
      return { success: false, dryRun: false, operation: 'pause_adset', objectId, request, response: null, error: scope.error };
    }

    const res = await this.requestGraph({ method: 'POST', path: objectId, body: request.body });
    if (!res.ok) {
      return { success: false, dryRun: false, operation: 'pause_adset', objectId, request: { ...request, url: res.url }, response: isRecord(res.data) ? (res.data as any) : null, error: res.error };
    }
    return { success: true, dryRun: false, operation: 'pause_adset', objectId, request: { ...request, url: res.url }, response: isRecord(res.data) ? (res.data as any) : { success: true }, error: null };
  }

  async activateAdSet(adsetId: string, options?: { dryRun?: boolean }): Promise<MetaWritebackResult> {
    const objectId = String(adsetId ?? '').trim();
    const dryRun = Boolean(options?.dryRun);

    const request = {
      method: 'POST' as const,
      url: this.buildGraphUrl(objectId),
      body: { status: 'ACTIVE' },
    };

    if (dryRun) {
      return { success: true, dryRun: true, operation: 'activate_adset', objectId, request, response: { success: true, dryRun: true }, error: null };
    }

    const scope = await this.assertObjectBelongsToAccount({ objectId, objectType: 'adset' });
    if (!scope.ok) {
      return { success: false, dryRun: false, operation: 'activate_adset', objectId, request, response: null, error: scope.error };
    }

    const res = await this.requestGraph({ method: 'POST', path: objectId, body: request.body });
    if (!res.ok) {
      return { success: false, dryRun: false, operation: 'activate_adset', objectId, request: { ...request, url: res.url }, response: isRecord(res.data) ? (res.data as any) : null, error: res.error };
    }
    return { success: true, dryRun: false, operation: 'activate_adset', objectId, request: { ...request, url: res.url }, response: isRecord(res.data) ? (res.data as any) : { success: true }, error: null };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isRetryable =
          error instanceof Error &&
          (error.message.includes('timeout') || error.message.includes('500') || error.message.includes('503'));

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
        const data = (await res.json()) as MetaInsightsResponse<T>;

        if (!res.ok) {
          const errorMsg = data.error?.message || 'Meta API request failed';
          const errorCode = data.error?.code || res.status;
          const traceId = data.error?.fbtrace_id || 'N/A';
          throw new Error(`Meta API Error ${errorCode}: ${errorMsg} (trace: ${traceId})`);
        }

        return data;
      });

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

  /**
   * Generic paginated fetch for Meta list endpoints (e.g. /campaigns).
   */
  private async fetchPaginatedList<T>(initialUrl: string): Promise<T[]> {
    let nextUrl: string | undefined = initialUrl;
    const allRows: T[] = [];
    let requestCount = 0;
    const maxRequests = 100;

    while (nextUrl && requestCount < maxRequests) {
      if (requestCount > 0) {
        await this.delay(this.requestDelay);
      }

      const payload = await this.retryWithBackoff(async () => {
        const res = await this.fetchWithTimeout(nextUrl!);
        const data = (await res.json()) as MetaListResponse<T>;

        if (!res.ok) {
          const errorMsg = data.error?.message || 'Meta API request failed';
          const errorCode = data.error?.code || res.status;
          const traceId = data.error?.fbtrace_id || 'N/A';
          throw new Error(`Meta API Error ${errorCode}: ${errorMsg} (trace: ${traceId})`);
        }

        return data;
      });

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

  async fetchCampaignInsights(params: MetaInsightsParams): Promise<MetaInsightRow[]> {
    return this.fetchPaginatedInsights<MetaInsightRow>({
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
        'reach',
        'frequency',
        'cpm',
        'quality_ranking',
        'engagement_rate_ranking',
        'conversion_rate_ranking',
        'actions',
        'action_values',
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
        'campaign_id',
        'adset_id',
        'adset_name',
        'date_start',
        'date_stop',
        'impressions',
        'reach',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'cpm',
        'frequency',
        'quality_ranking',
        'engagement_rate_ranking',
        'conversion_rate_ranking',
        'actions',
        'action_values',
      ],
      level: 'adset',
      since: params.since,
      until: params.until,
      limit: params.limit || 500,
    });
  }

  async fetchBreakdownInsights(params: MetaInsightsParams & { breakdowns: string[] }): Promise<any[]> {
    return this.fetchPaginatedInsights<any>({
      fields: ['campaign_id', 'date_start', 'date_stop', 'impressions', 'clicks', 'spend', 'reach', 'actions'],
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
        'campaign_id',
        'adset_id',
        'ad_id',
        'ad_name',
        'date_start',
        'date_stop',
        'impressions',
        'reach',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'cpm',
        'frequency',
        'quality_ranking',
        'engagement_rate_ranking',
        'conversion_rate_ranking',
        'actions',
        'action_values',
        'video_thruplay_watched_actions',
        'video_p25_watched_actions',
        'video_p50_watched_actions',
        'video_p75_watched_actions',
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
    return this.fetchPaginatedList<MetaCampaign>(url);
  }

  async fetchAdSets(): Promise<MetaAdSet[]> {
    const url = `https://graph.facebook.com/${this.apiVersion}/act_${this.adAccountId}/adsets?fields=id,name,campaign_id,status,configured_status,effective_status,daily_budget,lifetime_budget,billing_event,optimization_goal,bid_strategy,bid_amount,bid_cap,cost_cap,destination_type,promoted_object,attribution_spec,targeting,start_time,end_time,created_time,updated_time&limit=100`;
    return this.fetchPaginatedList<MetaAdSet>(url);
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

  /**
   * Fetch Ad objects by ID (non-insights endpoint) to retrieve creative details.
   * Uses the Graph API `/?ids=...` pattern with a batch of IDs per request.
   */
  async fetchAdsByIds(adIds: string[]): Promise<MetaAd[]> {
    if (!adIds.length) return [];

    const fields = [
      'id',
      'name',
      'adset_id',
      'campaign_id',
      'status',
      'effective_status',
      'updated_time',
      'creative{id,name,object_story_spec,asset_feed_spec,body,title,call_to_action_type,link_url,image_url,thumbnail_url,video_id,object_type}',
    ];

    const chunkSize = 50;
    const allAds: MetaAd[] = [];

    for (let offset = 0; offset < adIds.length; offset += chunkSize) {
      if (offset > 0) {
        await this.delay(this.requestDelay);
      }

      const batch = adIds.slice(offset, offset + chunkSize);
      const searchParams = new URLSearchParams({
        ids: batch.join(','),
        fields: fields.join(','),
      });

      const url = `https://graph.facebook.com/${this.apiVersion}/?${searchParams.toString()}`;

      const payload = await this.retryWithBackoff(async () => {
        const res = await this.fetchWithTimeout(url);
        const data = (await res.json()) as MetaGraphIdMapResponse<MetaAd> & MetaGraphObjectError;

        if (!res.ok) {
          const errorMsg = (data as MetaGraphObjectError).error?.message || 'Meta API request failed';
          const errorCode = (data as MetaGraphObjectError).error?.code || res.status;
          const traceId = (data as MetaGraphObjectError).error?.fbtrace_id || 'N/A';
          throw new Error(`Meta API Error ${errorCode}: ${errorMsg} (trace: ${traceId})`);
        }

        return data;
      });

      if ((payload as MetaGraphObjectError).error) {
        const errorMsg = (payload as MetaGraphObjectError).error?.message || 'Meta API request failed';
        const errorCode = (payload as MetaGraphObjectError).error?.code || 0;
        const traceId = (payload as MetaGraphObjectError).error?.fbtrace_id || 'N/A';
        throw new Error(`Meta API Error ${errorCode}: ${errorMsg} (trace: ${traceId})`);
      }

      for (const [key, value] of Object.entries(payload)) {
        if (key === 'error') continue;
        if (!value || typeof value !== 'object') continue;
        const maybeError = value as MetaGraphObjectError;
        if (maybeError.error) continue;
        if (typeof (value as any).id !== 'string') continue;
        allAds.push(value as MetaAd);
      }
    }

    return allAds;
  }
}
