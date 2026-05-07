import {
  applyNamingOverride,
  buildAdNameSuggestion,
  buildAdSetNameSuggestion,
  buildCampaignNameSuggestion,
} from './naming';
import { buildGovernanceIssueKey, classifyGovernanceSuggestionStatus } from './issue-utils';
import type {
  GovernanceNameSuggestion,
  MetaGovernanceEntityType,
  MetaGovernanceIssueStatus,
  MetaGovernanceIssueType,
  MetaGovernanceSummary,
  MetaNamingOverrideRecord,
} from './types';

type GovernanceEntityBase = {
  clientId: string;
  entityType: MetaGovernanceEntityType;
  entityExternalId: string;
  dbId: string;
  currentName: string | null;
  createdTime: string | null;
};

export type GovernanceCampaignRecord = GovernanceEntityBase & {
  entityType: 'campaign';
  objective?: string | null;
};

export type GovernanceAdSetRecord = GovernanceEntityBase & {
  entityType: 'adset';
  campaignDbId: string;
  campaignExternalId: string;
  campaignName: string | null;
  campaignObjective?: string | null;
  sequenceNumber: number;
};

export type GovernanceAdRecord = GovernanceEntityBase & {
  entityType: 'ad';
  campaignDbId: string;
  campaignExternalId: string;
  campaignName: string | null;
  adsetExternalId?: string | null;
};

export type GovernanceRunContext = {
  clientId: string;
  accountId: string;
  syncId: string;
  dryRun: boolean;
  campaigns: GovernanceCampaignRecord[];
  adsets: GovernanceAdSetRecord[];
  ads: GovernanceAdRecord[];
};

export type MetaLiveCampaign = {
  id: string;
  name?: string;
  created_time?: string;
};

export type MetaLiveAdSet = {
  id: string;
  name?: string;
  created_time?: string;
};

export type MetaLiveAd = {
  id: string;
  name?: string;
  created_time?: string;
};

export type MetaGovernanceIssueRecord = {
  syncId: string;
  clientId: string;
  accountId: string;
  entityType: MetaGovernanceEntityType;
  entityExternalId: string;
  campaignDbId: string | null;
  issueType: MetaGovernanceIssueType;
  status: MetaGovernanceIssueStatus;
  currentName: string | null;
  expectedName: string | null;
  currentCreatedTime: string | null;
  expectedCreatedTime: string | null;
  beforePayload: Record<string, unknown> | null;
  afterPayload: Record<string, unknown> | null;
  metaError: string | null;
  dbError: string | null;
  details: Record<string, unknown> | null;
  autoFixed: boolean;
  resolvedAt: string | null;
};

export type MetaGovernanceRepository = {
  loadContext(input: { clientId?: string; accountId?: string; syncId: string; dryRun: boolean }): Promise<GovernanceRunContext>;
  listOverrides(clientId: string): Promise<MetaNamingOverrideRecord[]>;
  upsertIssue(issue: MetaGovernanceIssueRecord): Promise<void>;
  resolveIssuesForEntity(input: { clientId: string; entityType: MetaGovernanceEntityType; entityExternalId: string }): Promise<number>;
  updateCampaignCreatedTime(dbId: string, createdTime: string): Promise<void>;
  updateAdSetCreatedTime(dbId: string, createdTime: string): Promise<void>;
  updateAdCreatedTime(dbId: string, createdTime: string): Promise<void>;
  updateCampaignName(dbId: string, name: string): Promise<void>;
  updateAdSetName(dbId: string, name: string): Promise<void>;
  updateAdName(dbId: string, name: string): Promise<void>;
};

type MetaGovernanceClient = {
  fetchCampaigns(): Promise<MetaLiveCampaign[]>;
  fetchAdSets(options?: { includeLearningInfo?: boolean }): Promise<MetaLiveAdSet[]>;
  fetchAdsByIds(ids: string[]): Promise<MetaLiveAd[]>;
  renameCampaign(campaignId: string, name: string, options?: { dryRun?: boolean }): Promise<{ success: boolean; error?: { message?: string | null } | null }>;
  renameAdSet(adsetId: string, name: string, options?: { dryRun?: boolean }): Promise<{ success: boolean; error?: { message?: string | null } | null }>;
  renameAd(adId: string, name: string, options?: { dryRun?: boolean }): Promise<{ success: boolean; error?: { message?: string | null } | null }>;
};

type VerificationMaps = {
  campaigns: Map<string, MetaLiveCampaign>;
  adsets: Map<string, MetaLiveAdSet>;
  ads: Map<string, MetaLiveAd>;
};

