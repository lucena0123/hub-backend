import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MetaGovernanceService } from './service';
import type {
  GovernanceRunContext,
  MetaGovernanceRepository,
  MetaLiveAd,
  MetaLiveAdSet,
  MetaLiveCampaign,
} from './service';

const buildRepository = (): MetaGovernanceRepository => ({
  loadContext: vi.fn(),
  listOverrides: vi.fn().mockResolvedValue([]),
  upsertIssue: vi.fn(),
  resolveIssuesForEntity: vi.fn().mockResolvedValue(0),
  updateCampaignCreatedTime: vi.fn(),
  updateAdSetCreatedTime: vi.fn(),
  updateAdCreatedTime: vi.fn(),
  updateCampaignName: vi.fn(),
  updateAdSetName: vi.fn(),
  updateAdName: vi.fn(),
});

const buildContext = (overrides?: Partial<GovernanceRunContext>): GovernanceRunContext => ({
  clientId: 'client-1',
  accountId: 'act_123',
  syncId: 'sync-1',
  dryRun: true,
  campaigns: [],
  adsets: [],
  ads: [],
  ...overrides,
});

describe('MetaGovernanceService', () => {
  let repository: MetaGovernanceRepository;
  let metaClient: {
    fetchCampaigns: ReturnType<typeof vi.fn<() => Promise<MetaLiveCampaign[]>>>;
    fetchAdSets: ReturnType<typeof vi.fn<() => Promise<MetaLiveAdSet[]>>>;
    fetchAdsByIds: ReturnType<typeof vi.fn<(ids: string[]) => Promise<MetaLiveAd[]>>>;
    renameCampaign: ReturnType<typeof vi.fn>;
    renameAdSet: ReturnType<typeof vi.fn>;
    renameAd: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = buildRepository();
    metaClient = {
      fetchCampaigns: vi.fn().mockResolvedValue([]),
      fetchAdSets: vi.fn().mockResolvedValue([]),
      fetchAdsByIds: vi.fn().mockResolvedValue([]),
      renameCampaign: vi.fn().mockResolvedValue({ success: true }),
      renameAdSet: vi.fn().mockResolvedValue({ success: true }),
      renameAd: vi.fn().mockResolvedValue({ success: true }),
    };
  });

  it('creates an open issue on dry-run without renaming Meta', async () => {
    vi.mocked(repository.loadContext).mockResolvedValue(
      buildContext({
        campaigns: [
          {
            clientId: 'client-1',
            entityType: 'campaign',
            entityExternalId: '120240932229130563',
            dbId: 'campaign-db-1',
            currentName: '[TRABALHISTA] Rescisão Indireta | Público: Geral | Obj: Mensagens',
            objective: 'OUTCOME_ENGAGEMENT',
            createdTime: '2026-02-02T00:00:00.000Z',
          },
        ],
      }),
    );

    const service = new MetaGovernanceService(repository, metaClient as any);
    const result = await service.runForClient({ clientId: 'client-1', accountId: '123', syncId: 'sync-1', dryRun: true });

    expect(result.summary.autoFixed).toBe(0);
    expect(result.summary.needsReview).toBe(0);
    expect(result.summary.failed).toBe(0);
    expect(result.summary.audited).toBe(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].status).toBe('open');
    expect(metaClient.renameCampaign).not.toHaveBeenCalled();
  });

  it('renames safe campaign mismatches, updates the db and verifies the final name', async () => {
    vi.mocked(repository.loadContext).mockResolvedValue(
      buildContext({
        dryRun: false,
        campaigns: [
          {
            clientId: 'client-1',
            entityType: 'campaign',
            entityExternalId: '120240932661560563',
            dbId: 'campaign-db-1',
            currentName: '[PREVIDENCIÁRIO] Maternidade | Público: CE/RJ | Obj: Mensagens',
            objective: 'OUTCOME_ENGAGEMENT',
            createdTime: null,
          },
        ],
      }),
    );

    vi.mocked(metaClient.fetchCampaigns).mockResolvedValue([
      {
        id: '120240932661560563',
        name: '[OBJ=LEAD] [PROD=Maternidade] [FUNIL=MOFU] [PREVIDENCIARIO] [CONT] [BUDGET=UNK] [REG=BR-CE+RJ] [LANG=PT] [2026-02-02] |CAM',
        created_time: '2026-02-02T00:00:00.000Z',
      },
    ]);

    const service = new MetaGovernanceService(repository, metaClient as any);
    const result = await service.runForClient({ clientId: 'client-1', accountId: '123', syncId: 'sync-1', dryRun: false });

    expect(metaClient.renameCampaign).toHaveBeenCalledTimes(1);
    expect(repository.updateCampaignCreatedTime).toHaveBeenCalledWith('campaign-db-1', '2026-02-02T00:00:00.000Z');
    expect(repository.updateCampaignName).toHaveBeenCalledWith(
      'campaign-db-1',
      '[OBJ=LEAD] [PROD=Maternidade] [FUNIL=MOFU] [PREVIDENCIARIO] [CONT] [BUDGET=UNK] [REG=BR-CE+RJ] [LANG=PT] [2026-02-02] |CAM',
    );
    expect(result.summary.autoFixed).toBe(1);
    expect(result.issues[0].status).toBe('auto_fixed');
  });
});


