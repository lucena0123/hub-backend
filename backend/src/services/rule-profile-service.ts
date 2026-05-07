import { Prisma, PrismaClient } from '@prisma/client';

export const OBJECTIVE_CLASS_KEYS = ['messages', 'lead', 'conversion', 'traffic', 'awareness'] as const;
export const CHANNEL_CLASS_KEYS = [
  'meta',
  'google',
  'tiktok',
  'linkedin',
  'whatsapp',
  'messenger',
  'instagram',
  'facebook',
  'other',
] as const;

export type ObjectiveClassKey = (typeof OBJECTIVE_CLASS_KEYS)[number];
export type ChannelClassKey = (typeof CHANNEL_CLASS_KEYS)[number];
export type ClassificationSource = 'manual' | 'inferred' | 'backfill';

export type ResolvedProfile = {
  source: 'campaign' | 'client_override' | 'template' | 'fallback' | 'none';
  profile: {
    id: string;
    name: string;
    nicheKey: string;
    objectiveKey: string;
    channelKey: string;
    version: number;
    isActive: boolean;
    targets: Record<string, unknown> | null;
    copyPolicy: Record<string, unknown> | null;
  } | null;
  classification: {
    objectiveKey: string | null;
    channelKey: string | null;
    nicheKey: string | null;
    source: ClassificationSource;
    confidence: number | null;
  };
  warnings: string[];
};

export const isRuleProfileEngineEnabled = () => process.env.RULE_PROFILE_ENGINE_ENABLED !== 'false';
export const isRuleProfileBlockingEnabled = () => process.env.RULE_PROFILE_BLOCK_ON_MISSING_CLASSIFICATION !== 'false';

const asJsonRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const mergeJson = (
  base: Prisma.JsonValue | null | undefined,
  override: Prisma.JsonValue | null | undefined
): Record<string, unknown> | null => {
  const baseRecord = asJsonRecord(base);
  const overrideRecord = asJsonRecord(override);
  if (!baseRecord && !overrideRecord) return null;
  return {
    ...(baseRecord ?? {}),
    ...(overrideRecord ?? {}),
  };
};

const toPrismaJson = (
  value: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
};

const normalizeToken = (value?: string | null) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const normalizeObjectiveClassKey = (value?: string | null): ObjectiveClassKey | null => {
  const normalized = normalizeToken(value);
  if (!normalized) return null;

  if (['messages', 'message', 'messaging', 'whatsapp'].includes(normalized)) return 'messages';
  if (['lead', 'leads', 'lead_gen', 'lead-generation', 'leadgeneration'].includes(normalized)) return 'lead';
  if (['conversion', 'conversions', 'sales', 'purchase', 'purchases'].includes(normalized)) return 'conversion';
  if (['traffic', 'clicks', 'link_clicks', 'lpv', 'landing_page_views'].includes(normalized)) return 'traffic';
  if (['awareness', 'reach', 'brand_awareness'].includes(normalized)) return 'awareness';

  return null;
};

export const normalizeChannelClassKey = (value?: string | null): ChannelClassKey | null => {
  const normalized = normalizeToken(value);
  if (!normalized) return null;

  if (
    [
      'meta',
      'google',
      'tiktok',
      'linkedin',
      'whatsapp',
      'messenger',
      'instagram',
      'facebook',
      'other',
    ].includes(normalized)
  ) {
    return normalized as ChannelClassKey;
  }

  return null;
};

export const deriveChannelClassFromPlatform = (platform?: string | null): ChannelClassKey | null => {
  const normalized = normalizeToken(platform);
  if (!normalized) return null;

  if (normalized === 'meta') return 'meta';
  if (normalized === 'google') return 'google';
  if (normalized === 'tiktok') return 'tiktok';
  if (normalized === 'linkedin') return 'linkedin';
  if (normalized === 'whatsapp') return 'whatsapp';

  return 'other';
};

