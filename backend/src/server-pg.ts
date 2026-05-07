import { buildApp } from './app';
import { PORT, HOST } from './config/env';
import { startWorkers, stopWorkers } from './workers';
import { redis } from './config/redis';
import { startCommercialJobRunner } from './runtime/commercial-job-runner';

const fastify = buildApp();
let workers: ReturnType<typeof startWorkers> = [];
let commercialJobRunner = startCommercialJobRunner({ enabled: false, commercialLeads: null, logger: fastify.log });

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  console.log(`\nReceived signal to terminate: ${signal}`);
  try {
    await stopWorkers(workers);
    commercialJobRunner.stop();
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

    // Start BullMQ workers after server is listening (skip if Redis < 5.0)
    // Accessing services via fastify instance which has been decorated
    // We need to wait for ready() to ensure plugins are loaded if we were accessing them synchronously,
    // but listen() awaits ready() internally.

    // However, fastify.services might not be typed on the generic instance returned by buildApp
    // unless we strictly type buildApp return. But at runtime it's there.
    const services = (fastify as any).services;

    if (services && services.queue && services.queue.available && services.analytics) {
      workers = startWorkers((fastify as any).pool, { cacheRedis: redis, analytics: services.analytics });
    } else {
      fastify.log.warn('Workers: skipped (BullMQ requires Redis >= 5.0)');
    }

    commercialJobRunner = startCommercialJobRunner({
      enabled: process.env.COMMERCIAL_RUNTIME_JOBS_ENABLED === 'true',
      commercialLeads: services?.commercialLeads ?? null,
      logger: fastify.log,
    });

    fastify.log.info(`Hub API running — http://localhost:${PORT} | workers: ${workers.length} | env: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
