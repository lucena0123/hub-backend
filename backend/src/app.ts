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
import creativeLinterRoutes from './routes/creative-linter.routes';
import { optimizationActionRoutes } from './routes/optimization-actions.routes';
import executiveDashboardRoutes from './routes/analytics/executive-dashboard.routes';
import queueRoutes from './routes/queue.routes';
import commercialDispatchRelayRoutes from './routes/commercial-dispatch-relay.routes';
import commercialLeadsRoutes from './routes/commercial-leads.routes';
import publicFormsRoutes from './routes/public-forms.routes';
import publicCommercialSchedulingRoutes from './routes/public-commercial-scheduling.routes';
import publicWhatsAppWebhookRoutes from './routes/public-whatsapp-webhook.routes';
import ruleProfilesRoutes from './routes/rule-profiles.routes';
import financeRoutes from './routes/finance.routes';
import projectRoutes from './routes/projects.routes';
import customerSuccessRoutes from './routes/customer-success.routes';

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
    // FRONTEND_URL supports comma-separated values for multiple allowed origins
    // e.g. "https://lucenasolucoesdigitais.com.br,https://www.lucenasolucoesdigitais.com.br"
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

    const isDev = !IS_PRODUCTION;

    fastify.register(cors, {
        origin: isDev ? true : (allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins),
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
    fastify.register(optimizationActionRoutes, { prefix: '/api/optimization' });
    fastify.register(creativeLinterRoutes);
    fastify.register(executiveDashboardRoutes);
    fastify.register(queueRoutes);
    fastify.register(commercialDispatchRelayRoutes);
    fastify.register(commercialLeadsRoutes);
    fastify.register(publicFormsRoutes);
    fastify.register(publicCommercialSchedulingRoutes);
    fastify.register(publicWhatsAppWebhookRoutes);
    fastify.register(ruleProfilesRoutes);
    fastify.register(financeRoutes);
    fastify.register(projectRoutes);
    fastify.register(customerSuccessRoutes);

    // Error handler
    fastify.setErrorHandler(globalErrorHandler);

    return fastify;
}