export const inferObjectiveClassFromRawObjective = (objective?: string | null): ObjectiveClassKey | null => {
  const normalized = normalizeToken(objective).replace(/^outcome_/, '').replace(/^objective_/, '');
  if (!normalized) return null;

  if (normalized.includes('message') || normalized.includes('messaging')) return 'messages';
  if (normalized.includes('lead')) return 'lead';
  if (
    normalized.includes('sales') ||
    normalized.includes('conversion') ||
    normalized.includes('purchase') ||
    normalized.includes('offsite')
  ) {
    return 'conversion';
  }
  if (normalized.includes('traffic') || normalized.includes('click')) return 'traffic';
  if (normalized.includes('awareness') || normalized.includes('reach') || normalized.includes('brand')) return 'awareness';

  return null;
};

const hasMinimumCampaignClassification = (objectiveKey?: string | null, channelKey?: string | null) => {
  return Boolean(objectiveKey && channelKey);
};

export class RuleProfileService {
  constructor(private prisma: PrismaClient) {}

  async listRuleProfiles(filters: { nicheKey?: string; objectiveKey?: string; channelKey?: string; isActive?: boolean }) {
    return this.prisma.ruleProfile.findMany({
      where: {
        nicheKey: filters.nicheKey,
        objectiveKey: filters.objectiveKey,
        channelKey: filters.channelKey,
        isActive: filters.isActive,
      },
      orderBy: [{ isActive: 'desc' }, { nicheKey: 'asc' }, { objectiveKey: 'asc' }, { channelKey: 'asc' }, { version: 'desc' }],
    });
  }

  async createRuleProfile(payload: {
    name: string;
    nicheKey: string;
    objectiveKey: string;
    channelKey: string;
    isActive?: boolean;
    targets?: Prisma.JsonValue | null;
    copyPolicy?: Prisma.JsonValue | null;
    version?: number;
  }) {
    const objectiveKey = normalizeObjectiveClassKey(payload.objectiveKey);
    const channelKey = normalizeChannelClassKey(payload.channelKey);

    if (!objectiveKey) throw new Error('Invalid objectiveKey');
    if (!channelKey) throw new Error('Invalid channelKey');

    return this.prisma.ruleProfile.create({
      data: {
        name: payload.name,
        nicheKey: payload.nicheKey.trim().toLowerCase(),
        objectiveKey,
        channelKey,
        isActive: payload.isActive ?? true,
        targets: toPrismaJson(payload.targets),
        copyPolicy: toPrismaJson(payload.copyPolicy),
        version: payload.version ?? 1,
      },
    });
  }

  async updateRuleProfile(
    id: string,
    payload: {
      name?: string;
      nicheKey?: string;
      objectiveKey?: string;
      channelKey?: string;
      isActive?: boolean;
      targets?: Prisma.JsonValue | null;
      copyPolicy?: Prisma.JsonValue | null;
      version?: number;
    }
  ) {
    const data: Prisma.RuleProfileUpdateInput = {};

    if (payload.name !== undefined) data.name = payload.name;
    if (payload.nicheKey !== undefined) data.nicheKey = payload.nicheKey.trim().toLowerCase();

    if (payload.objectiveKey !== undefined) {
      const objectiveKey = normalizeObjectiveClassKey(payload.objectiveKey);
      if (!objectiveKey) throw new Error('Invalid objectiveKey');
      data.objectiveKey = objectiveKey;
    }

    if (payload.channelKey !== undefined) {
      const channelKey = normalizeChannelClassKey(payload.channelKey);
      if (!channelKey) throw new Error('Invalid channelKey');
      data.channelKey = channelKey;
    }

    if (payload.isActive !== undefined) data.isActive = payload.isActive;
    if (payload.targets !== undefined) data.targets = toPrismaJson(payload.targets);
    if (payload.copyPolicy !== undefined) data.copyPolicy = toPrismaJson(payload.copyPolicy);
    if (payload.version !== undefined) data.version = payload.version;

    return this.prisma.ruleProfile.update({ where: { id }, data });
  }

  async getClientRuleBindings(clientId: string) {
    const bindings = await this.prisma.clientRuleProfileBinding.findMany({
      where: { clientId },
      include: {
        ruleProfile: true,
      },
      orderBy: [{ isDefault: 'desc' }, { priority: 'asc' }, { createdAt: 'asc' }],
    });

    return bindings.map((binding) => ({
      id: binding.id,
      clientId: binding.clientId,
      ruleProfileId: binding.ruleProfileId,
      isDefault: binding.isDefault,
      priority: binding.priority,
      overrideTargets: asJsonRecord(binding.overrideTargets),
      overrideCopyPolicy: asJsonRecord(binding.overrideCopyPolicy),
      ruleProfile: binding.ruleProfile,
      createdAt: binding.createdAt,
      updatedAt: binding.updatedAt,
    }));
  }

