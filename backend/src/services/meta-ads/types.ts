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

export type MetaAdSet = {
  id: string;
  name?: string;
  campaign_id?: string;
  status?: string;
  effective_status?: string;
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
  video_thruplay_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p25_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p50_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p75_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p100_watched_actions?: Array<{ action_type: string; value: string }>;
};

export type MetaAdCreative = {
  id: string;
  name?: string;
  object_story_spec?: any;
  asset_feed_spec?: any;
  body?: string;
  title?: string;
  description?: string;
  call_to_action_type?: string;
  link_url?: string;
  image_url?: string;
  thumbnail_url?: string;
  video_id?: string;
  object_type?: string;
  instagram_permalink_url?: string;
};

export type MetaAd = {
  id: string;
  name?: string;
  adset_id?: string;
  campaign_id?: string;
  status?: string;
  effective_status?: string;
  updated_time?: string;
  creative?: MetaAdCreative;
};

export type MetaApiError = {
  message?: string;
  type?: string;
  code?: number;
  fbtrace_id?: string;
};

export type MetaInsightsResponse<T = any> = {
  data: T[];
  paging?: {
    next?: string;
  };
  error?: MetaApiError;
};

export type MetaListResponse<T> = {
  data: T[];
  paging?: {
    next?: string;
  };
  error?: MetaApiError;
};

export type MetaGraphObjectError = {
  error?: MetaApiError;
};

export type MetaGraphIdMapResponse<T> = Record<string, T | MetaGraphObjectError>;
