import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import Ajv from 'ajv';
import { createAuditLog } from '../middleware/audit';

export default async function optimizationRoutes(fastify: FastifyInstance) {
    const ajv = new Ajv({ allErrors: true, strict: false });

    const sendApiError = (
        reply: { status: (statusCode: number) => { send: (payload: unknown) => unknown } },
        statusCode: number,
        code: string,
        error: string,
        details?: unknown
    ) => {
        return reply.status(statusCode).send({
            success: false,
            code,
            error,
            ...(details ? { details } : {}),
        });
    };

    const logOptimizationAudit = async (params: {
        userId?: string;
        userRole?: string;
        clientId?: string;
        processId?: string;
        action: 'create' | 'update' | 'delete' | 'read';
        entityType: 'task' | 'campaign' | 'client' | 'process' | 'user';
        entityId: string;
        changes?: unknown;
        metadata?: unknown;
    }) => {
        await createAuditLog(fastify.pool, {
            userId: params.userId,
            userRole: params.userRole,
            clientId: params.clientId,
            processId: params.processId,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            changes: params.changes,
            metadata: params.metadata,
        });
    };

    const ensureClientExists = async (clientId: string) => {
        const client = await fastify.prisma.client.findUnique({
            where: { id: clientId },
            select: { id: true },
        });

        return !!client;
    };

    fastify.addHook('preHandler', authenticate);
    // GET /api/optimization/audit
    // Query params: clientId, limit
    fastify.get('/api/optimization/audit', async (request, reply) => {
        const querySchema = z.object({
            clientId: z.string().optional(),
            action: z.enum(['create', 'update', 'delete', 'read']).optional(),
            eventType: z.string().min(1).optional(),
            sinceHours: z.coerce.number().int().min(1).max(720).optional(),
            limit: z.coerce.number().int().min(1).max(200).default(50),
        });

        const queryResult = querySchema.safeParse(request.query);
        if (!queryResult.success) {
            return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Invalid query params', queryResult.error.issues);
        }

        const { clientId, action, eventType, sinceHours, limit } = queryResult.data;
        const values: unknown[] = [];
        const where: string[] = [];

        if (clientId) {
            values.push(clientId);
            where.push(`"clientId" = $${values.length}`);
        }

        if (action) {
            values.push(action);
            where.push(`action = $${values.length}`);
        }

        if (eventType) {
            values.push(eventType);
            where.push(`"eventType" = $${values.length}`);
        }

        if (sinceHours) {
            values.push(sinceHours);
            where.push(`timestamp >= NOW() - ($${values.length} * INTERVAL '1 hour')`);
        }

        values.push(limit);
        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const result = await fastify.pool.query(
            `SELECT id, action, "eventType", "clientId", "processId", "userId", "userRole", resource, changes, metadata, timestamp
             FROM audit_events
             ${whereClause}
             ORDER BY timestamp DESC
             LIMIT $${values.length}`,
            values
        );

        return {
            success: true,
            total: result.rowCount,
            events: result.rows,
        };
    });

    // GET /api/optimization/audit/summary
    // Query params: clientId
    fastify.get('/api/optimization/audit/summary', async (request, reply) => {
        const querySchema = z.object({
            clientId: z.string().optional(),
            sinceHours: z.coerce.number().int().min(1).max(720).optional(),
        });

        const queryResult = querySchema.safeParse(request.query);
        if (!queryResult.success) {
            return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Invalid query params', queryResult.error.issues);
        }

        const { clientId, sinceHours } = queryResult.data;
        const values: unknown[] = [];
        const where: string[] = [];

        if (clientId) {
            values.push(clientId);
            where.push(`"clientId" = $${values.length}`);
        }

        if (sinceHours) {
            values.push(sinceHours);
            where.push(`timestamp >= NOW() - ($${values.length} * INTERVAL '1 hour')`);
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const actionsResult = await fastify.pool.query(
            `SELECT action, COUNT(*)::int AS total
             FROM audit_events
             ${whereClause}
             GROUP BY action`,
            values
        );

        const eventTypesResult = await fastify.pool.query(
            `SELECT "eventType", COUNT(*)::int AS total
             FROM audit_events
             ${whereClause}
             GROUP BY "eventType"
             ORDER BY total DESC
             LIMIT 20`,
            values
        );

        return {
            success: true,
            actions: actionsResult.rows,
            eventTypes: eventTypesResult.rows,
        };
    });

    // GET /api/optimization/tasks
    // Query params: status, clientId, processInstanceId
    fastify.get('/api/optimization/tasks', async (request) => {
        const querySchema = z.object({
            status: z.enum(['pending', 'in_progress', 'approved', 'rejected', 'completed', 'failed']).optional(),
            clientId: z.string().optional(),
            processInstanceId: z.string().optional(),
        });

        const queryResult = querySchema.safeParse(request.query);
        if (!queryResult.success) {
            return {
                success: false,
                code: 'VALIDATION_ERROR',
                error: 'Invalid query params',
                details: queryResult.error.issues,
            };
        }

        const query = queryResult.data;
        const { prisma } = fastify;

        // If clientId is provided, finding relevant process instances first might be needed
        // But let's assume filtering by processInstanceId is primary, or we filter tasks by joining ProcessInstance

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.processInstanceId) where.processInstanceId = query.processInstanceId;

        if (query.clientId) {
            where.processInstance = {
                clientId: query.clientId
            };
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                processInstance: {
                    select: {
                        clientId: true,
                        processId: true
                    }
                }
            },
            orderBy: {
                priority: 'desc',
            }
        });

        return tasks;
    });

    // PATCH /api/optimization/tasks/:id
    // Update status. If approved, execute action.
    fastify.patch('/api/optimization/tasks/:id', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string(),
        });
        const bodySchema = z.object({
            status: z.enum(['pending', 'in_progress', 'approved', 'rejected', 'completed', 'failed']),
            output: z.any().optional(),
        });

        const paramsResult = paramsSchema.safeParse(request.params);
        if (!paramsResult.success) {
            return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Invalid route params', paramsResult.error.issues);
        }

        const bodyResult = bodySchema.safeParse(request.body);
        if (!bodyResult.success) {
            return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Validation failed', bodyResult.error.issues);
        }

        const { id } = paramsResult.data;
        const { status, output } = bodyResult.data;
        const { prisma, services } = fastify;

        const task = await prisma.task.findUnique({
            where: { id },
            include: { processInstance: true }
        });

        if (!task) {
            return reply.status(404).send({
                success: false,
                code: 'TASK_NOT_FOUND',
                error: 'Task not found',
            });
        }

        // Variable to hold the final status, allowing 'failed' internally even if not in Zod
        let newStatus: string = status;
        let executionResult = null;

        if (status === 'approved' && task.status !== 'approved' && task.status !== 'completed') {
            // Execute Action
            const input = task.input as any;
            if (input && input.autoAction) {
                const actionInput = input.autoAction;
                const clientId = task.processInstance.clientId;

                try {
                    const result = await services.optimizationAction.executeAction(clientId, {
                        type: actionInput.type,
                        entityId: actionInput.entityId,
                        amount: actionInput.amount,
                        reason: `Task ${task.id} approved by user`,
                        dryRun: false // TODO: Make this configurable? Assumed live execution on approval.
                    });

                    executionResult = result;

                    if (result.success) {
                        newStatus = 'completed'; // Auto-complete on success
                    } else {
                        newStatus = 'failed';
                    }
                } catch (error) {
                    console.error('Task execution error', error);
                    newStatus = 'failed';
                    executionResult = { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
                }
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                status: newStatus,
                output: executionResult || output || task.output,
                completedAt: (newStatus === 'completed' || newStatus === 'failed') ? new Date() : null,
            }
        });

        await logOptimizationAudit({
            userId: request.user?.id,
            userRole: request.user?.role,
            clientId: task.processInstance?.clientId,
            processId: task.processInstanceId,
            action: 'update',
            entityType: 'task',
            entityId: updatedTask.id,
            changes: {
                before: { status: task.status, output: task.output },
                after: { status: updatedTask.status, output: updatedTask.output },
            },
            metadata: {
                route: 'PATCH /api/optimization/tasks/:id',
                requestedStatus: status,
                finalStatus: newStatus,
                hasExecutionResult: !!executionResult,
            },
        });

        return {
            success: true,
            code: 'TASK_UPDATED',
            task: updatedTask,
        };
    });

    // POST /api/optimization/run-rule
    // Execute a rule manually (Simulation)
    fastify.post('/api/optimization/run-rule', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
        const bodySchema = z.object({
            clientId: z.string(),
            ruleId: z.string(),
            entityId: z.string().optional(),
            campaignId: z.string().optional(),
            dryRun: z.boolean().default(true),
        });

        const bodyResult = bodySchema.safeParse(request.body);
        if (!bodyResult.success) {
            return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Validation failed', bodyResult.error.issues);
        }

        const { clientId, ruleId, entityId, campaignId, dryRun } = bodyResult.data;

        const clientExists = await ensureClientExists(clientId);
        if (!clientExists) {
            return sendApiError(reply, 404, 'CLIENT_NOT_FOUND', 'Client not found');
        }

        // Explicitly using variables to avoid unused var lint error
        request.log.info({
            msg: 'Simulating rule execution',
            clientId,
            ruleId,
            entityId,
            campaignId,
            dryRun
        });

        const target = campaignId || entityId || 'unknown-target';
        const execution = {
            ruleId,
            clientId,
            target,
            dryRun,
            executedAt: new Date().toISOString(),
        };

        await logOptimizationAudit({
            userId: request.user?.id,
            userRole: request.user?.role,
            clientId,
            action: 'update',
            entityType: 'task',
            entityId: `rule:${ruleId}`,
            changes: {
                after: {
                    execution,
                    shouldTrigger: dryRun ? undefined : true,
                },
            },
            metadata: {
                route: 'POST /api/optimization/run-rule',
                entityId,
                campaignId,
            },
        });

        return {
            success: true,
            code: dryRun ? 'RULE_SIMULATED' : 'RULE_EXECUTED',
            message: `Rule ${ruleId} executed on ${target} ${dryRun ? '(Simulation)' : ''}`,
            execution,
            simulatedResult: {
                shouldTrigger: Math.random() > 0.5,
                reason: "Simulated execution result",
                input: { clientId, ruleId, entityId, campaignId, dryRun }
            }
        };
    });

    // GET /api/optimization/rules
    // List available rules with client configuration
    fastify.get('/api/optimization/rules', async (request) => {
        const { getOptimizationCenterRuleMetas } = require('../services/optimization-playbook/optimization-center/engine/registry');
        const systemRules = (getOptimizationCenterRuleMetas() as any[]).map((rule) => ({
            ...rule,
            source: 'system',
        }));

        let customRules: Array<{
            id: string;
            title: string;
            description: string;
            condition: string;
            level: string;
            severity: string;
            category: string;
            action: string;
            parametersSchema: any | null;
            parametersTemplate: any | null;
        }> = [];

        try {
            customRules = await fastify.prisma.optimizationPlaybookRule.findMany({
                orderBy: { createdAt: 'asc' },
            });
        } catch (error) {
            request.log.warn({ err: error }, 'Optimization playbook rules table not available yet.');
        }

        const customRuleMetas = customRules.map((rule) => ({
            id: rule.id,
            level: rule.level,
            severity: rule.severity,
            category: rule.category,
            action: rule.action,
            title: rule.title,
            description: rule.description,
            condition: rule.condition,
            parametersSchema: rule.parametersSchema ?? undefined,
            parametersTemplate: rule.parametersTemplate ?? undefined,
            source: 'custom',
        }));

        const mergedById = new Map<string, any>();
        for (const rule of systemRules) mergedById.set(rule.id, rule);
        for (const rule of customRuleMetas) {
            if (!mergedById.has(rule.id)) mergedById.set(rule.id, rule);
        }

        const rules = Array.from(mergedById.values());

        // Get clientId from query or auth context (mocking for now as we might accept ?clientId=...)
        // In a real scenario, we'd use request.user.clientId or similar.
        // Let's support ?clientId=query param for the board.
        const { clientId } = request.query as { clientId?: string };

        if (!clientId) {
            return rules.map((r: any) => ({ ...r, enabled: true, parameters: r.parametersTemplate ?? {} }));
        }

        const configs = await fastify.prisma.clientRuleConfig.findMany({
            where: { clientId }
        });

        const mergedRules = rules.map((rule: any) => {
            const config = configs.find(c => c.ruleId === rule.id);
            return {
                ...rule,
                enabled: config ? config.enabled : true, // Default to true if not set
                parameters: config ? (config.parameters ?? {}) : (rule.parametersTemplate ?? {}),
            };
        });

        return mergedRules;
    });

    // POST /api/optimization/rules
    // Create a custom playbook rule
    fastify.post('/api/optimization/rules', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
        const bodySchema = z.object({
            id: z.string().min(3),
            title: z.string().min(3),
            description: z.string().min(3),
            condition: z.string().min(1),
            level: z.enum(['campaign', 'creative', 'adset', 'qualification', 'data']),
            severity: z.enum(['critical', 'warning', 'info', 'opportunity']),
            category: z.enum(['campaign', 'creative', 'adset', 'qualification', 'data']),
            action: z.enum(['review', 'pause', 'refresh', 'scale', 'track', 'sync']),
            parametersSchema: z.any().optional().nullable(),
            parametersTemplate: z.any().optional().nullable(),
        });

        const payloadResult = bodySchema.safeParse(request.body);
        if (!payloadResult.success) {
            return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Validation failed', payloadResult.error.issues);
        }

        const payload = payloadResult.data;
        const { getOptimizationCenterRuleMetas } = require('../services/optimization-playbook/optimization-center/engine/registry');
        const systemRules = getOptimizationCenterRuleMetas() as Array<{ id: string }>;

        if (systemRules.some((rule) => rule.id === payload.id)) {
            return sendApiError(reply, 409, 'RULE_ID_CONFLICT', 'Rule ID already exists in system rules.');
        }

        const existing = await fastify.prisma.optimizationPlaybookRule.findUnique({
            where: { id: payload.id },
        });
        if (existing) {
            return sendApiError(reply, 409, 'RULE_ID_CONFLICT', 'Rule ID already exists.');
        }

        if (payload.parametersSchema && payload.parametersTemplate) {
            try {
                const validate = ajv.compile(payload.parametersSchema as Record<string, unknown>);
                const valid = validate(payload.parametersTemplate);
                if (!valid) {
                    return sendApiError(reply, 422, 'INVALID_PARAMETERS_TEMPLATE', 'Invalid parametersTemplate', validate.errors);
                }
            } catch (error) {
                return sendApiError(reply, 422, 'INVALID_PARAMETERS_SCHEMA', 'Invalid parameters schema');
            }
        }

        const created = await fastify.prisma.optimizationPlaybookRule.create({
            data: {
                id: payload.id,
                title: payload.title,
                description: payload.description,
                condition: payload.condition,
                level: payload.level,
                severity: payload.severity,
                category: payload.category,
                action: payload.action,
                parametersSchema: payload.parametersSchema ?? null,
                parametersTemplate: payload.parametersTemplate ?? null,
            },
        });

        return {
            id: created.id,
            level: created.level,
            severity: created.severity,
            category: created.category,
            action: created.action,
            title: created.title,
            description: created.description,
            condition: created.condition,
            parametersSchema: created.parametersSchema ?? undefined,
            parametersTemplate: created.parametersTemplate ?? undefined,
            source: 'custom',
        };
    });

    // PATCH /api/optimization/rules/:ruleId
    // Update a custom playbook rule
    fastify.patch('/api/optimization/rules/:ruleId', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
        const { ruleId } = request.params as { ruleId: string };
        const bodySchema = z.object({
            title: z.string().min(3).optional(),
            description: z.string().min(3).optional(),
            condition: z.string().min(1).optional(),
            level: z.enum(['campaign', 'creative', 'adset', 'qualification', 'data']).optional(),
            severity: z.enum(['critical', 'warning', 'info', 'opportunity']).optional(),
            category: z.enum(['campaign', 'creative', 'adset', 'qualification', 'data']).optional(),
            action: z.enum(['review', 'pause', 'refresh', 'scale', 'track', 'sync']).optional(),
            parametersSchema: z.any().optional().nullable(),
            parametersTemplate: z.any().optional().nullable(),
        });

        const payloadResult = bodySchema.safeParse(request.body);
        if (!payloadResult.success) {
            return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Validation failed', payloadResult.error.issues);
        }

        const payload = payloadResult.data;
        const existing = await fastify.prisma.optimizationPlaybookRule.findUnique({
            where: { id: ruleId },
        });
        if (!existing) {
            return sendApiError(reply, 404, 'CUSTOM_RULE_NOT_FOUND', 'Custom rule not found.');
        }

        const nextSchema = payload.parametersSchema !== undefined ? payload.parametersSchema : existing.parametersSchema;
        const nextTemplate = payload.parametersTemplate !== undefined ? payload.parametersTemplate : existing.parametersTemplate;
        if (nextSchema && nextTemplate) {
            try {
                const validate = ajv.compile(nextSchema as Record<string, unknown>);
                const valid = validate(nextTemplate);
                if (!valid) {
                    return sendApiError(reply, 422, 'INVALID_PARAMETERS_TEMPLATE', 'Invalid parametersTemplate', validate.errors);
                }
            } catch (error) {
                return sendApiError(reply, 422, 'INVALID_PARAMETERS_SCHEMA', 'Invalid parameters schema');
            }
        }

        const data: Record<string, unknown> = {};
        if (payload.title !== undefined) data.title = payload.title;
        if (payload.description !== undefined) data.description = payload.description;
        if (payload.condition !== undefined) data.condition = payload.condition;
        if (payload.level !== undefined) data.level = payload.level;
        if (payload.severity !== undefined) data.severity = payload.severity;
        if (payload.category !== undefined) data.category = payload.category;
        if (payload.action !== undefined) data.action = payload.action;
        if ('parametersSchema' in payload) data.parametersSchema = payload.parametersSchema ?? null;
        if ('parametersTemplate' in payload) data.parametersTemplate = payload.parametersTemplate ?? null;

        const updated = await fastify.prisma.optimizationPlaybookRule.update({
            where: { id: ruleId },
            data,
        });

        return {
            id: updated.id,
            level: updated.level,
            severity: updated.severity,
            category: updated.category,
            action: updated.action,
            title: updated.title,
            description: updated.description,
            condition: updated.condition,
            parametersSchema: updated.parametersSchema ?? undefined,
            parametersTemplate: updated.parametersTemplate ?? undefined,
            source: 'custom',
        };
    });

    // DELETE /api/optimization/rules/:ruleId
    // Remove a custom playbook rule
    fastify.delete('/api/optimization/rules/:ruleId', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
        const { ruleId } = request.params as { ruleId: string };
        const existing = await fastify.prisma.optimizationPlaybookRule.findUnique({
            where: { id: ruleId },
        });
        if (!existing) {
            return sendApiError(reply, 404, 'CUSTOM_RULE_NOT_FOUND', 'Custom rule not found.');
        }

        await fastify.prisma.$transaction([
            fastify.prisma.clientRuleConfig.deleteMany({ where: { ruleId } }),
            fastify.prisma.optimizationPlaybookRule.delete({ where: { id: ruleId } }),
        ]);

        return { success: true };
    });

    // POST /api/optimization/rules/:ruleId/toggle
    fastify.post('/api/optimization/rules/:ruleId/toggle', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
        const { ruleId } = request.params as { ruleId: string };

        const bodySchema = z.object({
            clientId: z.string().min(1),
            enabled: z.boolean(),
        });

        const bodyResult = bodySchema.safeParse(request.body);
        if (!bodyResult.success) {
            return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Validation failed', bodyResult.error.issues);
        }

        const { clientId, enabled } = bodyResult.data;

        const clientExists = await ensureClientExists(clientId);
        if (!clientExists) {
            return sendApiError(reply, 404, 'CLIENT_NOT_FOUND', 'Client not found');
        }

        const config = await fastify.prisma.clientRuleConfig.upsert({
            where: {
                clientId_ruleId: { clientId, ruleId }
            },
            update: { enabled },
            create: {
                clientId,
                ruleId,
                enabled
            }
        });

        await logOptimizationAudit({
            userId: request.user?.id,
            userRole: request.user?.role,
            clientId,
            action: 'update',
            entityType: 'client',
            entityId: clientId,
            changes: {
                after: {
                    ruleId,
                    enabled,
                },
            },
            metadata: {
                route: 'POST /api/optimization/rules/:ruleId/toggle',
            },
        });

        return config;
    });

    // POST /api/optimization/rules/:ruleId/config
    fastify.post('/api/optimization/rules/:ruleId/config', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
        const { ruleId } = request.params as { ruleId: string };

        const bodySchema = z.object({
            clientId: z.string().min(1),
            parameters: z.record(z.any()),
        });

        const bodyResult = bodySchema.safeParse(request.body);
        if (!bodyResult.success) {
            return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Validation failed', bodyResult.error.issues);
        }

        const { clientId, parameters } = bodyResult.data;

        const clientExists = await ensureClientExists(clientId);
        if (!clientExists) {
            return sendApiError(reply, 404, 'CLIENT_NOT_FOUND', 'Client not found');
        }

        const customRule = await fastify.prisma.optimizationPlaybookRule.findUnique({
            where: { id: ruleId },
            select: { parametersSchema: true },
        });

        if (customRule?.parametersSchema && typeof customRule.parametersSchema === 'object') {
            try {
                const validate = ajv.compile(customRule.parametersSchema as Record<string, unknown>);
                const valid = validate(parameters);
                if (!valid) {
                    return sendApiError(reply, 422, 'INVALID_PARAMETERS', 'Invalid parameters', validate.errors);
                }
            } catch (error) {
                return sendApiError(reply, 422, 'INVALID_PARAMETERS_SCHEMA', 'Invalid parameters schema');
            }
        }

        const config = await fastify.prisma.clientRuleConfig.upsert({
            where: {
                clientId_ruleId: { clientId, ruleId }
            },
            update: { parameters },
            create: {
                clientId,
                ruleId,
                parameters
            }
        });

        await logOptimizationAudit({
            userId: request.user?.id,
            userRole: request.user?.role,
            clientId,
            action: 'update',
            entityType: 'client',
            entityId: clientId,
            changes: {
                after: {
                    ruleId,
                    parameters,
                },
            },
            metadata: {
                route: 'POST /api/optimization/rules/:ruleId/config',
            },
        });

        return config;
    });
}
