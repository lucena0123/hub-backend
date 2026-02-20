/**
 * Notification Routes
 * GET  /api/notifications           — list (query: clientId, read, limit, offset)
 * GET  /api/notifications/unread-count — count unread
 * POST /api/notifications/:id/read  — mark one as read
 * POST /api/notifications/mark-all-read — mark all as read
 */

import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  const { notification } = fastify.services;

  fastify.get<{
    Querystring: { clientId?: string; read?: string; limit?: string; offset?: string };
  }>(
    '/api/notifications',
    { preHandler: [authenticate] },
    async (request) => {
      const { clientId, read, limit, offset } = request.query;

      const notifications = await notification.list({
        clientId: clientId || undefined,
        read: read === 'true' ? true : read === 'false' ? false : undefined,
        limit: limit ? Math.min(Number(limit), 200) : 50,
        offset: offset ? Number(offset) : 0,
      });

      return { total: notifications.length, notifications };
    }
  );

  fastify.get<{ Querystring: { clientId?: string } }>(
    '/api/notifications/unread-count',
    { preHandler: [authenticate] },
    async (request) => {
      const count = await notification.countUnread(request.query.clientId || undefined);
      return { count };
    }
  );

  fastify.post<{ Params: { id: string } }>(
    '/api/notifications/:id/read',
    { preHandler: [authenticate] },
    async (request) => {
      await notification.markAsRead(request.params.id);
      return { success: true };
    }
  );

  fastify.post<{ Querystring: { clientId?: string } }>(
    '/api/notifications/mark-all-read',
    { preHandler: [authenticate] },
    async (request) => {
      const updated = await notification.markAllAsRead(request.query.clientId || undefined);
      return { success: true, updated };
    }
  );
};

export default notificationRoutes;
