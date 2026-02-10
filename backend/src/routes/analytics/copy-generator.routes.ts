import 'dotenv/config';
import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { toIsoDateUtc, shiftIsoDateUtc, toStringArray } from '../../utils';
import { scoreCreatives } from './optimization-center/creative-scoring';
import {
  getOptimizationTargetsForTheme,
  resolveOptimizationTheme,
} from '../../services/optimization-playbook';
import { getPromptDefinition } from '../../services/ai-prompts';
import { getAiOutputCacheHours, hashAiInput, normalizeAiError } from '../../utils/ai-output';
import { z } from 'zod';
import { zodErrorToReason } from '../../utils/ai-guardrails';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const copySuggestionSchema = z.object({
  headline: z.string().min(1),
  primaryText: z.string().min(1),
  cta: z.string().min(1),
  angle: z.string().min(1),
});
const copySuggestionsSchema = z.array(copySuggestionSchema).min(1);

type CopySuggestion = {
  headline: string;
  primaryText: string;
  cta: string;
  angle: string;
};

type CopyGeneratorResponse = {
  clientId: string;
  themeKey: string;
  themeName: string;
  aiUsed: boolean;
  promptId: string;
  promptVersion: string;
  suggestions: CopySuggestion[];
  winnerContext: { count: number; avgCpl: number | null; topHeadlines: string[] };
};

const FALLBACK_SUGGESTIONS: Record<string, CopySuggestion[]> = {
  trabalhista: [
    { headline: 'Seus direitos trabalhistas podem estar sendo violados', primaryText: 'Conte rapidamente o que aconteceu e receba uma orientação inicial pelo WhatsApp.', cta: 'WHATSAPP_MESSAGE', angle: 'dor' },
    { headline: 'Foi demitido(a)? Entenda seus direitos agora', primaryText: 'Se você acha que seus direitos foram desrespeitados, fale com um advogado e entenda os próximos passos.', cta: 'WHATSAPP_MESSAGE', angle: 'urgência' },
    { headline: 'Rescisão indireta: saiba quando se aplica', primaryText: 'Atendimento direto e humano. Envie sua dúvida e veja quais documentos podem ajudar no seu caso.', cta: 'SEND_MESSAGE', angle: 'informativo' },
    { headline: 'Não recebeu suas verbas rescisórias?', primaryText: 'Milhares de trabalhadores deixam de cobrar seus direitos. Saiba se você tem algo a receber.', cta: 'WHATSAPP_MESSAGE', angle: 'prova social' },
    { headline: 'Converse com um advogado trabalhista agora', primaryText: 'Orientação inicial gratuita pelo WhatsApp. Tire suas dúvidas em poucos minutos.', cta: 'WHATSAPP_MESSAGE', angle: 'benefício' },
  ],
  passageiro_aereo: [
    { headline: 'Voo cancelado ou atrasado? Saiba o que fazer', primaryText: 'Atraso, cancelamento ou problemas na viagem? Envie uma mensagem e entenda seus direitos.', cta: 'WHATSAPP_MESSAGE', angle: 'urgência' },
    { headline: 'Bagagem extraviada? Você pode ter direito a indenização', primaryText: 'Conte o que aconteceu com seu voo e receba uma orientação inicial pelo WhatsApp.', cta: 'WHATSAPP_MESSAGE', angle: 'dor' },
    { headline: 'Passageiro aéreo: seus direitos vão além do que imagina', primaryText: 'Atendimento direto e objetivo: avaliamos seu caso e orientamos os próximos passos.', cta: 'SEND_MESSAGE', angle: 'informativo' },
    { headline: 'Problemas com companhia aérea? Fale conosco', primaryText: 'Já ajudamos milhares de passageiros a receber indenizações. Veja se o seu caso se aplica.', cta: 'WHATSAPP_MESSAGE', angle: 'prova social' },
    { headline: 'Indenização por voo: avaliação pelo WhatsApp', primaryText: 'Envie os dados do seu voo e saiba em minutos se você tem direito a indenização.', cta: 'WHATSAPP_MESSAGE', angle: 'benefício' },
  ],
  salario_maternidade: [
    { headline: 'Salário maternidade: veja se você tem direito', primaryText: 'Dúvidas sobre salário maternidade? Envie uma mensagem e entenda se você tem direito.', cta: 'WHATSAPP_MESSAGE', angle: 'informativo' },
    { headline: 'Gestante ou mãe recente? Conheça seus direitos', primaryText: 'Conte sua situação e receba uma orientação inicial pelo WhatsApp.', cta: 'WHATSAPP_MESSAGE', angle: 'benefício' },
    { headline: 'Salário maternidade negado? Saiba o que fazer', primaryText: 'Atendimento direto e humano. Ajudamos você a entender o que é necessário para o seu caso.', cta: 'SEND_MESSAGE', angle: 'dor' },
    { headline: 'Você pode ter direito a salário maternidade', primaryText: 'Muitas mães não sabem que têm direito. Tire suas dúvidas agora pelo WhatsApp.', cta: 'WHATSAPP_MESSAGE', angle: 'prova social' },
    { headline: 'Orientação sobre maternidade pelo WhatsApp', primaryText: 'Fale com um advogado especialista e entenda seus direitos em poucos minutos.', cta: 'WHATSAPP_MESSAGE', angle: 'urgência' },
  ],
  geral: [
    { headline: 'Entenda seus direitos: orientação pelo WhatsApp', primaryText: 'Envie uma mensagem e entenda seus direitos com uma orientação inicial.', cta: 'WHATSAPP_MESSAGE', angle: 'informativo' },
    { headline: 'Converse com um advogado agora', primaryText: 'Atendimento direto e humano. Conte sua dúvida e saiba os próximos passos.', cta: 'WHATSAPP_MESSAGE', angle: 'urgência' },
    { headline: 'Tire suas dúvidas jurídicas no WhatsApp', primaryText: 'Quer entender seu caso? Fale com um advogado pelo WhatsApp.', cta: 'WHATSAPP_MESSAGE', angle: 'benefício' },
    { headline: 'Seus direitos podem estar sendo ignorados', primaryText: 'Muitas pessoas deixam de buscar orientação. Não cometa o mesmo erro.', cta: 'SEND_MESSAGE', angle: 'dor' },
    { headline: 'Orientação jurídica rápida e direta', primaryText: 'Fale com um advogado e receba uma análise inicial do seu caso.', cta: 'WHATSAPP_MESSAGE', angle: 'prova social' },
  ],
};

const copyGeneratorRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  fastify.post('/api/clients/:clientId/copy-suggestions', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };
    const { themeKey: inputThemeKey, count = 5 } = (request.body || {}) as {
      themeKey?: string;
      campaignId?: string;
      count?: number;
    };

    const suggestCount = Math.min(Math.max(count, 3), 10);

    try {
      const analytics = fastify.services.analytics;
      const aiOutputs = fastify.services.aiOutputs;
      const promptDef = getPromptDefinition('copy-generator');
      const cacheHours = getAiOutputCacheHours();

      // Load winners for context
      const end = toIsoDateUtc(new Date());
      const start = toIsoDateUtc(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
      const endMinus6 = shiftIsoDateUtc(end, -6);
      const endMinus13 = shiftIsoDateUtc(end, -13);

      let clientTargetOverrides: Record<string, unknown> | null = null;
      try {
        clientTargetOverrides = await analytics.getClientOptimizationTargets(clientId);
      } catch (_) {}

      const creativeRows = await analytics.getCreativeLibraryStats(
        clientId, start, end, endMinus6, endMinus13
      );

      // Determine theme
      const primaryRow = creativeRows.length > 0 ? (creativeRows[0] as any) : null;
      const primaryName = primaryRow ? String(primaryRow.campaigns?.[0] || '') : '';
      const primaryThemeKey = primaryRow ? (toStringArray(primaryRow.optimization_theme_keys)?.[0] ?? null) : null;
      const primarySubthemeKey = primaryRow ? (toStringArray(primaryRow.optimization_subtheme_keys)?.[0] ?? null) : null;

      const theme = inputThemeKey
        ? resolveOptimizationTheme({ campaignName: primaryName, themeKey: inputThemeKey })
        : resolveOptimizationTheme({ campaignName: primaryName, themeKey: primaryThemeKey, subthemeKey: primarySubthemeKey });
      const targets = getOptimizationTargetsForTheme(theme.themeKey, clientTargetOverrides);

      // Score creatives and get winners
      let topWinners: { headline: string | null; primaryText: string | null; ctaType: string | null; cpl: number | null }[] = [];

      if (creativeRows.length > 0) {
        const creatives = creativeRows.map((row: any) => {
          const totalSpend = parseFloat(row.total_spend) || 0;
          const totalConversations = parseInt(row.total_conversations) || 0;
          const cpl = totalConversations > 0 ? totalSpend / totalConversations : null;
          const spendLast7 = parseFloat(row.spend_last7) || 0;
          const convLast7 = parseInt(row.conv_last7) || 0;
          const cplLast7 = convLast7 > 0 ? spendLast7 / convLast7 : null;
          const spendPrev7 = parseFloat(row.spend_prev7) || 0;
          const convPrev7 = parseInt(row.conv_prev7) || 0;
          const cplPrev7 = convPrev7 > 0 ? spendPrev7 / convPrev7 : null;

          return {
            snapshotId: String(row.creative_snapshot_id),
            headline: row.headline || null,
            primaryText: row.primary_text || null,
            description: row.description || null,
            ctaType: row.cta_type || null,
            imageUrl: row.image_url || null,
            thumbnailUrl: row.thumbnail_url || null,
            campaigns: toStringArray(row.campaigns),
            adNames: toStringArray(row.ad_names),
            metrics: { totalSpend, totalConversations, cpl },
            recent: { spend: spendLast7, conversations: convLast7, cpl: cplLast7 },
            previous: { spend: spendPrev7, conversations: convPrev7, cpl: cplPrev7 },
            deltas: {
              conversationsPct: convPrev7 > 0 ? ((convLast7 - convPrev7) / convPrev7) * 100 : null,
              cplPct: cplPrev7 && cplLast7 ? ((cplLast7 - cplPrev7) / cplPrev7) * 100 : null,
            },
          };
        });

        const { enrichedCreatives } = scoreCreatives(creatives, targets);
        topWinners = enrichedCreatives
          .filter((c: any) => c.status === 'winner' && c.metrics.totalConversations >= 3)
          .sort((a: any, b: any) => (a.metrics.cpl ?? Infinity) - (b.metrics.cpl ?? Infinity))
          .slice(0, 5)
          .map((c: any) => ({
            headline: c.headline,
            primaryText: c.primaryText,
            ctaType: c.ctaType,
            cpl: c.metrics.cpl,
          }));
      }

      const winnerContext = {
        count: topWinners.length,
        avgCpl: topWinners.length > 0
          ? topWinners.reduce((s: number, w) => s + (w.cpl ?? 0), 0) / topWinners.filter(w => w.cpl != null).length
          : null,
        topHeadlines: topWinners.map(w => w.headline).filter(Boolean) as string[],
      };

      // Try OpenAI generation
      let suggestions: CopySuggestion[];
      let aiUsed = false;
      let aiModel: string | null = null;
      let usedCache = false;

      const prompt = promptDef.build({
        themeKey: theme.themeKey,
        themeName: theme.themeName,
        winners: topWinners,
        count: suggestCount,
      });

      const inputHash = hashAiInput({
        type: 'copy-generator',
        entityId: clientId,
        model: OPENAI_MODEL,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
        prompt,
      });

      if (aiOutputs && inputHash) {
        const cached = await aiOutputs.getCachedOutput({
          type: 'copy-generator',
          inputHash,
          maxAgeHours: cacheHours,
        });
        if (cached?.payload) {
          const payload = cached.payload as any;
          const cachedSuggestions = payload?.suggestions;
          const parsedCached = copySuggestionsSchema.safeParse(cachedSuggestions);
          if (parsedCached.success) {
            suggestions = parsedCached.data;
            if (payload?.winnerContext) {
              Object.assign(winnerContext, payload.winnerContext);
            }
            aiUsed = true;
            aiModel = cached.model ?? OPENAI_MODEL;
            usedCache = true;
            await aiOutputs.logOutput({
              type: 'copy-generator',
              entityId: clientId,
              model: aiModel,
              promptId: promptDef.id,
              promptVersion: promptDef.version,
              status: 'cached',
              payload: { suggestions, winnerContext },
              error: null,
              errorReason: null,
              fallbackUsed: false,
              latencyMs: 0,
              inputHash,
            });
          } else {
            suggestions = (FALLBACK_SUGGESTIONS[theme.themeKey] || FALLBACK_SUGGESTIONS.geral).slice(0, suggestCount);
            await aiOutputs.logOutput({
              type: 'copy-generator',
              entityId: clientId,
              model: cached.model ?? OPENAI_MODEL,
              promptId: promptDef.id,
              promptVersion: promptDef.version,
              status: 'failed',
              payload: { suggestions, winnerContext },
              error: { reason: 'invalid_cache' },
              errorReason: zodErrorToReason(parsedCached.error),
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
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            throw new Error(`OpenAI API Error: ${response.status}`);
          }

          const data = (await response.json()) as any;
          const raw = data?.choices?.[0]?.message?.content;
          if (!raw) throw new Error('Empty OpenAI response');

          const parsed = JSON.parse(raw);
          const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

          suggestions = rawSuggestions
            .filter((s: any) => s.headline && s.primaryText)
            .map((s: any) => ({
              headline: String(s.headline).slice(0, 60),
              primaryText: String(s.primaryText).slice(0, 500),
              cta: String(s.cta || 'WHATSAPP_MESSAGE'),
              angle: String(s.angle || 'geral'),
            }));

          const parsedSuggestions = copySuggestionsSchema.safeParse(suggestions);
          if (!parsedSuggestions.success) {
            throw new Error(`Invalid AI response: ${zodErrorToReason(parsedSuggestions.error)}`);
          }
          suggestions = parsedSuggestions.data;
          aiUsed = true;
          aiModel = OPENAI_MODEL;
          if (aiOutputs) {
            await aiOutputs.logOutput({
              type: 'copy-generator',
              entityId: clientId,
              model: aiModel,
              promptId: promptDef.id,
              promptVersion: promptDef.version,
              status: 'success',
              payload: { suggestions, winnerContext },
              error: null,
              errorReason: null,
              fallbackUsed: false,
              latencyMs: Date.now() - startedAt,
              inputHash,
            });
          }
        } catch (error) {
          fastify.log.warn({ error }, 'OpenAI copy generation failed, using fallback');
          suggestions = (FALLBACK_SUGGESTIONS[theme.themeKey] || FALLBACK_SUGGESTIONS.geral).slice(0, suggestCount);
          if (aiOutputs) {
            await aiOutputs.logOutput({
              type: 'copy-generator',
              entityId: clientId,
              model: OPENAI_MODEL,
              promptId: promptDef.id,
              promptVersion: promptDef.version,
              status: 'failed',
              payload: { suggestions, winnerContext },
              error: normalizeAiError(error),
              errorReason: zodErrorToReason(error),
              fallbackUsed: true,
              latencyMs: null,
              inputHash,
            });
          }
        }
      } else if (!usedCache) {
        suggestions = (FALLBACK_SUGGESTIONS[theme.themeKey] || FALLBACK_SUGGESTIONS.geral).slice(0, suggestCount);
        if (aiOutputs) {
          await aiOutputs.logOutput({
            type: 'copy-generator',
            entityId: clientId,
            model: null,
            promptId: promptDef.id,
            promptVersion: promptDef.version,
            status: 'skipped',
            payload: { suggestions, winnerContext },
            error: { reason: 'missing_api_key' },
            errorReason: 'missing_api_key',
            fallbackUsed: true,
            latencyMs: null,
            inputHash,
          });
        }
      }

      // Save to history
      try {
        const id = `cg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await fastify.pool.query(
          `INSERT INTO ai_copy_suggestions (id, client_id, theme_key, model, prompt_id, prompt_version, suggestions, winner_context)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            id,
            clientId,
            theme.themeKey,
            aiModel,
            promptDef.id,
            promptDef.version,
            JSON.stringify(suggestions),
            JSON.stringify(winnerContext),
          ]
        );
      } catch (saveError) {
        fastify.log.warn({ error: saveError }, 'Failed to save copy suggestions to history');
      }

      const result: CopyGeneratorResponse = {
        clientId,
        themeKey: theme.themeKey,
        themeName: theme.themeName,
        aiUsed,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
        suggestions,
        winnerContext,
      };

      return result;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to generate copy suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default copyGeneratorRoutes;
