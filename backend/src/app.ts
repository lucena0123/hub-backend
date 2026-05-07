import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { globalErrorHandler } from './middleware/error-handler';

import { IS_PRODUCTION, JWT_SECRET } from './config/env';
import servicesPlugin from './plugins/services';
import { registerRoutes } from './app/register-routes';

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

  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const isDev = !IS_PRODUCTION;

  fastify.register(cors, {
    origin: isDev ? true : allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
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

  fastify.register(servicesPluginOverride || servicesPlugin);

  registerRoutes(fastify);

  fastify.setErrorHandler(globalErrorHandler);

  return fastify;
}
