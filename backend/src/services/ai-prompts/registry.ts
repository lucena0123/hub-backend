import type { PromptDefinition, PromptId } from './types';

import { COPY_INSIGHTS_PROMPT, type CopyInsightsPromptInput } from './prompts/copy-insights';
import { COPY_GENERATOR_PROMPT, type CopyGeneratorPromptInput } from './prompts/copy-generator';
import { WEEKLY_SUMMARY_PROMPT, type WeeklySummaryPromptInput } from './prompts/weekly-summary';
import { REPORT_MONTHLY_PROMPT, type MonthlyReportPromptInput } from './prompts/report-monthly';
import { REPORT_WEEKLY_PROMPT, type WeeklyReportPromptInput } from './prompts/report-weekly';

type PromptInputMap = {
  'copy-insights': CopyInsightsPromptInput;
  'copy-generator': CopyGeneratorPromptInput;
  'weekly-summary': WeeklySummaryPromptInput;
  'report-monthly': MonthlyReportPromptInput;
  'report-weekly': WeeklyReportPromptInput;
};

const REGISTRY: { [K in PromptId]: PromptDefinition<PromptInputMap[K]> } = {
  'copy-insights': COPY_INSIGHTS_PROMPT,
  'copy-generator': COPY_GENERATOR_PROMPT,
  'weekly-summary': WEEKLY_SUMMARY_PROMPT,
  'report-monthly': REPORT_MONTHLY_PROMPT,
  'report-weekly': REPORT_WEEKLY_PROMPT,
};

export const getPromptDefinition = <K extends PromptId>(id: K): PromptDefinition<PromptInputMap[K]> => {
  return REGISTRY[id];
};

export const buildPrompt = <K extends PromptId>(id: K, input: PromptInputMap[K]) => {
  const def = getPromptDefinition(id);
  return def.build(input);
};

export type { PromptDefinition, PromptId } from './types';
export type {
  CopyInsightsPromptInput,
  CopyGeneratorPromptInput,
  WeeklySummaryPromptInput,
  MonthlyReportPromptInput,
  WeeklyReportPromptInput,
};
