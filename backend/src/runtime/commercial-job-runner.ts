import type { FastifyBaseLogger } from 'fastify';
import type { CommercialLeadsService } from '../services/commercial-leads-service';

type CommercialJobRunnerInput = {
  enabled: boolean;
  commercialLeads: CommercialLeadsService | null;
  logger: FastifyBaseLogger;
};

type CommercialJobRunner = {
  jobCount: number;
  stop: () => void;
};

export function startCommercialJobRunner(input: CommercialJobRunnerInput): CommercialJobRunner {
  if (!input.enabled) {
    if (
      process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED === 'true' ||
      process.env.COMMERCIAL_GOOGLE_BOOKING_SYNC_ENABLED === 'true'
    ) {
      input.logger.warn(
        '[commercial-jobs] feature flags are enabled but COMMERCIAL_RUNTIME_JOBS_ENABLED=false; no replica will run the commercial timers',
      );
    }
    return { jobCount: 0, stop: () => {} };
  }

  if (!input.commercialLeads) {
    input.logger.warn('[commercial-jobs] runner enabled but CommercialLeadsService is unavailable');
    return { jobCount: 0, stop: () => {} };
  }

  const timers: NodeJS.Timeout[] = [];

  if (process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED === 'true') {
    timers.push(
      setInterval(() => {
        void input.commercialLeads!.dispatchMeetingReminders().catch((err) => {
          input.logger.warn({ err }, '[commercial-jobs] reminder dispatch failed');
        });
      }, 15 * 60 * 1000),
    );
  }

  if (process.env.COMMERCIAL_GOOGLE_BOOKING_SYNC_ENABLED === 'true') {
    timers.push(
      setInterval(() => {
        void input.commercialLeads!.syncGoogleBookingEvents().catch((err) => {
          input.logger.warn({ err }, '[commercial-jobs] google booking sync failed');
        });
      }, 5 * 60 * 1000),
    );
  }

  if (timers.length === 0) {
    input.logger.info('[commercial-jobs] runner enabled but no commercial timers are active');
  } else {
    input.logger.info({ timers: timers.length }, '[commercial-jobs] runner started');
  }

  return {
    jobCount: timers.length,
    stop: () => {
      for (const timer of timers) clearInterval(timer);
    },
  };
}
