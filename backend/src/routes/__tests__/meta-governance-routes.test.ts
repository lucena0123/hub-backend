import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import metaGovernanceRoutes from '../meta-governance.routes';

vi.mock('../../middleware/auth', () => ({
  authenticate: async (request: any) => {
    request.user = { id: 'user-1', role: 'admin' };
  },
}));

describe('Meta Governance Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();

    app.register(
      fp(async (fastify: any) => {
        fastify.decorate('services', {
          metaGovernance: {
            listIssues: vi.fn().mockResolvedValue({
              items: [
                {
                  id: 'issue-1',
                  status: 'needs_review',
                  entityType: 'campaign',
                  entityExternalId: '123',
                },
              ],
              total: 1,
            }),
            getIssueById: vi.fn().mockResolvedValue({
              id: 'issue-1',
              status: 'needs_review',
              entityType: 'campaign',
              entityExternalId: '123',
            }),
          },
        });
        fastify.decorate('pool', {});
        fastify.decorate('prisma', {});
      }),
    );

    app.register(metaGovernanceRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists governance issues with filters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/meta-governance/issues?clientId=client-1&status=needs_review&limit=10',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toMatchObject({
      items: [{ id: 'issue-1', status: 'needs_review' }],
      total: 1,
    });
  });

  it('returns a single governance issue', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/meta-governance/issues/issue-1',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toMatchObject({
      id: 'issue-1',
      status: 'needs_review',
      entityType: 'campaign',
    });
  });
});
