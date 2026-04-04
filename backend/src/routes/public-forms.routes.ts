/**
 * Public Forms Routes
 *
 * Endpoints acessíveis sem autenticação JWT — o token do formulário
 * (gerado no momento da criação do lead) serve como credencial.
 *
 * Rotas:
 *   GET  /api/public/forms/meta   → retorna nome do escritório para exibir no form
 *   POST /api/public/forms/submit → grava o payload do formulário preenchido pelo cliente
 */

import { FastifyPluginAsync } from 'fastify';
import { CommercialFlowError } from '../services/commercial-leads-service';

const publicFormsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify as any;
  const { commercialLeads } = fastify.services;

  /**
   * GET /api/public/forms/meta
   * Retorna dados mínimos do lead para pré-preencher/identificar o formulário.
   * Requer: ?token=xxx&leadId=yyy
   */
  fastify.get<{
    Querystring: { token?: string; leadId?: string };
  }>('/api/public/forms/meta', async (request, reply) => {
    const { token, leadId } = request.query;

    if (!token || !leadId) {
      reply.status(400);
      return { error: 'INVALID_PARAMS', message: 'token e leadId são obrigatórios.' };
    }

    const result = await pool.query(
      `SELECT lead_id, nome_escritorio, responsavel, form_type, form_submitted_at
       FROM commercial_leads
       WHERE lead_id = $1 AND form_token = $2
       LIMIT 1`,
      [leadId, token],
    );

    if (!result.rows[0]) {
      reply.status(404);
      return { error: 'NOT_FOUND', message: 'Link inválido ou expirado.' };
    }

    const row = result.rows[0];
    return {
      leadId: row.lead_id,
      nomeEscritorio: row.nome_escritorio,
      responsavel: row.responsavel,
      alreadySubmitted: Boolean(row.form_submitted_at),
      submittedAt: row.form_submitted_at || null,
    };
  });

  /**
   * POST /api/public/forms/submit
   * Grava o briefing preenchido pelo cliente.
   * Autentica via token do formulário (não requer JWT).
   */
  fastify.post<{
    Body: {
      token: string;
      leadId: string;
      formType: 'briefing' | 'onboarding' | 'custom';
      payload: Record<string, unknown>;
    };
  }>('/api/public/forms/submit', async (request, reply) => {
    const { token, leadId, formType, payload } = request.body;

    if (!token || !leadId || !formType || !payload) {
      reply.status(400);
      return { error: 'INVALID_PARAMS', message: 'token, leadId, formType e payload são obrigatórios.' };
    }

    // Validate token against database
    const existing = await pool.query(
      `SELECT lead_id, form_token, form_submitted_at
       FROM commercial_leads
       WHERE lead_id = $1 AND form_token = $2
       LIMIT 1`,
      [leadId, token],
    );

    if (!existing.rows[0]) {
      reply.status(403);
      return { error: 'INVALID_TOKEN', message: 'Link inválido ou expirado.' };
    }

    try {
      const submittedAt = new Date().toISOString();
      await commercialLeads.submitLeadForm(leadId, {
        formType,
        payload,
        submittedAt,
      });

      return {
        ok: true,
        leadId,
        formType,
        submittedAt,
      };
    } catch (error) {
      if (error instanceof CommercialFlowError) {
        reply.status(error.code === 'NOT_FOUND' ? 404 : 400);
        return { error: error.code, message: error.message, details: error.details };
      }
      fastify.log.error({ error }, '[public-forms] form submission failed');
      reply.status(500);
      return { error: 'INTERNAL_ERROR', message: 'Falha ao registrar formulário.' };
    }
  });
};

export default publicFormsRoutes;
