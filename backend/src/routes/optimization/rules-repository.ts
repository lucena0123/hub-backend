import type { FastifyBaseLogger, FastifyInstance } from 'fastify';

import { getOptimizationCenterRuleMetas } from '../../services/optimization-playbook/optimization-center/engine/registry';

type CustomRule = {
  id: string;
  title: string;
  description: string;
  condition: string;
  level: string;
  severity: string;
  category: string;
  action: string;
  parametersSchema: unknown | null;
  parametersTemplate: unknown | null;
};

export const isSystemOptimizationRule = (ruleId: string) => {
  return getOptimizationCenterRuleMetas().some((rule) => rule.id === ruleId);
};

export const mapCustomOptimizationRule = (rule: CustomRule) => ({
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
});

export const listOptimizationRules = async (
  fastify: FastifyInstance,
  log: FastifyBaseLogger,
  clientId?: string
) => {
  const systemRules = getOptimizationCenterRuleMetas().map((rule) => ({
    ...rule,
    source: 'system',
  }));

  let customRules: CustomRule[] = [];

  try {
    customRules = await fastify.prisma.optimizationPlaybookRule.findMany({
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    log.warn({ err: error }, 'Optimization playbook rules table not available yet.');
  }

  const mergedById = new Map<string, any>();
  for (const rule of systemRules) mergedById.set(rule.id, rule);
  for (const rule of customRules.map(mapCustomOptimizationRule)) {
    if (!mergedById.has(rule.id)) mergedById.set(rule.id, rule);
  }

  const rules = Array.from(mergedById.values());

  if (!clientId) {
    return rules.map((rule: any) => ({ ...rule, enabled: true, parameters: rule.parametersTemplate ?? {} }));
  }

  const configs = await fastify.prisma.clientRuleConfig.findMany({
    where: {
      clientId,
      campaignId: null,
      ruleProfileId: null,
    },
  });

  return rules.map((rule: any) => {
    const config = configs.find((candidate) => candidate.ruleId === rule.id);
    return {
      ...rule,
      enabled: config ? config.enabled : true,
      parameters: config ? (config.parameters ?? {}) : (rule.parametersTemplate ?? {}),
    };
  });
};
