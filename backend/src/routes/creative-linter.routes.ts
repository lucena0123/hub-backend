import type { FastifyPluginAsync } from 'fastify';
import { validateCreativeCopy, type CopyValidationInput } from '../services/creative-linter';
import { authenticate } from '../middleware/auth';

const creativeLinterRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  fastify.post<{ Body: CopyValidationInput }>(
    '/api/creative-linter/validate',
    async (request) => {
      const { headline, primaryText, description, ctaType, themeKey } = request.body || {};
      return validateCreativeCopy({ headline, primaryText, description, ctaType, themeKey });
    }
  );
};

export default creativeLinterRoutes;
