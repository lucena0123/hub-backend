import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../middleware/error-handler';
import { CampaignCreateInput, CampaignUpdateInput } from '../validators/campaign';
import { inferOptimizationTheme } from './optimization-playbook';
import {
  RuleProfileService,
  deriveChannelClassFromPlatform,
  inferObjectiveClassFromRawObjective,
  isRuleProfileBlockingEnabled,
  isRuleProfileEngineEnabled,
  normalizeChannelClassKey,
  normalizeObjectiveClassKey,
} from './rule-profile-service';

export class CampaignService {
  constructor(
    private prisma: PrismaClient,
    private ruleProfiles: RuleProfileService
  ) {}

  /**
   * Find all campaigns with optional filters
   */
  async findAll(filters: {
    clientId?: string;
    platform?: string;
    status?: string;
  }) {
    const where: Prisma.CampaignWhereInput = {};

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.platform) where.platform = filters.platform;
    if (filters.status) where.status = filters.status;

    return this.prisma.campaign.findMany({
      where,
      include: {
        client: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find campaign by ID
   */
  async findById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        client: {
          select: { name: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    return campaign;
  }

  /**
   * Create new campaign
   */
  async create(data: CampaignCreateInput) {
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
      select: {
        id: true,
        defaultChannelKey: true,
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    if (data.ruleProfileId) {
      const profile = await this.prisma.ruleProfile.findUnique({ where: { id: data.ruleProfileId }, select: { id: true } });
      if (!profile) {
        throw new ValidationError('Rule profile not found');
      }
    }

    const externalId = data.externalId || `manual-${Date.now()}`;
    const inferredTheme = !data.optimizationThemeKey
      ? inferOptimizationTheme(data.name)
      : null;

    const objectiveClassKey =
      normalizeObjectiveClassKey(data.objectiveClassKey) ?? null;

    const channelClassKey =
      normalizeChannelClassKey(data.channelClassKey) ??
      deriveChannelClassFromPlatform(data.platform) ??
      normalizeChannelClassKey(client.defaultChannelKey);

    const status = data.status || 'draft';

    if (status === 'active' && isRuleProfileBlockingEnabled() && !(objectiveClassKey && channelClassKey)) {
      throw new ValidationError('Campaign cannot be activated without objectiveClassKey and channelClassKey');
    }

    const createdCampaign = await this.prisma.campaign.create({
      data: {
        ...data,
        externalId,
        spent: 0,
        status,
        objectiveClassKey: objectiveClassKey ?? null,
        channelClassKey: channelClassKey ?? null,
        optimizationThemeKey: data.optimizationThemeKey ?? inferredTheme?.themeKey ?? null,
        optimizationSubthemeKey: data.optimizationSubthemeKey ?? null,
      },
    });

    if (!isRuleProfileEngineEnabled()) {
      return createdCampaign;
    }

    await this.prisma.campaignRuleContext.upsert({
      where: { campaignId: createdCampaign.id },
      update: {
        objectiveKey: objectiveClassKey ?? null,
        channelKey: channelClassKey ?? null,
        ruleProfileId: data.ruleProfileId ?? null,
        classificationSource: data.objectiveClassKey || data.channelClassKey ? 'manual' : 'inferred',
        classificationConfidence: data.objectiveClassKey || data.channelClassKey ? 100 : 80,
        needsReview: false,
      },
      create: {
        campaignId: createdCampaign.id,
        objectiveKey: objectiveClassKey ?? null,
        channelKey: channelClassKey ?? null,
        ruleProfileId: data.ruleProfileId ?? null,
        classificationSource: data.objectiveClassKey || data.channelClassKey ? 'manual' : 'inferred',
        classificationConfidence: data.objectiveClassKey || data.channelClassKey ? 100 : 80,
        needsReview: false,
      },
    });

    // Resolve and persist profile when classification is available.
    if (objectiveClassKey && channelClassKey) {
      const resolved = await this.ruleProfiles.resolveCampaignProfile(createdCampaign.id);
      if (!data.ruleProfileId && resolved.profile?.id) {
        await this.prisma.campaign.update({
          where: { id: createdCampaign.id },
          data: { ruleProfileId: resolved.profile.id },
        });

        await this.prisma.campaignRuleContext.update({
          where: { campaignId: createdCampaign.id },
          data: { ruleProfileId: resolved.profile.id },
        });
      }
    }

    return createdCampaign;
  }

  /**
   * Update campaign
   */
  async update(id: string, data: CampaignUpdateInput) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            defaultChannelKey: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Campaign not found');
    }

    if (data.ruleProfileId) {
      const profile = await this.prisma.ruleProfile.findUnique({ where: { id: data.ruleProfileId }, select: { id: true } });
      if (!profile) {
        throw new ValidationError('Rule profile not found');
      }
    }

    const objectiveClassKey =
      data.objectiveClassKey === undefined
        ? normalizeObjectiveClassKey(existing.objectiveClassKey) ?? inferObjectiveClassFromRawObjective(existing.objective)
        : normalizeObjectiveClassKey(data.objectiveClassKey);

    const channelClassKey =
      data.channelClassKey === undefined
        ? normalizeChannelClassKey(existing.channelClassKey) ??
          deriveChannelClassFromPlatform(data.platform ?? existing.platform) ??
          normalizeChannelClassKey(existing.client.defaultChannelKey)
        : normalizeChannelClassKey(data.channelClassKey);

    if (data.objectiveClassKey !== undefined && data.objectiveClassKey !== null && !objectiveClassKey) {
      throw new ValidationError('Invalid objectiveClassKey');
    }

    if (data.channelClassKey !== undefined && data.channelClassKey !== null && !channelClassKey) {
      throw new ValidationError('Invalid channelClassKey');
    }

    const targetStatus = data.status ?? existing.status;
    if (targetStatus === 'active' && isRuleProfileBlockingEnabled() && !(objectiveClassKey && channelClassKey)) {
      throw new ValidationError('Campaign cannot be activated without objectiveClassKey and channelClassKey');
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...data,
        objectiveClassKey: objectiveClassKey ?? null,
        channelClassKey: channelClassKey ?? null,
      },
    });

    if (!isRuleProfileEngineEnabled()) {
      return updated;
    }

    await this.prisma.campaignRuleContext.upsert({
      where: { campaignId: id },
      update: {
        objectiveKey: objectiveClassKey ?? null,
        channelKey: channelClassKey ?? null,
        ruleProfileId: data.ruleProfileId === undefined ? existing.ruleProfileId : data.ruleProfileId,
        classificationSource: data.objectiveClassKey || data.channelClassKey ? 'manual' : 'inferred',
        classificationConfidence: data.objectiveClassKey || data.channelClassKey ? 100 : 80,
      },
      create: {
        campaignId: id,
        objectiveKey: objectiveClassKey ?? null,
        channelKey: channelClassKey ?? null,
        ruleProfileId: data.ruleProfileId === undefined ? existing.ruleProfileId : data.ruleProfileId,
        classificationSource: data.objectiveClassKey || data.channelClassKey ? 'manual' : 'inferred',
        classificationConfidence: data.objectiveClassKey || data.channelClassKey ? 100 : 80,
        needsReview: false,
      },
    });

    if (!data.ruleProfileId && objectiveClassKey && channelClassKey) {
      const resolved = await this.ruleProfiles.resolveCampaignProfile(id);
      if (resolved.profile?.id) {
        await this.prisma.campaign.update({
          where: { id },
          data: { ruleProfileId: resolved.profile.id },
        });

        await this.prisma.campaignRuleContext.update({
          where: { campaignId: id },
          data: { ruleProfileId: resolved.profile.id },
        });
      }
    }

    return updated;
  }

  /**
   * Delete campaign
   */
  async delete(id: string) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Campaign not found');
    }

    return this.prisma.campaign.delete({
      where: { id },
    });
  }
}