const mapById = <T extends { id: string }>(items: T[]) => new Map(items.map((item) => [item.id, item]));

const toIso = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const extractDateTag = (name: string | null | undefined) => {
  if (!name) return null;
  const match = name.match(/\[(\d{4}-\d{2}-\d{2})\]/);
  return match?.[1] ?? null;
};

const buildIssueType = (params: {
  suggestion: GovernanceNameSuggestion;
  currentCreatedTime: string | null;
  liveCreatedTime: string | null;
}): MetaGovernanceIssueType => {
  if (params.suggestion.overrideApplied) return 'override_applied';
  if (!params.currentCreatedTime && params.liveCreatedTime) return 'missing_created_time';
  if (extractDateTag(params.suggestion.currentName) && extractDateTag(params.suggestion.currentName) !== extractDateTag(params.suggestion.expectedName)) {
    return 'date_mismatch';
  }
  return 'non_canonical_name';
};

const buildFailureIssueType = (params: {
  baseIssueType: MetaGovernanceIssueType;
  metaError: string | null;
  dbError: string | null;
  verificationError: boolean;
}): MetaGovernanceIssueType => {
  if (params.verificationError) return 'verify_mismatch';
  if (params.dbError) return 'db_write_failed';
  if (!params.metaError) return params.baseIssueType;
  if (/scope mismatch/i.test(params.metaError)) return 'scope_mismatch';
  if (/(permission|not authorized|access denied|oauth|not have permission)/i.test(params.metaError)) return 'permission_error';
  return 'meta_write_failed';
};

const buildSummary = (params: {
  audited: number;
  compliant: number;
  createdTimeBackfilled: number;
  dryRun: boolean;
  issues: MetaGovernanceIssueRecord[];
  resolvedDuringRun: number;
}): MetaGovernanceSummary => ({
  audited: params.audited,
  compliant: params.compliant,
  autoFixed: params.issues.filter((issue) => issue.status === 'auto_fixed').length,
  needsReview: params.issues.filter((issue) => issue.status === 'needs_review').length,
  failed: params.issues.filter((issue) => issue.status === 'failed').length,
  resolvedDuringRun: params.resolvedDuringRun,
  createdTimeBackfilled: params.createdTimeBackfilled,
  dryRun: params.dryRun,
});

export class MetaGovernanceService {
  constructor(
    private repository: MetaGovernanceRepository,
    private metaClient: MetaGovernanceClient,
  ) {}

  async runForClient(input: {
    clientId?: string;
    accountId?: string;
    syncId: string;
    dryRun: boolean;
  }): Promise<{ summary: MetaGovernanceSummary; issues: MetaGovernanceIssueRecord[] }> {
    const context = await this.repository.loadContext(input);
    const overrides = await this.repository.listOverrides(context.clientId);

    const liveCampaigns = mapById(await this.metaClient.fetchCampaigns());
    const liveAdSets = mapById(await this.metaClient.fetchAdSets({ includeLearningInfo: false }));
    const adIds = context.ads.map((item) => item.entityExternalId).filter(Boolean);
    const liveAds = mapById(adIds.length > 0 ? await this.metaClient.fetchAdsByIds(adIds) : []);

    const issues: MetaGovernanceIssueRecord[] = [];
    let compliant = 0;
    let createdTimeBackfilled = 0;
    let resolvedDuringRun = 0;

    const verificationMaps: VerificationMaps = {
      campaigns: liveCampaigns,
      adsets: liveAdSets,
      ads: liveAds,
    };

    for (const campaign of context.campaigns) {
      const result = await this.processCampaign(campaign, context, overrides, verificationMaps);
      issues.push(...result.issues);
      compliant += result.compliant ? 1 : 0;
      createdTimeBackfilled += result.createdTimeBackfilled;
      resolvedDuringRun += result.resolvedDuringRun;
    }

    for (const adset of context.adsets) {
      const result = await this.processAdSet(adset, context, overrides, verificationMaps);
      issues.push(...result.issues);
      compliant += result.compliant ? 1 : 0;
      createdTimeBackfilled += result.createdTimeBackfilled;
      resolvedDuringRun += result.resolvedDuringRun;
    }

    for (const ad of context.ads) {
      const result = await this.processAd(ad, context, overrides, verificationMaps);
      issues.push(...result.issues);
      compliant += result.compliant ? 1 : 0;
      createdTimeBackfilled += result.createdTimeBackfilled;
      resolvedDuringRun += result.resolvedDuringRun;
    }

    return {
      summary: buildSummary({
        audited: context.campaigns.length + context.adsets.length + context.ads.length,
        compliant,
        createdTimeBackfilled,
        dryRun: context.dryRun,
        issues,
        resolvedDuringRun,
      }),
      issues,
    };
  }

