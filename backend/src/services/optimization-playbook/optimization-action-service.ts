import { PrismaClient } from '@prisma/client';
import { MetaAdsService, type MetaWritebackResult } from '../meta-ads/service';

export type ActionExecutionResult = {
    success: boolean;
    message: string;
    metaResult?: MetaWritebackResult;
};

export class OptimizationActionService {
    constructor(private prisma: PrismaClient) { }

    private async getMetaServiceForClient(clientId: string): Promise<MetaAdsService> {
        const client = await this.prisma.client.findUnique({
            where: { id: clientId },
            select: { metaAdAccountId: true },
        });

        if (!client || !client.metaAdAccountId) {
            throw new Error(`Client ${clientId} not found or missing Meta Ad Account ID`);
        }

        const accessToken = process.env.META_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('System configuration error: META_ACCESS_TOKEN not set');
        }

        return new MetaAdsService({
            accessToken,
            adAccountId: client.metaAdAccountId,
        });
    }

    async executeAction(
        clientId: string,
        input: {
            type: 'pause_ad' | 'resume_ad' | 'set_adset_budget' | 'set_campaign_budget';
            entityId: string;
            amount?: number;
            reason: string;
            dryRun?: boolean;
        }
    ): Promise<ActionExecutionResult> {
        const { type, entityId, amount, dryRun } = input;

        console.log(`[OptimizationAction] Executing ${type} on ${entityId} (Client: ${clientId}, DryRun: ${dryRun})`);

        try {
            const metaService = await this.getMetaServiceForClient(clientId);
            let result: MetaWritebackResult;

            switch (type) {
                case 'pause_ad':
                    result = await metaService.pauseAd(entityId, { dryRun });
                    break;
                case 'resume_ad':
                    result = await metaService.resumeAd(entityId, { dryRun });
                    break;
                case 'set_adset_budget':
                    if (!amount) throw new Error('Amount is required for set_adset_budget');
                    result = await metaService.setAdSetDailyBudget(entityId, amount, { dryRun });
                    break;
                case 'set_campaign_budget':
                    if (!amount) throw new Error('Amount is required for set_campaign_budget');
                    result = await metaService.setCampaignDailyBudget(entityId, amount, { dryRun });
                    break;
                default:
                    throw new Error(`Unsupported action type: ${type}`);
            }

            if (!result.success) {
                return {
                    success: false,
                    message: result.error?.message || 'Meta API returned failure',
                    metaResult: result,
                };
            }

            return {
                success: true,
                message: `Successfully executed ${type}`,
                metaResult: result,
            };

        } catch (error) {
            console.error('[OptimizationAction] Error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error during execution',
            };
        }
    }
}
