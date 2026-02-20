import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { MetaAdsService } from '../services/meta-ads/service';

export const optimizationActionRoutes: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', authenticate);

    app.post<{
        Body: {
            type: 'pause_ad' | 'resume_ad' | 'set_adset_budget' | 'set_campaign_budget';
            clientId?: string;
            entityId: string;
            amount?: number;
            reason: string;
            dryRun?: boolean;
            // Backward compatible mode (frontend may pass these directly)
            accessToken?: string;
            adAccountId?: string;
        }
    }>('/actions/execute', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (req, reply) => {
        const { clientId, type, entityId, amount, reason, dryRun, accessToken, adAccountId } = req.body;

        // Preferred mode: use server-side credentials (clientId -> Meta account id in DB + META_ACCESS_TOKEN env)
        if (clientId) {
            const result = await app.services.optimizationAction.executeAction(clientId, {
                type,
                entityId,
                amount,
                reason,
                dryRun
            });

            if (!result.success) {
                return reply.status(500).send(result);
            }

            return result;
        }

        // Backward compatible mode: explicit Meta credentials
        if (!accessToken || !adAccountId) {
            return reply.status(400).send({ error: 'Missing clientId or (accessToken + adAccountId)' });
        }

        const metaAdsService = new MetaAdsService({
            accessToken,
            adAccountId,
            apiVersion: process.env.META_API_VERSION,
        });

        let metaResult: any;

        switch (type) {
            case 'pause_ad':
                metaResult = await metaAdsService.pauseAd(entityId, { dryRun });
                break;
            case 'resume_ad':
                metaResult = await metaAdsService.resumeAd(entityId, { dryRun });
                break;
            case 'set_adset_budget':
                metaResult = await metaAdsService.setAdSetDailyBudget(entityId, amount ?? 0, { dryRun });
                break;
            case 'set_campaign_budget':
                metaResult = await metaAdsService.setCampaignDailyBudget(entityId, amount ?? 0, { dryRun });
                break;
            default:
                return reply.status(400).send({ error: `Unsupported action type: ${type}` });
        }

        const result = metaResult?.success
            ? { success: true, message: `Successfully executed ${type}`, metaResult }
            : { success: false, message: metaResult?.error?.message || 'Meta API returned failure', metaResult };

        if (!result.success) {
            return reply.status(500).send(result);
        }

        return result;
    });

    // Endpoint to manually trigger optimization tasks
    app.post<{ Body: { clientId: string } }>('/tasks/generate', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (req, reply) => {
        const { clientId } = req.body;

        if (!clientId) {
            return reply.status(400).send({ error: 'Missing clientId' });
        }

        const queueService = app.services.queue;
        if (!queueService?.available) {
            return reply.status(503).send({ error: 'Queue service not available (BullMQ disabled)' });
        }

        await queueService.addOptimizationJob(clientId);

        return {
            success: true,
            message: `Optimization job queued for client ${clientId}`,
            jobType: 'generate-proposals'
        };
    });
};
