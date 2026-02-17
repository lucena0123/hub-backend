import type { PrismaClient } from '@prisma/client';
import type { LearningSummary } from '../../types/metrics';

const LEARNING_EVENT_TARGET = 50;
const LEARNING_WINDOW_DAYS = 7;

type ActionGroup = {
  key: string;
  label: string;
  actionTypes: string[];
};

const ACTION_GROUPS: ActionGroup[] = [
  {
    key: 'messages',
    label: 'Conversas',
    actionTypes: [
      'onsite_conversion.messaging_conversation_started_7d',
      'messaging_conversation_started_7d',
    ],
  },
  {
    key: 'leads',
    label: 'Leads',
    actionTypes: ['lead', 'leadgen', 'omni_lead'],
  },
  {
    key: 'purchases',
    label: 'Compras',
    actionTypes: [
      'purchase',
      'offsite_conversion.purchase',
      'omni_purchase',
      'onsite_conversion.purchase',
      'web_purchase',
      'mobile_purchase',
    ],
  },
  {
    key: 'lpv',
    label: 'LP Views',
    actionTypes: ['landing_page_view'],
  },
  {
    key: 'link_clicks',
    label: 'Link Clicks',
    actionTypes: ['link_click'],
  },
];

const normalize = (value?: string | null) =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

const normalizeObjective = (value?: string | null) => {
  const raw = normalize(value);
  return raw.replace(/^OUTCOME_/, '').replace(/^OBJECTIVE_/, '').replace(/^GOAL_/, '');
};

const resolveActionGroup = (optimizationGoal?: string | null, objective?: string | null) => {
  const goal = normalize(optimizationGoal);
  const obj = normalizeObjective(objective);

  if (goal.includes('MESSAGE') || goal.includes('MESSAGING') || goal.includes('CONVERSATION')) {
    return ACTION_GROUPS.find((group) => group.key === 'messages')!;
  }
  if (goal.includes('LEAD') || obj.includes('LEAD')) {
    return ACTION_GROUPS.find((group) => group.key === 'leads')!;
  }
  if (goal.includes('LANDING_PAGE') || goal.includes('LPV')) {
    return ACTION_GROUPS.find((group) => group.key === 'lpv')!;
  }
  if (goal.includes('LINK_CLICKS') || goal.includes('CLICKS') || obj.includes('TRAFFIC')) {
    return ACTION_GROUPS.find((group) => group.key === 'link_clicks')!;
  }
  if (goal.includes('PURCHASE') || goal.includes('VALUE') || goal.includes('CONVERSION') || obj.includes('SALES') || obj.includes('PURCHASE')) {
    return ACTION_GROUPS.find((group) => group.key === 'purchases')!;
  }

  if (obj.includes('MESSAGE')) return ACTION_GROUPS.find((group) => group.key === 'messages')!;
  if (obj.includes('LEAD')) return ACTION_GROUPS.find((group) => group.key === 'leads')!;
  if (obj.includes('TRAFFIC')) return ACTION_GROUPS.find((group) => group.key === 'link_clicks')!;
  if (obj.includes('CONVERSION')) return ACTION_GROUPS.find((group) => group.key === 'purchases')!;

  return ACTION_GROUPS.find((group) => group.key === 'purchases')!;
};

const parseJson = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
};

