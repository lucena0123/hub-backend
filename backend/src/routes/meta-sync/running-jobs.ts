export type RunningMetaSyncJob = {
  syncId: string;
  accountId: string;
  startedAt: number;
  promise: Promise<void>;
};

export const runningMetaSyncJobsByAccount = new Map<string, RunningMetaSyncJob>();