  private async processCampaign(
    record: GovernanceCampaignRecord,
    context: GovernanceRunContext,
    overrides: MetaNamingOverrideRecord[],
    verificationMaps: VerificationMaps,
  ) {
    const liveCreatedTime = toIso(verificationMaps.campaigns.get(record.entityExternalId)?.created_time) ?? null;
    const suggestion = applyNamingOverride(
      buildCampaignNameSuggestion({
        entityExternalId: record.entityExternalId,
        currentName: record.currentName,
        objective: record.objective,
        createdTime: record.createdTime ?? liveCreatedTime,
      }),
      overrides,
    );

    return this.processEntity({
      record,
      context,
      suggestion,
      liveName: verificationMaps.campaigns.get(record.entityExternalId)?.name ?? null,
      liveCreatedTime,
      updateCreatedTime: (createdTime) => this.repository.updateCampaignCreatedTime(record.dbId, createdTime),
      updateName: (name) => this.repository.updateCampaignName(record.dbId, name),
      renameMeta: (name) => this.metaClient.renameCampaign(record.entityExternalId, name, { dryRun: context.dryRun }),
      verifyName: async () => {
        const refreshed = mapById(await this.metaClient.fetchCampaigns());
        return refreshed.get(record.entityExternalId)?.name ?? null;
      },
    });
  }

  private async processAdSet(
    record: GovernanceAdSetRecord,
    context: GovernanceRunContext,
    overrides: MetaNamingOverrideRecord[],
    verificationMaps: VerificationMaps,
  ) {
    const liveCreatedTime = toIso(verificationMaps.adsets.get(record.entityExternalId)?.created_time) ?? null;
    const suggestion = applyNamingOverride(
      buildAdSetNameSuggestion({
        entityExternalId: record.entityExternalId,
        currentName: record.currentName,
        campaignName: record.campaignName,
        campaignObjective: record.campaignObjective,
        createdTime: record.createdTime ?? liveCreatedTime,
        sequenceNumber: record.sequenceNumber,
      }),
      overrides,
    );

    return this.processEntity({
      record,
      context,
      suggestion,
      liveName: verificationMaps.adsets.get(record.entityExternalId)?.name ?? null,
      liveCreatedTime,
      updateCreatedTime: (createdTime) => this.repository.updateAdSetCreatedTime(record.dbId, createdTime),
      updateName: (name) => this.repository.updateAdSetName(record.dbId, name),
      renameMeta: (name) => this.metaClient.renameAdSet(record.entityExternalId, name, { dryRun: context.dryRun }),
      verifyName: async () => {
        const refreshed = mapById(await this.metaClient.fetchAdSets({ includeLearningInfo: false }));
        return refreshed.get(record.entityExternalId)?.name ?? null;
      },
    });
  }

  private async processAd(
    record: GovernanceAdRecord,
    context: GovernanceRunContext,
    overrides: MetaNamingOverrideRecord[],
    verificationMaps: VerificationMaps,
  ) {
    const liveCreatedTime = toIso(verificationMaps.ads.get(record.entityExternalId)?.created_time) ?? null;
    const suggestion = applyNamingOverride(
      buildAdNameSuggestion({
        entityExternalId: record.entityExternalId,
        currentName: record.currentName,
        campaignName: record.campaignName,
        createdTime: record.createdTime ?? liveCreatedTime,
      }),
      overrides,
    );

    return this.processEntity({
      record,
      context,
      suggestion,
      liveName: verificationMaps.ads.get(record.entityExternalId)?.name ?? null,
      liveCreatedTime,
      updateCreatedTime: (createdTime) => this.repository.updateAdCreatedTime(record.dbId, createdTime),
      updateName: (name) => this.repository.updateAdName(record.dbId, name),
      renameMeta: (name) => this.metaClient.renameAd(record.entityExternalId, name, { dryRun: context.dryRun }),
      verifyName: async () => {
        const refreshed = mapById(await this.metaClient.fetchAdsByIds([record.entityExternalId]));
        return refreshed.get(record.entityExternalId)?.name ?? null;
      },
    });
  }