const readActionValue = (actions: Record<string, unknown> | null, key: string) => {
  if (!actions) return 0;
  const value = actions[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
};

const sumActionGroup = (actions: Record<string, unknown> | null, group: ActionGroup) => {
  return group.actionTypes.reduce((sum, key) => sum + readActionValue(actions, key), 0);
};

const normalizeLearningStatus = (value: unknown) => {
  if (!value || typeof value !== 'string') return 'unknown';
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (normalized.includes('learning limited') || normalized.includes('learning_limited') || normalized.includes('limited')) {
    return 'learning_limited';
  }
  if (normalized.includes('learning')) return 'learning';
  if (normalized.includes('active') || normalized.includes('completed') || normalized.includes('ready')) return 'active';
  return normalized;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const buildLearningSummary = async (
  prisma: PrismaClient,
  campaignId: string,
  campaignObjective?: string | null
): Promise<LearningSummary | null> => {
  const adsets = await prisma.$queryRaw<any[]>`
    SELECT
      adset_id,
      adset_name,
      learning_status,
      last_significant_edit,
      metadata,
      daily_budget,
      lifetime_budget
    FROM adsets
    WHERE campaign_id = ${campaignId} AND platform = 'meta'
  `;

  if (!adsets || adsets.length === 0) return null;

  const statusCounts = { learning: 0, limited: 0, active: 0, unknown: 0 };
  const adsetWindows = new Map<string, { start: Date; end: Date }>();
  const adsetGroups = new Map<string, ActionGroup>();

  let minStart: Date | null = null;
  let maxEnd: Date | null = null;
  let withLastEdit = 0;
  let withLearningStatus = 0;

  for (const row of adsets) {
    const adsetId = String(row.adset_id);
    const learningStatus = normalizeLearningStatus(row.learning_status);
    if (learningStatus === 'learning') statusCounts.learning += 1;
    else if (learningStatus === 'learning_limited') statusCounts.limited += 1;
    else if (learningStatus === 'active') statusCounts.active += 1;
    else statusCounts.unknown += 1;

    if (row.learning_status) withLearningStatus += 1;

    const lastEdit = row.last_significant_edit ? new Date(row.last_significant_edit) : null;
    if (lastEdit && !Number.isNaN(lastEdit.getTime())) {
      const start = new Date(lastEdit);
      const end = addDays(start, LEARNING_WINDOW_DAYS - 1);
      adsetWindows.set(adsetId, { start, end });
      withLastEdit += 1;
      if (!minStart || start < minStart) minStart = start;
      if (!maxEnd || end > maxEnd) maxEnd = end;
    }

    const metadata = parseJson(row.metadata);
    const optimizationGoal = typeof metadata?.optimizationGoal === 'string' ? metadata?.optimizationGoal : null;
    const group = resolveActionGroup(optimizationGoal, campaignObjective ?? null);
    adsetGroups.set(adsetId, group);
  }

  const adsetCount = adsets.length;
  const adsetsWithWindows = adsetWindows.size;

  let metricsRows: any[] = [];
  let budgetRows: any[] = [];

  if (minStart && maxEnd) {
    metricsRows = await prisma.$queryRaw<any[]>`
      SELECT adset_id, date, spend, actions_by_type
      FROM adset_metrics
      WHERE campaign_id = ${campaignId}
        AND date >= ${minStart}
        AND date <= ${maxEnd}
    `;

    try {
      budgetRows = await prisma.$queryRaw<any[]>`
        SELECT adset_id, date, daily_budget, lifetime_budget
        FROM adset_budget_history
        WHERE campaign_id = ${campaignId}
          AND date >= ${minStart}
          AND date <= ${maxEnd}
      `;
    } catch (_error) {
      budgetRows = [];
    }
  }

  const metricsByAdset = new Map<string, any[]>();
  for (const row of metricsRows) {
    const adsetId = String(row.adset_id);
    if (!metricsByAdset.has(adsetId)) metricsByAdset.set(adsetId, []);
    metricsByAdset.get(adsetId)!.push(row);
  }

  const budgetsByAdset = new Map<string, any[]>();
  for (const row of budgetRows) {
    const adsetId = String(row.adset_id);
    if (!budgetsByAdset.has(adsetId)) budgetsByAdset.set(adsetId, []);
    budgetsByAdset.get(adsetId)!.push(row);
  }

  let totalEvents = 0;
  let totalCost = 0;
  let totalEventsWithData = 0;
  let adsetsMeetingTarget = 0;
  let adsetsBelowTarget = 0;
  let adsetsWithEventData = 0;
  let adsetsWithBudgetData = 0;
  let budgetAdequateCount = 0;
  let budgetUnknownCount = 0;
  let budgetDailySum = 0;
  let requiredDailySum = 0;
  let requiredDailyCount = 0;
  const groupCounts = new Map<string, number>();

  for (const [adsetId, group] of adsetGroups.entries()) {
    groupCounts.set(group.key, (groupCounts.get(group.key) ?? 0) + 1);
    const window = adsetWindows.get(adsetId);
    if (!window) {
      adsetsBelowTarget += 1;
      budgetUnknownCount += 1;
      continue;
    }

    const rows = metricsByAdset.get(adsetId) ?? [];
    let eventCount = 0;
    let spend = 0;

    for (const row of rows) {
      const date = row.date instanceof Date ? row.date : new Date(row.date);
      if (date < window.start || date > window.end) continue;
      const actions = parseJson(row.actions_by_type);
      eventCount += sumActionGroup(actions, group);
      spend += Number(row.spend) || 0;
    }

    if (eventCount > 0) {
      adsetsWithEventData += 1;
      totalEventsWithData += eventCount;
      totalCost += spend;
    }

    totalEvents += eventCount;

    if (eventCount >= LEARNING_EVENT_TARGET) {
      adsetsMeetingTarget += 1;
    } else {
      adsetsBelowTarget += 1;
    }

    const budgetRowsForAdset = budgetsByAdset.get(adsetId) ?? [];
    let dailyBudgetAvg: number | null = null;

    if (budgetRowsForAdset.length > 0) {
      const budgetsInWindow = budgetRowsForAdset.filter((row) => {
        const date = row.date instanceof Date ? row.date : new Date(row.date);
        return date >= window.start && date <= window.end;
      });
      if (budgetsInWindow.length > 0) {
        const sumBudget = budgetsInWindow.reduce((sum, row) => sum + (Number(row.daily_budget) || 0), 0);
        dailyBudgetAvg = sumBudget / budgetsInWindow.length;
      }
    }

    if (dailyBudgetAvg != null && Number.isFinite(dailyBudgetAvg) && dailyBudgetAvg > 0) {
      adsetsWithBudgetData += 1;
      budgetDailySum += dailyBudgetAvg;
    } else {
      budgetUnknownCount += 1;
    }

    const costPerEvent = eventCount > 0 ? spend / eventCount : null;
    const requiredDaily = costPerEvent != null && costPerEvent > 0 ? (costPerEvent * LEARNING_EVENT_TARGET) / LEARNING_WINDOW_DAYS : null;

    if (requiredDaily != null) {
      requiredDailySum += requiredDaily;
      requiredDailyCount += 1;
    }

    if (dailyBudgetAvg != null && requiredDaily != null) {
      if (dailyBudgetAvg >= requiredDaily) budgetAdequateCount += 1;
    }
  }

  const avgCostPerEvent = totalEventsWithData > 0 ? totalCost / totalEventsWithData : null;
  const budgetDailyAverage = adsetsWithBudgetData > 0 ? budgetDailySum / adsetsWithBudgetData : null;
  const budgetDailyRequired = requiredDailyCount > 0 ? requiredDailySum / requiredDailyCount : null;

  let eventLabel = 'Conversões';
  if (groupCounts.size === 1) {
    const [key] = Array.from(groupCounts.keys());
    const group = ACTION_GROUPS.find((g) => g.key === key);
    if (group) eventLabel = group.label;
  } else if (groupCounts.size > 1) {
    eventLabel = 'Misto';
  }

  const avgEventsPerAdset = adsetCount > 0 ? totalEvents / adsetCount : 0;

  let conclusion: LearningSummary['conclusion'] = 'insufficient_data';

  if (statusCounts.limited > 0) {
    conclusion = 'learning_limited';
  } else if (statusCounts.learning > 0) {
    conclusion = 'learning';
  } else if (adsetsWithWindows === 0 || adsetsWithEventData === 0) {
    conclusion = 'insufficient_data';
  } else if (adsetsBelowTarget > 0) {
    conclusion = 'events_low';
  } else if (adsetsWithBudgetData > 0 && budgetAdequateCount < adsetsWithBudgetData) {
    conclusion = 'budget_low';
  } else {
    conclusion = 'passed';
  }

  const lastEditRange = {
    min: minStart ? minStart.toISOString() : null,
    max: maxEnd ? maxEnd.toISOString() : null,
  };

  return {
    adsetCount,
    statusCounts,
    eventTarget: LEARNING_EVENT_TARGET,
    eventLabel,
    adsetsMeetingTarget,
    adsetsBelowTarget,
    totalEventsInWindow: totalEvents,
    avgEventsPerAdset: Number.isFinite(avgEventsPerAdset) ? Number(avgEventsPerAdset.toFixed(1)) : 0,
    avgCostPerEvent: avgCostPerEvent != null && Number.isFinite(avgCostPerEvent) ? Number(avgCostPerEvent.toFixed(2)) : null,
    budgetDailyAverage: budgetDailyAverage != null && Number.isFinite(budgetDailyAverage) ? Number(budgetDailyAverage.toFixed(2)) : null,
    budgetDailyRequired: budgetDailyRequired != null && Number.isFinite(budgetDailyRequired) ? Number(budgetDailyRequired.toFixed(2)) : null,
    budgetAdequateCount,
    budgetUnknownCount,
    dataCoverage: {
      withLastEdit: withLastEdit,
      withLearningStatus: withLearningStatus,
      withEventData: adsetsWithEventData,
      withBudgetData: adsetsWithBudgetData,
    },
    lastEditRange,
    conclusion,
    notes: adsetsWithWindows === 0 ? 'Sem última edição significativa registrada.' : undefined,
  };
};
