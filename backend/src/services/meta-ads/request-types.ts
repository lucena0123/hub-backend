export type MetaInsightsParams = {
  since: string;
  until: string;
  limit?: number;
};

export type PaginatedFetchOptions = {
  fields: string[];
  level: string;
  since: string;
  until: string;
  limit: number;
  breakdowns?: string[];
};

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