  private async processEntity(params: {
    record: GovernanceEntityBase;
    context: GovernanceRunContext;
    suggestion: GovernanceNameSuggestion;
    liveName: string | null;
    liveCreatedTime: string | null;
    updateCreatedTime(createdTime: string): Promise<void>;
    updateName(name: string): Promise<void>;
    renameMeta(name: string): Promise<{ success: boolean; error?: { message?: string | null } | null }>;
    verifyName(): Promise<string | null>;
  }): Promise<{ issues: MetaGovernanceIssueRecord[]; compliant: boolean; createdTimeBackfilled: number; resolvedDuringRun: number }> {
    const { record, context, suggestion } = params;

    const issues: MetaGovernanceIssueRecord[] = [];
    const createdTimeChanged = !record.createdTime && params.liveCreatedTime;
    const nameMismatch = record.currentName !== suggestion.expectedName;

    if (!nameMismatch && !createdTimeChanged) {
      const resolved = await this.repository.resolveIssuesForEntity({
        clientId: record.clientId,
        entityType: record.entityType,
        entityExternalId: record.entityExternalId,
      });
      return { issues, compliant: true, createdTimeBackfilled: 0, resolvedDuringRun: resolved };
    }

    const baseIssueType = buildIssueType({
      suggestion,
      currentCreatedTime: record.createdTime,
      liveCreatedTime: params.liveCreatedTime,
    });

    let metaError: string | null = null;
    let dbError: string | null = null;
    let verificationError = false;
    let createdTimeBackfilled = false;

    if (createdTimeChanged && !context.dryRun && params.liveCreatedTime) {
      try {
        await params.updateCreatedTime(params.liveCreatedTime);
        createdTimeBackfilled = true;
      } catch (error) {
        dbError = error instanceof Error ? error.message : 'DB update failed';
      }
    }

    if (!dbError && nameMismatch && !context.dryRun && suggestion.safeToApply) {
      const renameResult = await params.renameMeta(suggestion.expectedName);
      if (!renameResult.success) {
        metaError = renameResult.error?.message ?? 'Meta rename failed';
      } else {
        try {
          await params.updateName(suggestion.expectedName);
        } catch (error) {
          dbError = error instanceof Error ? error.message : 'DB update failed';
        }
      }
    }

    if (!metaError && !dbError && nameMismatch && !context.dryRun && suggestion.safeToApply) {
      const verifiedName = await params.verifyName();
      if (verifiedName !== suggestion.expectedName) {
        verificationError = true;
      }
    }

    const status = classifyGovernanceSuggestionStatus({
      dryRun: context.dryRun,
      safeToApply: suggestion.safeToApply,
      hasWriteError: Boolean(metaError || dbError),
      hasVerificationError: verificationError,
    });

    const finalIssueType = buildFailureIssueType({
      baseIssueType,
      metaError,
      dbError,
      verificationError,
    });

    const issue: MetaGovernanceIssueRecord = {
      syncId: context.syncId,
      clientId: record.clientId,
      accountId: context.accountId,
      entityType: record.entityType,
      entityExternalId: record.entityExternalId,
      campaignDbId:
        record.entityType === 'campaign'
          ? record.dbId
          : ((record as GovernanceAdSetRecord | GovernanceAdRecord).campaignDbId ?? null),
      issueType: finalIssueType,
      status,
      currentName: record.currentName,
      expectedName: suggestion.expectedName,
      currentCreatedTime: record.createdTime,
      expectedCreatedTime: params.liveCreatedTime,
      beforePayload: {
        issueKey: buildGovernanceIssueKey({
          clientId: record.clientId,
          entityType: record.entityType,
          entityExternalId: record.entityExternalId,
          issueType: finalIssueType,
          expectedName: suggestion.expectedName,
        }),
      },
      afterPayload: { overrideId: suggestion.overrideId ?? null },
      metaError,
      dbError,
      details: {
        safeToApply: suggestion.safeToApply,
        overrideApplied: suggestion.overrideApplied,
        liveName: params.liveName,
        liveCreatedTime: params.liveCreatedTime,
        createdTimeBackfilled,
      },
      autoFixed: status === 'auto_fixed',
      resolvedAt: status === 'auto_fixed' || status === 'resolved' ? new Date().toISOString() : null,
    };

    await this.repository.upsertIssue(issue);

    let resolvedDuringRun = 0;
    if (status === 'auto_fixed' || status === 'resolved') {
      resolvedDuringRun = await this.repository.resolveIssuesForEntity({
        clientId: record.clientId,
        entityType: record.entityType,
        entityExternalId: record.entityExternalId,
      });
    }

    issues.push(issue);

    return {
      issues,
      compliant: false,
      createdTimeBackfilled: createdTimeBackfilled ? 1 : 0,
      resolvedDuringRun,
    };
  }
}


