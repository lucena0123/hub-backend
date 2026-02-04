import { FastifyPluginAsync } from 'fastify';
import { OPTIMIZATION_CENTER_PLAYBOOK_V1 } from '../../services/optimization-playbook';

const playbookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/playbooks/optimization-center', async () => {
    return OPTIMIZATION_CENTER_PLAYBOOK_V1;
  });
};

export default playbookRoutes;

