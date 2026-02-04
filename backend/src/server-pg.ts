/**
 * BPMN System - Backend API Server
 * Entry point - registers plugins and routes
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';

import { PORT, HOST, IS_PRODUCTION, JWT_SECRET } from './config/env';
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

// Fastify Server
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
fastify.register(servicesPlugin);

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

// Error handler
fastify.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
  fastify.log.error(error);

  reply.status(error.statusCode || 500).send({
    error: error.name || 'Internal Server Error',
    message: error.message,
    statusCode: error.statusCode || 500,
  });
});

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  console.log(`\nReceived signal to terminate: ${signal}`);
  try {
    await fastify.close();
    console.log('Server closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });

    console.log('\nBPMN System API is running!');
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${HOST}:${PORT}`);
    console.log(`   Database: PostgreSQL (native pg driver)`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
