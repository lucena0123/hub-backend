import { FastifyPluginAsync } from 'fastify';
import breakdownsRoutes from './analytics/breakdowns.routes';
import businessMetricsRoutes from './analytics/business-metrics.routes';
import campaignCreativeMetricsRoutes from './analytics/campaign-creative-metrics.routes';
import copyInsightsRoutes from './analytics/copy-insights.routes';
import creativeLibraryRoutes from './analytics/creative-library.routes';
import creativeSnapshotsRoutes from './analytics/creative-snapshots.routes';
import optimizationCenterRoutes from './analytics/optimization-center.routes';
import playbookRoutes from './analytics/playbooks.routes';
import temporalAnalysisRoutes from './analytics/temporal-analysis.routes';

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(playbookRoutes);
  fastify.register(copyInsightsRoutes);
  fastify.register(campaignCreativeMetricsRoutes);
  fastify.register(creativeLibraryRoutes);
  fastify.register(creativeSnapshotsRoutes);
  fastify.register(breakdownsRoutes);
  fastify.register(temporalAnalysisRoutes);
  fastify.register(businessMetricsRoutes);
  fastify.register(optimizationCenterRoutes);
};

export default analyticsRoutes;
