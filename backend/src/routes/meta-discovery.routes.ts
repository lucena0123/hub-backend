import { FastifyPluginAsync } from 'fastify';
import { MetaAdsService } from '../services/meta-ads-service';
import { authenticate } from '../middleware/auth';

const metaDiscoveryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  // Test Meta API connection
  fastify.get('/api/meta/test', async (_request, reply) => {
    try {
      const accessToken = process.env.META_ACCESS_TOKEN;

      if (!accessToken) {
        reply.status(400);
        return { error: 'META_ACCESS_TOKEN not configured in .env' };
      }

      const testUrl = 'https://graph.facebook.com/v20.0/me?fields=id,name';
      const response = await fetch(testUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const data = await response.json() as any;

      if (!response.ok) {
        reply.status(response.status);
        return {
          error: 'Meta API connection failed',
          message: data.error?.message || 'Unknown error',
          code: data.error?.code,
        };
      }

      return {
        success: true,
        message: 'Meta API connection successful',
        user: data,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to test Meta API',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // List all ad accounts accessible by the user
  fastify.get('/api/meta/accounts', async (_request, reply) => {
    try {
      const accessToken = process.env.META_ACCESS_TOKEN;

      if (!accessToken) {
        reply.status(400);
        return { error: 'META_ACCESS_TOKEN not configured in .env' };
      }

      const metaService = new MetaAdsService({
        accessToken,
        adAccountId: '0',
      });

      const accounts = await metaService.fetchAdAccounts();

      return {
        total: accounts.length,
        accounts: accounts.map(acc => ({
          id: acc.id,
          accountId: acc.account_id,
          name: acc.name,
          status: acc.account_status,
          currency: acc.currency,
          timezone: acc.timezone_name,
          businessName: acc.business_name,
          amountSpent: acc.amount_spent,
          spendCap: acc.spend_cap,
        })),
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch Meta ad accounts',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get specific ad account details
  fastify.get<{ Params: { accountId: string } }>(
    '/api/meta/accounts/:accountId/info',
    async (request, reply) => {
      try {
        const { accountId } = request.params;
        const accessToken = process.env.META_ACCESS_TOKEN;

        if (!accessToken) {
          reply.status(400);
          return { error: 'META_ACCESS_TOKEN not configured in .env' };
        }

        const metaService = new MetaAdsService({
          accessToken,
          adAccountId: accountId,
        });

        const accountInfo = await metaService.fetchAdAccountDetails();

        return {
          id: accountInfo.id,
          accountId: accountInfo.account_id,
          name: accountInfo.name,
          status: accountInfo.account_status,
          currency: accountInfo.currency,
          timezone: accountInfo.timezone_name,
          businessName: accountInfo.business_name,
          amountSpent: accountInfo.amount_spent,
          spendCap: accountInfo.spend_cap,
        };
      } catch (error) {
        reply.status(500);
        return {
          error: 'Failed to fetch ad account details',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // List campaigns for a specific ad account
  fastify.get<{ Params: { accountId: string } }>(
    '/api/meta/accounts/:accountId/campaigns',
    async (request, reply) => {
      try {
        const { accountId } = request.params;
        const accessToken = process.env.META_ACCESS_TOKEN;

        if (!accessToken) {
          reply.status(400);
          return { error: 'META_ACCESS_TOKEN not configured in .env' };
        }

        const metaService = new MetaAdsService({
          accessToken,
          adAccountId: accountId,
        });

        const campaigns = await metaService.fetchCampaigns();

        return {
          accountId,
          total: campaigns.length,
          campaigns: campaigns.map(camp => ({
            id: camp.id,
            name: camp.name,
            status: camp.status,
            objective: camp.objective,
            dailyBudget: camp.daily_budget,
            lifetimeBudget: camp.lifetime_budget,
            createdTime: camp.created_time,
            updatedTime: camp.updated_time,
          })),
        };
      } catch (error) {
        reply.status(500);
        return {
          error: 'Failed to fetch campaigns',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

export default metaDiscoveryRoutes;
