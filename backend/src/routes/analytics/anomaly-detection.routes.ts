import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { AnomalyDetectionService } from '../../services/anomaly-detection-service';

const anomalyDetectionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  const getService = () => new AnomalyDetectionService(fastify.pool, fastify.services.notification);

  fastify.post('/api/clients/:clientId/detect-anomalies', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };

    try {
      const service = getService();
      const anomalies = await service.detectAnomalies(clientId);

      return {
        clientId,
        detected: anomalies.length,
        anomalies,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to detect anomalies', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  fastify.get('/api/clients/:clientId/optimization/anomalies', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };
    const { days = '7' } = request.query as { days?: string };

    try {
      const service = getService();
      const anomalies = await service.getRecentAnomalies(clientId, parseInt(days) || 7);

      return {
        clientId,
        total: anomalies.length,
        anomalies,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to fetch anomalies', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  fastify.post('/api/clients/:clientId/anomalies/:anomalyId/acknowledge', async (request, reply) => {
    const { anomalyId } = request.params as { clientId: string; anomalyId: string };

    try {
      const service = getService();
      await service.acknowledgeAnomaly(anomalyId);
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to acknowledge anomaly' };
    }
  });
};

export default anomalyDetectionRoutes;