  async putClientRuleBindings(
    clientId: string,
    input: {
      bindings: Array<{
        ruleProfileId: string;
        isDefault?: boolean;
        priority?: number;
        overrideTargets?: Prisma.JsonValue | null;
        overrideCopyPolicy?: Prisma.JsonValue | null;
      }>;
    }
  ) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!client) throw new Error('Client not found');

    if (!input.bindings.length) {
      await this.prisma.clientRuleProfileBinding.deleteMany({ where: { clientId } });
      return [];
    }

    const profileIds = [...new Set(input.bindings.map((binding) => binding.ruleProfileId))];
    const existingProfiles = await this.prisma.ruleProfile.findMany({
      where: { id: { in: profileIds } },
      select: { id: true },
    });

    const existingProfileIds = new Set(existingProfiles.map((profile) => profile.id));
    const missing = profileIds.filter((id) => !existingProfileIds.has(id));
    if (missing.length > 0) {
      throw new Error(`Rule profiles not found: ${missing.join(', ')}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.clientRuleProfileBinding.deleteMany({ where: { clientId } });

      for (const binding of input.bindings) {
        await tx.clientRuleProfileBinding.create({
          data: {
            clientId,
            ruleProfileId: binding.ruleProfileId,
            isDefault: binding.isDefault ?? false,
            priority: binding.priority ?? 100,
            overrideTargets: toPrismaJson(binding.overrideTargets),
            overrideCopyPolicy: toPrismaJson(binding.overrideCopyPolicy),
          },
        });
      }
    });

    return this.getClientRuleBindings(clientId);
  }

  async getCampaignRuleContext(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        client: {
          select: {
            id: true,
            businessNicheKey: true,
            defaultChannelKey: true,
          },
        },
        campaignRuleContext: true,
      },
    });

    if (!campaign) throw new Error('Campaign not found');

    const resolved = await this.resolveCampaignProfile(campaignId);

    return {
      campaignId: campaign.id,
      objectiveClassKey:
        campaign.campaignRuleContext?.objectiveKey ??
        campaign.objectiveClassKey ??
        inferObjectiveClassFromRawObjective(campaign.objective),
      channelClassKey:
        campaign.campaignRuleContext?.channelKey ??
        campaign.channelClassKey ??
        deriveChannelClassFromPlatform(campaign.platform) ??
        normalizeChannelClassKey(campaign.client.defaultChannelKey),
      ruleProfileId: campaign.campaignRuleContext?.ruleProfileId ?? campaign.ruleProfileId ?? resolved.profile?.id ?? null,
      classificationSource: (campaign.campaignRuleContext?.classificationSource as ClassificationSource | undefined) ??
        'manual',
      classificationConfidence: campaign.campaignRuleContext?.classificationConfidence ?? null,
      needsReview: campaign.campaignRuleContext?.needsReview ?? false,
      resolvedProfile: resolved,
    };
  }

  async putCampaignRuleContext(
    campaignId: string,
    input: {
      objectiveClassKey?: string | null;
      channelClassKey?: string | null;
      ruleProfileId?: string | null;
      classificationSource?: ClassificationSource;
      classificationConfidence?: number | null;
      needsReview?: boolean;
    }
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        client: {
          select: {
            businessNicheKey: true,
            defaultChannelKey: true,
          },
        },
      },
    });

    if (!campaign) throw new Error('Campaign not found');

    const objectiveClassKey =
      input.objectiveClassKey !== undefined
        ? normalizeObjectiveClassKey(input.objectiveClassKey)
        : normalizeObjectiveClassKey(campaign.objectiveClassKey) ??
          inferObjectiveClassFromRawObjective(campaign.objective);

    const channelClassKey =
      input.channelClassKey !== undefined
        ? normalizeChannelClassKey(input.channelClassKey)
        : normalizeChannelClassKey(campaign.channelClassKey) ??
          deriveChannelClassFromPlatform(campaign.platform) ??
          normalizeChannelClassKey(campaign.client.defaultChannelKey);

    if (input.objectiveClassKey !== undefined && !objectiveClassKey) {
      throw new Error('Invalid objectiveClassKey');
    }

    if (input.channelClassKey !== undefined && !channelClassKey) {
      throw new Error('Invalid channelClassKey');
    }

    if (input.ruleProfileId) {
      const profile = await this.prisma.ruleProfile.findUnique({ where: { id: input.ruleProfileId }, select: { id: true } });
      if (!profile) throw new Error('Rule profile not found');
    }

    const campaignUpdateData: Prisma.CampaignUncheckedUpdateInput = {
      objectiveClassKey: objectiveClassKey ?? null,
      channelClassKey: channelClassKey ?? null,
      ruleProfileId: input.ruleProfileId ?? campaign.ruleProfileId ?? null,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id: campaignId },
        data: campaignUpdateData,
      });

      await tx.campaignRuleContext.upsert({
        where: { campaignId },
        update: {
          objectiveKey: objectiveClassKey ?? null,
          channelKey: channelClassKey ?? null,
          ruleProfileId: input.ruleProfileId ?? campaign.ruleProfileId ?? null,
          classificationSource: input.classificationSource ?? 'manual',
          classificationConfidence: input.classificationConfidence ?? 100,
          needsReview: input.needsReview ?? false,
        },
        create: {
          campaignId,
          objectiveKey: objectiveClassKey ?? null,
          channelKey: channelClassKey ?? null,
          ruleProfileId: input.ruleProfileId ?? campaign.ruleProfileId ?? null,
          classificationSource: input.classificationSource ?? 'manual',
          classificationConfidence: input.classificationConfidence ?? 100,
          needsReview: input.needsReview ?? false,
        },
      });
    });

    const resolved = await this.resolveCampaignProfile(campaignId);

    // Fill explicit campaign.ruleProfileId if context does not provide one and resolution succeeded.
    if (!input.ruleProfileId && resolved.profile?.id) {
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { ruleProfileId: resolved.profile.id },
      });

      await this.prisma.campaignRuleContext.update({
        where: { campaignId },
        data: {
          ruleProfileId: resolved.profile.id,
        },
      });
    }

    return this.getCampaignRuleContext(campaignId);
  }

  async resolveCampaignProfile(campaignId: string): Promise<ResolvedProfile> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        client: {
          include: {
            client_rule_profile_bindings: {
              include: {
                ruleProfile: true,
              },
              orderBy: [{ isDefault: 'desc' }, { priority: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
        campaignRuleContext: true,
        ruleProfile: true,
      },
    });

    if (!campaign) throw new Error('Campaign not found');

    const warnings: string[] = [];

    const objectiveKey =
      normalizeObjectiveClassKey(campaign.campaignRuleContext?.objectiveKey) ??
      normalizeObjectiveClassKey(campaign.objectiveClassKey) ??
      inferObjectiveClassFromRawObjective(campaign.objective);

    const channelKey =
      normalizeChannelClassKey(campaign.campaignRuleContext?.channelKey) ??
      normalizeChannelClassKey(campaign.channelClassKey) ??
      deriveChannelClassFromPlatform(campaign.platform) ??
      normalizeChannelClassKey(campaign.client.defaultChannelKey);

    const nicheKey = campaign.client.businessNicheKey ? campaign.client.businessNicheKey.trim().toLowerCase() : null;

    if (!objectiveKey) warnings.push('missing_objective_classification');
    if (!channelKey) warnings.push('missing_channel_classification');
    if (!nicheKey) warnings.push('missing_client_niche');

    const classificationSource =
      (campaign.campaignRuleContext?.classificationSource as ClassificationSource | undefined) ?? 'manual';
    const classificationConfidence = campaign.campaignRuleContext?.classificationConfidence ?? null;

    const toProfile = (
      profile: {
        id: string;
        name: string;
        nicheKey: string;
        objectiveKey: string;
        channelKey: string;
        version: number;
        isActive: boolean;
        targets: Prisma.JsonValue | null;
        copyPolicy: Prisma.JsonValue | null;
      },
      source: ResolvedProfile['source'],
      overrides?: {
        targets?: Prisma.JsonValue | null;
        copyPolicy?: Prisma.JsonValue | null;
      }
    ): ResolvedProfile => ({
      source,
      profile: {
        id: profile.id,
        name: profile.name,
        nicheKey: profile.nicheKey,
        objectiveKey: profile.objectiveKey,
        channelKey: profile.channelKey,
        version: profile.version,
        isActive: profile.isActive,
        targets: mergeJson(profile.targets, overrides?.targets),
        copyPolicy: mergeJson(profile.copyPolicy, overrides?.copyPolicy),
      },
      classification: {
        objectiveKey,
        channelKey,
        nicheKey,
        source: classificationSource,
        confidence: classificationConfidence,
      },
      warnings,
    });

    if (campaign.ruleProfile && campaign.ruleProfile.isActive) {
      return toProfile(campaign.ruleProfile, 'campaign');
    }

    if (campaign.campaignRuleContext?.ruleProfileId) {
      const profile = await this.prisma.ruleProfile.findUnique({ where: { id: campaign.campaignRuleContext.ruleProfileId } });
      if (profile && profile.isActive) {
        return toProfile(profile, 'campaign');
      }
      warnings.push('campaign_profile_not_found_or_inactive');
    }

    if (objectiveKey && channelKey) {
      const matchingBinding = campaign.client.client_rule_profile_bindings.find((binding) => {
        const profile = binding.ruleProfile;
        if (!profile || !profile.isActive) return false;
        return profile.objectiveKey === objectiveKey && profile.channelKey === channelKey;
      });

      if (matchingBinding?.ruleProfile) {
        return toProfile(matchingBinding.ruleProfile, 'client_override', {
          targets: matchingBinding.overrideTargets,
          copyPolicy: matchingBinding.overrideCopyPolicy,
        });
      }

      if (nicheKey) {
        const template = await this.prisma.ruleProfile.findFirst({
          where: {
            isActive: true,
            nicheKey,
            objectiveKey,
            channelKey,
          },
          orderBy: [{ version: 'desc' }, { updatedAt: 'desc' }],
        });

        if (template) {
          return toProfile(template, 'template');
        }
      }

      const fallback = await this.prisma.ruleProfile.findFirst({
        where: {
          isActive: true,
          nicheKey: 'global',
          objectiveKey,
          channelKey,
        },
        orderBy: [{ version: 'desc' }, { updatedAt: 'desc' }],
      });

      if (fallback) {
        return toProfile(fallback, 'fallback');
      }

      warnings.push('profile_not_found_for_classification');
    }

    return {
      source: 'none',
      profile: null,
      classification: {
        objectiveKey,
        channelKey,
        nicheKey,
        source: classificationSource,
        confidence: classificationConfidence,
      },
      warnings,
    };
  }

  async ensureCampaignClassificationForActivation(campaignId: string) {
    const resolved = await this.resolveCampaignProfile(campaignId);
    const hasMinimum = hasMinimumCampaignClassification(
      resolved.classification.objectiveKey,
      resolved.classification.channelKey
    );

    return {
      hasMinimum,
      resolved,
    };
  }

  async backfillLegacyClassifications() {
    const clients = await this.prisma.client.findMany({
      include: {
        campaigns: {
          select: {
            id: true,
            objective: true,
            platform: true,
            optimizationThemeKey: true,
            objectiveClassKey: true,
            channelClassKey: true,
            status: true,
          },
        },
      },
    });

    let clientsUpdated = 0;
    let campaignsUpdated = 0;
    let reviewItems = 0;

    for (const client of clients) {
      let niche = client.businessNicheKey?.trim().toLowerCase() ?? null;
      let nicheConfidence = 100;

      if (!niche) {
        const inferredFromCampaignTheme = client.campaigns
          .map((campaign) => campaign.optimizationThemeKey)
          .find((value): value is string => typeof value === 'string' && value.trim().length > 0);

        if (inferredFromCampaignTheme) {
          niche = inferredFromCampaignTheme;
          nicheConfidence = 70;
        } else {
          niche = 'general';
          nicheConfidence = 40;
        }

        await this.prisma.client.update({
          where: { id: client.id },
          data: {
            businessNicheKey: niche,
            defaultChannelKey: client.defaultChannelKey ?? 'meta',
          },
        });

        clientsUpdated += 1;

        if (nicheConfidence < 80) {
          await this.prisma.ruleClassificationReview.create({
            data: {
              entityType: 'client',
              entityId: client.id,
              reasonCode: 'low_confidence_client_niche_backfill',
              status: 'pending',
            },
          });
          reviewItems += 1;
        }
      }

      for (const campaign of client.campaigns) {
        const objectiveClassKey =
          normalizeObjectiveClassKey(campaign.objectiveClassKey) ??
          inferObjectiveClassFromRawObjective(campaign.objective);
        const channelClassKey =
          normalizeChannelClassKey(campaign.channelClassKey) ??
          deriveChannelClassFromPlatform(campaign.platform);

        const objectiveConfidence = campaign.objectiveClassKey ? 95 : objectiveClassKey ? 80 : 45;
        const channelConfidence = campaign.channelClassKey ? 95 : channelClassKey ? 85 : 45;
        const confidence = Math.min(objectiveConfidence, channelConfidence);

        await this.putCampaignRuleContext(campaign.id, {
          objectiveClassKey,
          channelClassKey,
          classificationSource: 'backfill',
          classificationConfidence: confidence,
          needsReview: confidence < 80,
        });

        campaignsUpdated += 1;

        if (confidence < 80) {
          const suggested = await this.resolveCampaignProfile(campaign.id);

          await this.prisma.ruleClassificationReview.create({
            data: {
              entityType: 'campaign',
              entityId: campaign.id,
              reasonCode: 'low_confidence_campaign_classification_backfill',
              suggestedProfileId: suggested.profile?.id ?? null,
              status: 'pending',
            },
          });
          reviewItems += 1;
        }
      }
    }

    return {
      clientsUpdated,
      campaignsUpdated,
      reviewItems,
    };
  }

  async listReviewQueue(filters: { status?: string; entityType?: string; limit?: number }) {
    return this.prisma.ruleClassificationReview.findMany({
      where: {
        status: filters.status,
        entityType: filters.entityType,
      },
      include: {
        suggestedProfile: true,
      },
      orderBy: { createdAt: 'asc' },
      take: filters.limit,
    });
  }

  async resolveReview(
    id: string,
    input: {
      status: 'approved' | 'rejected';
      resolvedBy?: string;
      selectedProfileId?: string | null;
      applyToEntity?: boolean;
    }
  ) {
    const review = await this.prisma.ruleClassificationReview.findUnique({ where: { id } });
    if (!review) throw new Error('Review not found');

    const selectedProfileId = input.selectedProfileId ?? review.suggestedProfileId;

    if (input.status === 'approved' && selectedProfileId) {
      const profile = await this.prisma.ruleProfile.findUnique({ where: { id: selectedProfileId }, select: { id: true } });
      if (!profile) throw new Error('Selected profile not found');

      if (input.applyToEntity !== false) {
        if (review.entityType === 'campaign') {
          await this.putCampaignRuleContext(review.entityId, {
            ruleProfileId: selectedProfileId,
            needsReview: false,
            classificationSource: 'manual',
            classificationConfidence: 100,
          });
        }

        if (review.entityType === 'client') {
          await this.prisma.clientRuleProfileBinding.upsert({
            where: {
              clientId_ruleProfileId: {
                clientId: review.entityId,
                ruleProfileId: selectedProfileId,
              },
            },
            update: {
              isDefault: true,
              priority: 1,
            },
            create: {
              clientId: review.entityId,
              ruleProfileId: selectedProfileId,
              isDefault: true,
              priority: 1,
            },
          });
        }
      }
    }

    return this.prisma.ruleClassificationReview.update({
      where: { id },
      data: {
        status: input.status,
        resolvedAt: new Date(),
        resolvedBy: input.resolvedBy ?? null,
        suggestedProfileId: selectedProfileId,
      },
      include: {
        suggestedProfile: true,
      },
    });
  }
}
