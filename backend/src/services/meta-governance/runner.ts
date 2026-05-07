import type { Pool } from 'pg';

import { MetaAdsService } from '../meta-ads-service';
import { MetaGovernanceService } from './service';
import { MetaGovernanceStore } from './store';

export const runMetaGovernanceStage = async (params: {
  pool: Pool;
  metaService: MetaAdsService;
  clientId?: string;
  accountId?: string;
  syncId: string;
  dryRun: boolean;
}) => {
  const repository = new MetaGovernanceStore(params.pool);
  const service = new MetaGovernanceService(repository, params.metaService);

  return service.runForClient({
    clientId: params.clientId,
    accountId: params.accountId,
    syncId: params.syncId,
    dryRun: params.dryRun,
  });
};
