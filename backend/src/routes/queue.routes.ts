import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { QUEUE_NAMES } from '../config/queues';
import { requireRoles } from '../middleware/rbac';

const queueRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  // GET /api/queue/status — health of all queues
  fastify.get('/api/queue/status', async () => {
    const queueService = fastify.services.queue;
    if (!queueService?.available) {
      return { available: false, message: 'BullMQ not available (Redis >= 5.0 required)', queues: [] };
    }

    const statuses = [];
    for (const [key, name] of Object.entries(QUEUE_NAMES)) {
      const queue = queueService.getQueue(name);
      if (!queue) continue;

      try {
        const counts = await queue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed');
        statuses.push({
          name,
          key,
          active: counts.active || 0,
          waiting: counts.waiting || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
        });
      } catch {
        statuses.push({ name, key, error: 'Failed to get counts' });
      }
    }

    return { available: true, queues: statuses };
  });

  // POST /api/queue/:queueName/trigger/:clientId — manual job trigger
  fastify.post('/api/queue/:queueName/trigger/:clientId', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    const { queueName, clientId } = request.params as { queueName: string; clientId: string };
    const queueService = fastify.services.queue;

    if (!queueService?.available) {
      reply.status(503);
      return { error: 'BullMQ not available' };
    }

    const validQueues = Object.values(QUEUE_NAMES) as string[];
    if (!validQueues.includes(queueName)) {
      reply.status(400);
      return { error: `Invalid queue name. Valid: ${validQueues.join(', ')}` };
    }

    let job;
    switch (queueName) {
      case QUEUE_NAMES.META_SYNC:
        job = await queueService.addMetaSyncJob(clientId);
        break;
      case QUEUE_NAMES.OPTIMIZATION:
        job = await queueService.addOptimizationJob(clientId);
        break;
      case QUEUE_NAMES.BUDGET_PACING:
        job = await queueService.addBudgetPacingJob(clientId);
        break;
      default:
        reply.status(400);
        return { error: `Cannot manually trigger queue: ${queueName}` };
    }

    return { queued: true, jobId: job?.id ?? null, queue: queueName, clientId };
  });

  // GET /api/queue/:queueName/jobs — list recent jobs
  fastify.get('/api/queue/:queueName/jobs', async (request, reply) => {
    const { queueName } = request.params as { queueName: string };
    const { status = 'completed', limit = '20' } = request.query as { status?: string; limit?: string };
    const queueService = fastify.services.queue;

    if (!queueService?.available) {
      reply.status(503);
      return { error: 'BullMQ not available' };
    }

    const queue = queueService.getQueue(queueName);
    if (!queue) {
      reply.status(404);
      return { error: `Queue not found: ${queueName}` };
    }

    const validStatuses = ['active', 'waiting', 'completed', 'failed', 'delayed'] as const;
    const jobStatus = validStatuses.includes(status as any) ? status as any : 'completed';
    const maxLimit = Math.min(parseInt(limit, 10) || 20, 100);

    const jobs = await queue.getJobs([jobStatus], 0, maxLimit - 1);

    return {
      queue: queueName,
      status: jobStatus,
      count: jobs.length,
      jobs: jobs.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        status: jobStatus,
        attemptsMade: j.attemptsMade,
        processedOn: j.processedOn ? new Date(j.processedOn).toISOString() : null,
        finishedOn: j.finishedOn ? new Date(j.finishedOn).toISOString() : null,
        failedReason: j.failedReason ?? null,
        returnvalue: j.returnvalue ?? null,
      })),
    };
  });

  // POST /api/queue/schedule — trigger recurring job setup
  fastify.post('/api/queue/schedule', { preHandler: [requireRoles(['admin', 'manager'])] }, async () => {
    const queueService = fastify.services.queue;
    if (!queueService?.available) {
      return { scheduled: false, message: 'BullMQ not available' };
    }

    const count = await queueService.scheduleRecurringJobs();
    return { scheduled: true, clientCount: count };
  });
};

export default queueRoutes;
