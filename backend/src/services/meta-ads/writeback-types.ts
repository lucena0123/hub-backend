export type MetaWriteOperation =
  | 'pause_ad'
  | 'resume_ad'
  | 'set_adset_daily_budget'
  | 'set_campaign_daily_budget'
  | 'pause_campaign'
  | 'activate_campaign'
  | 'pause_adset'
  | 'activate_adset'
  | 'rename_campaign'
  | 'rename_adset'
  | 'rename_ad';

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
