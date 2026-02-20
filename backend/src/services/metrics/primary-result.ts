export type ObjectiveMeta = {
  optimizationGoal?: string | null;
  destinationType?: string | null;
  billingEvent?: string | null;
};

export type PrimaryResultKey =
  | 'messaging_conversations'
  | 'leads'
  | 'landing_page_views'
  | 'link_clicks'
  | 'purchases'
  | 'conversions'
  | 'clicks';

export type PrimaryResultConfig = {
  key: PrimaryResultKey;
  label: string;
};

export type PrimaryResultMetrics = {
  messagingConversations?: number | null;
  leads?: number | null;
  linkClicks?: number | null;
  landingPageViews?: number | null;
  purchases?: number | null;
  conversions?: number | null;
  clicks?: number | null;
};

const normalize = (value?: string | null) =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

const normalizeObjective = (value?: string | null) => {
  const raw = normalize(value);
  return raw.replace(/^OUTCOME_/, '').replace(/^OBJECTIVE_/, '').replace(/^GOAL_/, '');
};

const hasAny = (value: string, tokens: string[]) => tokens.some((token) => value.includes(token));

export const resolvePrimaryResultConfig = (params: {
  objective?: string | null;
  objectiveMeta?: ObjectiveMeta | null;
}): PrimaryResultConfig => {
  const objective = normalizeObjective(params.objective);
  const optimizationGoal = normalize(params.objectiveMeta?.optimizationGoal);
  const destinationType = normalize(params.objectiveMeta?.destinationType);

  const isMessaging =
    hasAny(destinationType, ['WHATSAPP', 'MESSENGER', 'MESSAGING', 'DIRECT']) ||
    hasAny(optimizationGoal, ['CONVERSATION', 'MESSAGE', 'MESSAGING']) ||
    hasAny(objective, ['MESSAGE', 'MESSAGING']);

  if (isMessaging) {
    return { key: 'messaging_conversations', label: 'Conversas' };
  }

  if (hasAny(optimizationGoal, ['LEAD']) || hasAny(objective, ['LEAD'])) {
    return { key: 'leads', label: 'Leads' };
  }

  if (hasAny(optimizationGoal, ['LANDING_PAGE', 'LPV'])) {
    return { key: 'landing_page_views', label: 'LP Views' };
  }

  if (hasAny(optimizationGoal, ['LINK_CLICKS', 'CLICKS']) || hasAny(objective, ['TRAFFIC'])) {
    return { key: 'link_clicks', label: 'Link Clicks' };
  }

  if (
    hasAny(optimizationGoal, ['PURCHASE', 'VALUE', 'OFFSITE_CONVERSIONS', 'CONVERSION']) ||
    hasAny(objective, ['SALES', 'CONVERSION', 'PURCHASE'])
  ) {
    return { key: 'purchases', label: 'Compras' };
  }

  return { key: 'conversions', label: 'Conversões' };
};

export const resolvePrimaryResultValue = (
  config: PrimaryResultConfig,
  metrics: PrimaryResultMetrics
): number => {
  const messaging = Number(metrics.messagingConversations ?? 0);
  const leads = Number(metrics.leads ?? 0);
  const linkClicks = Number(metrics.linkClicks ?? 0);
  const landing = Number(metrics.landingPageViews ?? 0);
  const purchases = Number(metrics.purchases ?? 0);
  const conversions = Number(metrics.conversions ?? 0);
  const clicks = Number(metrics.clicks ?? 0);

  switch (config.key) {
    case 'messaging_conversations':
      return messaging > 0 ? messaging : conversions;
    case 'leads':
      return leads > 0 ? leads : conversions;
    case 'landing_page_views':
      if (landing > 0) return landing;
      if (linkClicks > 0) return linkClicks;
      if (clicks > 0) return clicks;
      return conversions;
    case 'link_clicks':
      if (linkClicks > 0) return linkClicks;
      if (clicks > 0) return clicks;
      return conversions;
    case 'purchases':
      return purchases > 0 ? purchases : conversions;
    case 'clicks':
      return clicks > 0 ? clicks : conversions;
    default:
      return conversions > 0 ? conversions : messaging > 0 ? messaging : leads > 0 ? leads : linkClicks;
  }
};

export const resolvePrimaryResult = (params: {
  objective?: string | null;
  objectiveMeta?: ObjectiveMeta | null;
  metrics: PrimaryResultMetrics;
}) => {
  const config = resolvePrimaryResultConfig(params);
  const value = resolvePrimaryResultValue(config, params.metrics);
  return {
    ...config,
    value,
  };
};
