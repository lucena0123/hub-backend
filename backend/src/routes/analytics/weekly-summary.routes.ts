import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { getPromptDefinition } from '../../services/ai-prompts';
import { getAiOutputCacheHours, hashAiInput, normalizeAiError } from '../../utils/ai-output';
import { z } from 'zod';
import { zodErrorToReason } from '../../utils/ai-guardrails';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const weeklySummarySchema = z.object({
  summary: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
});

type WeeklySummaryResponse = {
  clientId: string;
  weekStart: string;
  weekEnd: string;
  aiUsed: boolean;
  promptId?: string | null;
  promptVersion?: string | null;
  summary: string;
  highlights: string[];
  concerns: string[];
  nextSteps: string[];
  metricsSnapshot: {
    spend: number;
    conversations: number;
    cpl: number | null;
    spendPrev: number;
    conversationsPrev: number;
    cplPrev: number | null;
    spendChange: number | null;
    conversationsChange: number | null;
    cplChange: number | null;
  };
};

function getWeekBounds(): { weekStart: string; weekEnd: string; prevStart: string; prevEnd: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = day === 0 ? 6 : day - 1;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diffToMon);
  thisMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const prevSunday = new Date(lastMonday);
  prevSunday.setDate(lastMonday.getDate() - 1);

  const prevMonday = new Date(lastMonday);
  prevMonday.setDate(lastMonday.getDate() - 7);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    weekStart: fmt(lastMonday),
    weekEnd: fmt(lastSunday),
    prevStart: fmt(prevMonday),
    prevEnd: fmt(prevSunday),
  };
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

function buildFallbackSummary(
  clientName: string,
  snap: WeeklySummaryResponse['metricsSnapshot'],
  anomalyCount: number,
  proposalsExecuted: number,
): Omit<WeeklySummaryResponse, 'clientId' | 'weekStart' | 'weekEnd' | 'aiUsed' | 'metricsSnapshot'> {
  const highlights: string[] = [];
  const concerns: string[] = [];
  const nextSteps: string[] = [];

  if (snap.conversationsChange !== null && snap.conversationsChange > 0) {
    highlights.push(`Conversas cresceram ${snap.conversationsChange}% em relação à semana anterior.`);
  }
  if (snap.cplChange !== null && snap.cplChange < 0) {
    highlights.push(`CPL reduziu ${Math.abs(snap.cplChange)}%.`);
  }
  if (proposalsExecuted > 0) {
    highlights.push(`${proposalsExecuted} ações de otimização foram executadas.`);
  }

  if (snap.conversationsChange !== null && snap.conversationsChange < -20) {
    concerns.push(`Queda de ${Math.abs(snap.conversationsChange)}% nas conversas.`);
  }
  if (snap.cplChange !== null && snap.cplChange > 20) {
    concerns.push(`CPL subiu ${snap.cplChange}%.`);
  }
  if (anomalyCount > 0) {
    concerns.push(`${anomalyCount} anomalia(s) detectada(s) na semana.`);
  }

  nextSteps.push('Revisar campanhas com CPL acima da meta.');
  if (anomalyCount > 0) nextSteps.push('Investigar anomalias e aplicar correções.');
  nextSteps.push('Avaliar criativos com baixo desempenho para substituição.');

  const summary = `Na semana, ${clientName} investiu R$${snap.spend.toFixed(2)} e gerou ${snap.conversations} conversas` +
    (snap.cpl !== null ? ` com CPL de R$${snap.cpl.toFixed(2)}` : '') +
    `. ${highlights.length > 0 ? highlights[0] : 'Performance estável.'}`;

  return { summary, highlights, concerns, nextSteps };
}

const weeklySummaryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  // POST — generate weekly summary
  fastify.post('/api/clients/:clientId/weekly-summary', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };
    const pool = fastify.pool;
    const aiOutputs = fastify.services.aiOutputs;

    try {
    // 1. Get client name
    const clientRes = await pool.query('SELECT name FROM clients WHERE id = $1', [clientId]);
    if (clientRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Cliente não encontrado' });
    }
    const clientName = clientRes.rows[0].name;

    // 2. Calculate week bounds
    const { weekStart, weekEnd, prevStart, prevEnd } = getWeekBounds();

    // 3. Check if already generated this week
    const existing = await pool.query(
      'SELECT summary, metrics_snapshot, model, prompt_id, prompt_version FROM weekly_summaries WHERE client_id = $1 AND week_start = $2',
      [clientId, weekStart]
    );
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const s = row.summary as any;
      return {
        clientId,
        weekStart,
        weekEnd,
        aiUsed: Boolean(row.model),
        promptId: row.prompt_id ?? null,
        promptVersion: row.prompt_version ?? null,
        summary: s.summary ?? '',
        highlights: s.highlights ?? [],
        concerns: s.concerns ?? [],
        nextSteps: s.nextSteps ?? [],
        metricsSnapshot: row.metrics_snapshot,
      };
    }

    // 4. Load metrics for current and previous week
    const metricsQuery = `
      WITH current_week AS (
        SELECT
          COALESCE(SUM(cm.spend), 0) AS spend,
          COALESCE(SUM(cm.messaging_conversations), 0) AS conversations
        FROM campaign_metrics cm
        JOIN campaigns c ON c.id = cm.campaign_id
        WHERE c."clientId" = $1 AND cm.date >= $2::date AND cm.date <= $3::date
      ),
      prev_week AS (
        SELECT
          COALESCE(SUM(cm.spend), 0) AS spend,
          COALESCE(SUM(cm.messaging_conversations), 0) AS conversations
        FROM campaign_metrics cm
        JOIN campaigns c ON c.id = cm.campaign_id
        WHERE c."clientId" = $1 AND cm.date >= $4::date AND cm.date <= $5::date
      )
      SELECT
        cw.spend, cw.conversations,
        pw.spend AS prev_spend, pw.conversations AS prev_conversations
      FROM current_week cw, prev_week pw
    `;
    const metricsRes = await pool.query(metricsQuery, [clientId, weekStart, weekEnd, prevStart, prevEnd]);
    const m = metricsRes.rows[0];

    const spend = parseFloat(m.spend) || 0;
    const conversations = parseInt(m.conversations, 10) || 0;
    const cpl = conversations > 0 ? spend / conversations : null;
    const spendPrev = parseFloat(m.prev_spend) || 0;
    const conversationsPrev = parseInt(m.prev_conversations, 10) || 0;
    const cplPrev = conversationsPrev > 0 ? spendPrev / conversationsPrev : null;

    const metricsSnapshot = {
      spend,
      conversations,
      cpl,
      spendPrev,
      conversationsPrev,
      cplPrev,
      spendChange: pctChange(spend, spendPrev),
      conversationsChange: pctChange(conversations, conversationsPrev),
      cplChange: cpl !== null && cplPrev !== null ? pctChange(cpl, cplPrev) : null,
    };

    // 5. Load anomalies from the week
    const anomalyRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM anomaly_detections WHERE client_id = $1 AND created_at >= $2::date AND created_at <= ($3::date + interval '1 day')`,
      [clientId, weekStart, weekEnd]
    );
    const anomalyCount = parseInt(anomalyRes.rows[0].cnt, 10) || 0;

    // 6. Load executed proposals from the week
    const proposalsRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM action_proposals WHERE client_id = $1 AND status = 'executed' AND updated_at >= $2::date AND updated_at <= ($3::date + interval '1 day')`,
      [clientId, weekStart, weekEnd]
    );
    const proposalsExecuted = parseInt(proposalsRes.rows[0].cnt, 10) || 0;

    // 7. Try AI summary
    let aiUsed = false;
    let aiModel: string | null = null;
    let summaryContent: { summary: string; highlights: string[]; concerns: string[]; nextSteps: string[] };

    const promptDef = getPromptDefinition('weekly-summary');
    const cacheHours = getAiOutputCacheHours();

    const prompt = promptDef.build({
      clientName,
      weekStart,
      weekEnd,
      spend,
      spendPrev,
      spendChange: metricsSnapshot.spendChange,
      conversations,
      conversationsPrev,
      conversationsChange: metricsSnapshot.conversationsChange,
      cpl,
      cplPrev,
      cplChange: metricsSnapshot.cplChange,
      anomalyCount,
      proposalsExecuted,
    });

    const inputHash = hashAiInput({
      type: 'weekly-summary',
      entityId: clientId,
      model: OPENAI_MODEL,
      promptId: promptDef.id,
      promptVersion: promptDef.version,
      prompt,
    });

    let usedCache = false;
    if (aiOutputs && inputHash) {
      const cached = await aiOutputs.getCachedOutput({
        type: 'weekly-summary',
        inputHash,
        maxAgeHours: cacheHours,
      });
      if (cached?.payload) {
        const cachedParsed = weeklySummarySchema.safeParse(cached.payload);
        if (cachedParsed.success) {
          summaryContent = cachedParsed.data;
          aiUsed = true;
          aiModel = cached.model ?? OPENAI_MODEL;
          usedCache = true;
          await aiOutputs.logOutput({
            type: 'weekly-summary',
            entityId: clientId,
            model: aiModel,
            promptId: promptDef.id,
            promptVersion: promptDef.version,
            status: 'cached',
            payload: summaryContent,
            error: null,
            errorReason: null,
            fallbackUsed: false,
            latencyMs: 0,
            inputHash,
          });
        } else {
          summaryContent = buildFallbackSummary(clientName, metricsSnapshot, anomalyCount, proposalsExecuted);
          await aiOutputs.logOutput({
            type: 'weekly-summary',
            entityId: clientId,
            model: cached.model ?? OPENAI_MODEL,
            promptId: promptDef.id,
            promptVersion: promptDef.version,
            status: 'failed',
            payload: summaryContent,
            error: { reason: 'invalid_cache' },
            errorReason: zodErrorToReason(cachedParsed.error),
            fallbackUsed: true,
            latencyMs: 0,
            inputHash,
          });
        }
      }
    }

    if (!usedCache && OPENAI_API_KEY) {
      try {
        const startedAt = Date.now();

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.5,
          }),
        });

        if (!response.ok) throw new Error(`OpenAI API Error: ${response.status}`);

        const data = (await response.json()) as any;
        const raw = data?.choices?.[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw);
          const normalized = {
            summary: parsed.summary || '',
            highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
            concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
            nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
          };
          const parsedSummary = weeklySummarySchema.safeParse(normalized);
          if (!parsedSummary.success) {
            throw new Error(`Invalid AI response: ${zodErrorToReason(parsedSummary.error)}`);
          }
          summaryContent = parsedSummary.data;
          aiUsed = true;
          aiModel = OPENAI_MODEL;
          if (aiOutputs) {
            await aiOutputs.logOutput({
              type: 'weekly-summary',
              entityId: clientId,
              model: aiModel,
              promptId: promptDef.id,
              promptVersion: promptDef.version,
              status: 'success',
              payload: summaryContent,
              error: null,
              errorReason: null,
              fallbackUsed: false,
              latencyMs: Date.now() - startedAt,
              inputHash,
            });
          }
        } else {
          throw new Error('Empty AI response');
        }
      } catch (err) {
        fastify.log.warn({ err }, 'Weekly summary AI fallback');
        summaryContent = buildFallbackSummary(clientName, metricsSnapshot, anomalyCount, proposalsExecuted);
        if (aiOutputs) {
          await aiOutputs.logOutput({
            type: 'weekly-summary',
            entityId: clientId,
            model: OPENAI_MODEL,
            promptId: promptDef.id,
            promptVersion: promptDef.version,
            status: 'failed',
            payload: summaryContent,
            error: normalizeAiError(err),
            errorReason: zodErrorToReason(err),
            fallbackUsed: true,
            latencyMs: null,
            inputHash,
          });
        }
      }
    } else if (!usedCache) {
      summaryContent = buildFallbackSummary(clientName, metricsSnapshot, anomalyCount, proposalsExecuted);
      if (aiOutputs) {
        await aiOutputs.logOutput({
          type: 'weekly-summary',
          entityId: clientId,
          model: null,
          promptId: promptDef.id,
          promptVersion: promptDef.version,
          status: 'skipped',
          payload: summaryContent,
          error: { reason: 'missing_api_key' },
          errorReason: 'missing_api_key',
          fallbackUsed: true,
          latencyMs: null,
          inputHash,
        });
      }
    }

    // 8. Save to database
    await pool.query(
      `INSERT INTO weekly_summaries (client_id, week_start, week_end, model, prompt_id, prompt_version, summary, metrics_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (client_id, week_start) DO UPDATE SET summary = $7, metrics_snapshot = $8, model = $4, prompt_id = $5, prompt_version = $6`,
      [
        clientId,
        weekStart,
        weekEnd,
        aiModel,
        promptDef.id,
        promptDef.version,
        JSON.stringify(summaryContent),
        JSON.stringify(metricsSnapshot),
      ]
    );

    return {
      clientId,
      weekStart,
      weekEnd,
      aiUsed,
      promptId: promptDef.id,
      promptVersion: promptDef.version,
      ...summaryContent,
      metricsSnapshot,
    } satisfies WeeklySummaryResponse;

    } catch (error) {
      fastify.log.error(error, 'Weekly summary generation failed');
      reply.status(500);
      return { error: 'Failed to generate weekly summary', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // GET — list past summaries
  fastify.get('/api/clients/:clientId/weekly-summaries', async (request) => {
    const { clientId } = request.params as { clientId: string };
    const { limit = '8' } = request.query as { limit?: string };
    const pool = fastify.pool;

    const res = await pool.query(
      `SELECT week_start, week_end, model, prompt_id, prompt_version, summary, metrics_snapshot, created_at
       FROM weekly_summaries
       WHERE client_id = $1
       ORDER BY week_start DESC
       LIMIT $2`,
      [clientId, parseInt(limit, 10)]
    );

    return {
      clientId,
      summaries: res.rows.map((r: any) => ({
        weekStart: r.week_start,
        weekEnd: r.week_end,
        aiUsed: Boolean(r.model),
        promptId: r.prompt_id ?? null,
        promptVersion: r.prompt_version ?? null,
        ...(r.summary as any),
        metricsSnapshot: r.metrics_snapshot,
        createdAt: r.created_at,
      })),
    };
  });
};

export default weeklySummaryRoutes;
