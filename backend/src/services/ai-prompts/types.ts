export type PromptId =
  | 'copy-insights'
  | 'copy-generator'
  | 'weekly-summary'
  | 'report-monthly'
  | 'report-weekly';

export type PromptDefinition<TInput> = {
  id: PromptId;
  version: string;
  schemaVersion: string;
  owner: string;
  lastUpdated: string; // ISO date
  description: string;
  build: (input: TInput) => string;
};
