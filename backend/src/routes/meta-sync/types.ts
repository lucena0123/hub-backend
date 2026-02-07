import type { FastifyBaseLogger } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { MetaAdsService } from '../../services/meta-ads-service';
import type { MetaSyncInput } from '../../validators/meta-sync';
import type { IsoDateRange } from './utils';

export type MetaSyncProgress = {
  setStage: (stage: string, stageTotal: number, message: string) => Promise<void>;
  completeUnit: (currentSince: string | null, currentUntil: string | null, message?: string) => Promise<void>;
};

export type MetaSyncContext = {
  prisma: PrismaClient;
  metaService: MetaAdsService;
  body: MetaSyncInput;
  dateChunks: IsoDateRange[];
  since: string;
  until: string;
  campaignMap: Map<string, string>;
  progress: MetaSyncProgress;
  log: FastifyBaseLogger;
};

