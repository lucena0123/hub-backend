import { FastifyPluginAsync } from 'fastify';
import { OPTIMIZATION_CENTER_PLAYBOOK_V1 } from '../../services/optimization-playbook';

const playbookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/playbooks/optimization-center', async () => {
    let customRules: Array<{
      id: string;
      title: string;
      description: string;
      condition: string;
      level: string;
      severity: string;
      category: string;
      action: string;
    }> = [];

    try {
      customRules = await fastify.prisma.optimizationPlaybookRule.findMany({
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      fastify.log.warn({ err: error }, 'Optimization playbook rules table not available yet.');
    }

    const customRuleMetas = customRules.map((rule) => ({
      id: rule.id,
      level: rule.level as any,
      severity: rule.severity as any,
      category: rule.category as any,
      action: rule.action as any,
      title: rule.title,
      description: rule.description,
      condition: rule.condition,
    }));

    return {
      ...OPTIMIZATION_CENTER_PLAYBOOK_V1,
      rules: [...OPTIMIZATION_CENTER_PLAYBOOK_V1.rules, ...customRuleMetas],
    };
  });
};

export default playbookRoutes;
