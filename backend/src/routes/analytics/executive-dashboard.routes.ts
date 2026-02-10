import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { CampaignHealthService } from '../../services/campaign-health-service';

type ClientSummary = {
  clientId: string;
  clientName: string;
  tier: string;
  status: string;
  healthScore: number | null;
  healthGrade: string | null;
  spend7d: number;
  spend30d: number;
  conversations7d: number;
  cpl7d: number | null;
  anomalyCount: number;
  pendingProposals: number;
};

const executiveDashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/api/dashboard/executive', async (_request, reply) => {
    try {
      const pool = fastify.pool;

      // Get all active clients
      const clientsResult = await pool.query(
        `SELECT id, name, tier, status FROM clients WHERE status = 'active' ORDER BY name`
      );

      const summaries: ClientSummary[] = [];
      const healthService = new CampaignHealthService(pool);

      for (const client of clientsResult.rows) {
        // Get spend and conversations (7d and 30d)
        const metricsResult = await pool.query(
          `SELECT
            COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.spend ELSE 0 END), 0)::float as spend_7d,
            COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '30 days' THEN cm.spend ELSE 0 END), 0)::float as spend_30d,
            COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.messaging_conversations ELSE 0 END), 0)::int as conv_7d
          FROM campaign_metrics cm
          JOIN campaigns c ON c.id = cm.campaign_id
          WHERE c."clientId" = $1 AND cm.date >= CURRENT_DATE - INTERVAL '30 days'`,
          [client.id]
        );

        const spend7d = metricsResult.rows[0]?.spend_7d || 0;
        const spend30d = metricsResult.rows[0]?.spend_30d || 0;
        const conv7d = metricsResult.rows[0]?.conv_7d || 0;
        const cpl7d = conv7d > 0 ? spend7d / conv7d : null;

        // Get health scores
        let healthScore: number | null = null;
        let healthGrade: string | null = null;
        try {
          const health = await healthService.getHealthScores(client.id);
          if (health.length > 0) {
            healthScore = Math.round(health.reduce((s, h) => s + h.score, 0) / health.length);
            healthGrade = healthScore >= 85 ? 'A' : healthScore >= 70 ? 'B' : healthScore >= 50 ? 'C' : healthScore >= 30 ? 'D' : 'F';
          }
        } catch (_) {}

        // Get anomaly count
        let anomalyCount = 0;
        try {
          const anomalyResult = await pool.query(
            `SELECT COUNT(*)::int as count FROM anomaly_detections
             WHERE client_id = $1 AND acknowledged = false AND created_at >= NOW() - INTERVAL '7 days'`,
            [client.id]
          );
          anomalyCount = anomalyResult.rows[0]?.count || 0;
        } catch (_) {}

        // Get pending proposals count
        let pendingProposals = 0;
        try {
          const proposalResult = await pool.query(
            `SELECT COUNT(*)::int as count FROM action_proposals
             WHERE client_id = $1 AND status = 'pending'`,
            [client.id]
          );
          pendingProposals = proposalResult.rows[0]?.count || 0;
        } catch (_) {}

        summaries.push({
          clientId: client.id,
          clientName: client.name,
          tier: client.tier,
          status: client.status,
          healthScore,
          healthGrade,
          spend7d,
          spend30d,
          conversations7d: conv7d,
          cpl7d,
          anomalyCount,
          pendingProposals,
        });
      }

      // Sort by health score (worst first), nulls last
      summaries.sort((a, b) => {
        if (a.healthScore == null && b.healthScore == null) return 0;
        if (a.healthScore == null) return 1;
        if (b.healthScore == null) return -1;
        return a.healthScore - b.healthScore;
      });

      // KPI totals
      const totalSpend = summaries.reduce((s, c) => s + c.spend7d, 0);
      const totalConversations = summaries.reduce((s, c) => s + c.conversations7d, 0);
      const clientsNeedingAttention = summaries.filter(c => c.healthScore != null && c.healthScore < 50).length;
      const totalAnomalies = summaries.reduce((s, c) => s + c.anomalyCount, 0);

      return {
        kpi: {
          totalSpend7d: totalSpend,
          totalConversations7d: totalConversations,
          avgCpl: totalConversations > 0 ? totalSpend / totalConversations : null,
          clientsNeedingAttention,
          totalAnomalies,
          totalClients: summaries.length,
        },
        clients: summaries,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to build executive dashboard', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
};

export default executiveDashboardRoutes;
