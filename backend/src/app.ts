import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { globalErrorHandler } from './middleware/error-handler';

import { IS_PRODUCTION, JWT_SECRET } from './config/env';
import servicesPlugin from './plugins/services';

// Route modules
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import campaignRoutes from './routes/campaign.routes';
import metricsRoutes from './routes/metrics.routes';
import metaSyncRoutes from './routes/meta-sync.routes';
import metaDiscoveryRoutes from './routes/meta-discovery.routes';
import bpmnRoutes from './routes/bpmn.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import processRoutes from './routes/process.routes';
import leadTrackingRoutes from './routes/lead-tracking.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notification.routes';
import optimizationRoutes from './routes/optimization.routes';
import automationRoutes from './routes/automation.routes';
import commercialDispatchRelayRoutes from './routes/commercial-dispatch-relay.routes';
import commercialLeadsRoutes from './routes/commercial-leads.routes';

import { FastifyPluginAsync } from 'fastify';

export function buildApp(servicesPluginOverride?: FastifyPluginAsync) {
    const fastify = Fastify({
        logger: {
            level: IS_PRODUCTION ? 'info' : 'debug',
            transport: IS_PRODUCTION
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                        translateTime: 'HH:MM:ss Z',
                        ignore: 'pid,hostname',
                    },
                },
        },
    });

    // Core plugins
    fastify.register(cors, {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    fastify.register(helmet, {
        contentSecurityPolicy: false,
    });

    fastify.register(jwt, {
        secret: JWT_SECRET,
        sign: { expiresIn: '24h' },
    });

    // Services plugin (database, redis, all services)
    fastify.register(servicesPluginOverride || servicesPlugin);

    // Route plugins
    fastify.register(healthRoutes);
    fastify.register(authRoutes);
    fastify.register(clientRoutes);
    fastify.register(campaignRoutes);
    fastify.register(metricsRoutes);
    fastify.register(metaSyncRoutes);
    fastify.register(metaDiscoveryRoutes);
    fastify.register(bpmnRoutes);
    fastify.register(dashboardRoutes);
    fastify.register(reportRoutes);
    fastify.register(processRoutes);
    fastify.register(leadTrackingRoutes);
    fastify.register(analyticsRoutes);
    fastify.register(notificationRoutes);
    fastify.register(optimizationRoutes);
    fastify.register(automationRoutes);
    fastify.register(commercialDispatchRelayRoutes);
    fastify.register(commercialLeadsRoutes);

    // Error handler
    fastify.setErrorHandler(globalErrorHandler);

    return fastify;
}
