import type { Pool } from 'pg';

import { getDateRange } from './metrics/date-range';
import { safeFloat, safeInt } from './performance-alert/utils';

export type ZeroConversationsSeverity = 'critical' | 'warning' | 'info';

export type ZeroConversationsCause = {
  code: string;
  title: string;
  description: string;
  action: string;
  severity: ZeroConversationsSeverity;
};

export type ZeroConversationsDiagnostic = {
  clientId: string;
  entity: { type: 'campaign' | 'adset'; id: string; name: string | null };
  period: { start: string; end: string };
  metrics: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    linkClicks: number;
    landingPageViews: number;
    conversations: number;
    leads: number;
    conversions: number;
  };
  objective?: string | null;
  status?: string | null;
  adsetStatusSummary?: {
    total: number;
    active: number;
    paused: number;
    disapproved: number;
    withIssues: number;
    pendingReview: number;
  };
  causes: ZeroConversationsCause[];
  eligible: boolean;
  generatedAt: string;
};

type DiagnosticsQuery = { period?: string; startDate?: string; endDate?: string };

const objectiveConversationSet = new Set([
  'OUTCOME_MESSAGES',
  'MESSAGES',
  'MESSAGE',
  'OUTCOME_LEADS',
  'LEAD_GENERATION',
  'LEADS',
  'CONVERSIONS',
  'OUTCOME_CONVERSIONS',
]);

const objectiveAwarenessSet = new Set([
  'AWARENESS',
  'OUTCOME_AWARENESS',
  'BRAND_AWARENESS',
  'REACH',
  'TRAFFIC',
  'OUTCOME_TRAFFIC',
  'VIDEO_VIEWS',
  'ENGAGEMENT',
  'POST_ENGAGEMENT',
  'PAGE_LIKES',
  'EVENT_RESPONSES',
  'APP_INSTALLS',
  'APP_PROMOTION',
  'CATALOG_SALES',
]);

const normalizeObjective = (value?: string | null) => {
  if (!value) return null;
  return value.trim().toUpperCase();
};

const normalizeStatus = (value?: string | null) => (value ?? '').trim().toLowerCase();

const isStatusMatch = (status: string, patterns: string[]) =>
  patterns.some((pattern) => status.includes(pattern));

const buildSeverity = (spend: number): ZeroConversationsSeverity => {
  if (spend >= 300) return 'critical';
  if (spend >= 100) return 'warning';
  return 'info';
};

const buildCause = (
  input: Omit<ZeroConversationsCause, 'severity'> & { severity?: ZeroConversationsSeverity },
  spend: number
) => ({
  ...input,
  severity: input.severity ?? buildSeverity(spend),
});

const buildAdsetStatusSummary = (rows: Array<{ status: string | null; effective_status: string | null }>) => {
  const summary = {
    total: rows.length,
    active: 0,
    paused: 0,
    disapproved: 0,
    withIssues: 0,
    pendingReview: 0,
  };

  for (const row of rows) {
    const status = normalizeStatus(row.effective_status || row.status);
    if (!status) continue;
    if (status === 'active') summary.active += 1;
    if (status.includes('paused')) summary.paused += 1;
    if (status.includes('disapproved')) summary.disapproved += 1;
    if (isStatusMatch(status, ['with_issues', 'issue', 'error'])) summary.withIssues += 1;
    if (status.includes('pending')) summary.pendingReview += 1;
  }

  return summary;
};

const buildDeliveryCause = (spend: number, impressions: number, reach: number) => {
  if (spend <= 0) return null;
  if (impressions >= 1200 && reach >= 500) return null;

  return buildCause(
    {
      code: 'low_delivery',
      title: 'Entrega baixa para gerar conversas',
      description: `Impressões (${impressions}) e alcance (${reach}) abaixo do necessário para tracionar conversas no período.`,
      action: 'Amplie público, ajuste lances ou orçamento e valide se o conjunto está apto a entregar.',
    },
    spend
  );
};

export class ZeroConversationsDiagnosticService {
  constructor(private pool: Pool) {}

  async diagnoseCampaign(
    clientId: string,
    campaignId: string,
    query: DiagnosticsQuery = {}
  ): Promise<ZeroConversationsDiagnostic | null> {
    const campaignResult = await this.pool.query(
      `SELECT id, name, objective, status
       FROM campaigns
       WHERE id = $1 AND "clientId" = $2`,
      [campaignId, clientId]
    );

    if (campaignResult.rows.length === 0) return null;

    const campaign = campaignResult.rows[0];
    const range = getDateRange(query.period || '7d', query.startDate, query.endDate);

    const metricsResult = await this.pool.query(
      `SELECT
        COALESCE(SUM(cm.spend), 0)::float as spend,
        COALESCE(SUM(cm.impressions), 0)::int as impressions,
        COALESCE(SUM(cm.reach), 0)::int as reach,
        COALESCE(SUM(cm.clicks), 0)::int as clicks,
        COALESCE(SUM(cm.link_clicks), 0)::int as link_clicks,
        COALESCE(SUM(cm.landing_page_views), 0)::int as landing_page_views,
        COALESCE(SUM(cm.messaging_conversations), 0)::int as messaging_conversations,
        COALESCE(SUM(cm.leads), 0)::int as leads,
        COALESCE(SUM(cm.conversions), 0)::int as conversions
       FROM campaign_metrics cm
       WHERE cm.campaign_id = $1
         AND cm.date >= $2
         AND cm.date <= $3`,
      [campaignId, range.start, range.end]
    );

    const metrics = metricsResult.rows[0] ?? {};
    const spend = safeFloat(metrics.spend);
    const impressions = safeInt(metrics.impressions);
    const reach = safeInt(metrics.reach);
    const clicks = safeInt(metrics.clicks);
    const linkClicks = safeInt(metrics.link_clicks);
    const landingPageViews = safeInt(metrics.landing_page_views);
    const messaging = safeInt(metrics.messaging_conversations);
    const leads = safeInt(metrics.leads);
    const conversions = safeInt(metrics.conversions);
    const conversations = messaging > 0 ? messaging : leads > 0 ? leads : conversions;
    const eligible = spend > 0 && conversations === 0;

    const adsetsResult = await this.pool.query(
      `SELECT status, effective_status
       FROM adsets
       WHERE campaign_id = $1`,
      [campaignId]
    );
    const adsetStatusSummary = buildAdsetStatusSummary(adsetsResult.rows ?? []);

    const causes: ZeroConversationsCause[] = [];

    const objective = normalizeObjective(campaign.objective);
    if (objective && !objectiveConversationSet.has(objective) && objectiveAwarenessSet.has(objective)) {
      causes.push(
        buildCause(
          {
            code: 'objective_mismatch',
            title: 'Objetivo da campanha não prioriza conversas',
            description: `Objetivo atual (${campaign.objective}) costuma otimizar para alcance ou tráfego, não para leads/conversas.`,
            action: 'Ajuste o objetivo para Mensagens/Leads/Conversões e revise a otimização de evento.',
          },
          spend
        )
      );
    }

    if ((linkClicks >= 30 || landingPageViews >= 15 || clicks >= 50) && conversations === 0) {
      causes.push(
        buildCause(
          {
            code: 'tracking_missing',
            title: 'Clique sem conversão registrada',
            description: 'Há tráfego relevante, mas nenhum evento de conversa/lead foi registrado no período.',
            action: 'Verifique pixel/Conversions API, evento de conversão e integração com WhatsApp/CRM.',
          },
          spend
        )
      );
    }

    if (adsetStatusSummary.total > 0 && adsetStatusSummary.active === 0) {
      causes.push(
        buildCause(
          {
            code: 'no_active_adsets',
            title: 'Conjuntos sem entrega ativa',
            description: 'Nenhum conjunto está efetivamente ativo para entregar a campanha.',
            action: 'Ative conjuntos ou revise status/reprovações no Gerenciador de Anúncios.',
          },
          spend
        )
      );
    }

    if (adsetStatusSummary.disapproved > 0 || adsetStatusSummary.withIssues > 0 || adsetStatusSummary.pendingReview > 0) {
      causes.push(
        buildCause(
          {
            code: 'adset_issues',
            title: 'Conjuntos com reprovação ou revisão pendente',
            description: 'Há conjuntos com status de reprovação, pendência ou problemas que bloqueiam entrega.',
            action: 'Revise criativos e políticas, corrija itens reprovados e reenvie para aprovação.',
          },
          spend
        )
      );
    }

    const deliveryCause = buildDeliveryCause(spend, impressions, reach);
    if (deliveryCause) causes.push(deliveryCause);

    if (eligible && causes.length === 0) {
      causes.push(
        buildCause(
          {
            code: 'generic_review',
            title: 'Revisão de criativo e público necessária',
            description: 'Não há um sinal técnico claro bloqueando conversas, mas os anúncios não converteram.',
            action: 'Teste novos criativos, ajuste segmentação e valide mensagem/CTA.',
            severity: 'warning',
          },
          spend
        )
      );
    }

    return {
      clientId,
      entity: { type: 'campaign', id: campaign.id, name: campaign.name },
      period: range,
      metrics: {
        spend,
        impressions,
        reach,
        clicks,
        linkClicks,
        landingPageViews,
        conversations,
        leads,
        conversions,
      },
      objective: campaign.objective ?? null,
      status: campaign.status ?? null,
      adsetStatusSummary,
      causes,
      eligible,
      generatedAt: new Date().toISOString(),
    };
  }

  async diagnoseAdset(
    clientId: string,
    adsetId: string,
    query: DiagnosticsQuery = {}
  ): Promise<ZeroConversationsDiagnostic | null> {
    const adsetResult = await this.pool.query(
      `SELECT adset_id, adset_name, status, effective_status, campaign_id
       FROM adsets
       WHERE adset_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [adsetId]
    );

    if (adsetResult.rows.length === 0) return null;
    const adset = adsetResult.rows[0];

    const campaignResult = await this.pool.query(
      `SELECT id, name, objective, status
       FROM campaigns
       WHERE id = $1 AND "clientId" = $2`,
      [adset.campaign_id, clientId]
    );

    if (campaignResult.rows.length === 0) return null;
    const campaign = campaignResult.rows[0];

    const range = getDateRange(query.period || '7d', query.startDate, query.endDate);

    const metricsResult = await this.pool.query(
      `SELECT
        COALESCE(SUM(am.spend), 0)::float as spend,
        COALESCE(SUM(am.impressions), 0)::int as impressions,
        COALESCE(SUM(am.reach), 0)::int as reach,
        COALESCE(SUM(am.clicks), 0)::int as clicks,
        COALESCE(SUM(am.link_clicks), 0)::int as link_clicks,
        COALESCE(SUM(am.landing_page_views), 0)::int as landing_page_views,
        COALESCE(SUM(am.messaging_conversations), 0)::int as messaging_conversations,
        COALESCE(SUM(am.leads), 0)::int as leads,
        COALESCE(SUM(am.conversions), 0)::int as conversions
       FROM adset_metrics am
       WHERE am.adset_id = $1
         AND am.date >= $2
         AND am.date <= $3`,
      [adsetId, range.start, range.end]
    );

    const metrics = metricsResult.rows[0] ?? {};
    const spend = safeFloat(metrics.spend);
    const impressions = safeInt(metrics.impressions);
    const reach = safeInt(metrics.reach);
    const clicks = safeInt(metrics.clicks);
    const linkClicks = safeInt(metrics.link_clicks);
    const landingPageViews = safeInt(metrics.landing_page_views);
    const messaging = safeInt(metrics.messaging_conversations);
    const leads = safeInt(metrics.leads);
    const conversions = safeInt(metrics.conversions);
    const conversations = messaging > 0 ? messaging : leads > 0 ? leads : conversions;
    const eligible = spend > 0 && conversations === 0;

    const adsetStatus = normalizeStatus(adset.effective_status || adset.status);

    const causes: ZeroConversationsCause[] = [];

    const objective = normalizeObjective(campaign.objective);
    if (objective && !objectiveConversationSet.has(objective) && objectiveAwarenessSet.has(objective)) {
      causes.push(
        buildCause(
          {
            code: 'objective_mismatch',
            title: 'Objetivo não está orientado para conversas',
            description: `Campanha está otimizada para ${campaign.objective}. Isso reduz a chance de gerar contatos diretos.`,
            action: 'Considere ajustar o objetivo ou estratégia de otimização.',
          },
          spend
        )
      );
    }

    if ((linkClicks >= 30 || landingPageViews >= 15 || clicks >= 50) && conversations === 0) {
      causes.push(
        buildCause(
          {
            code: 'tracking_missing',
            title: 'Conversões não registradas',
            description: 'Há cliques/visitas, mas nenhum evento de conversa foi contabilizado.',
            action: 'Valide configuração de pixel/Conversões e integração com WhatsApp.',
          },
          spend
        )
      );
    }

    if (adsetStatus && adsetStatus !== 'active') {
      const issueMatch = isStatusMatch(adsetStatus, ['disapproved', 'with_issues', 'pending', 'issue', 'error']);
      if (issueMatch) {
        causes.push(
          buildCause(
            {
              code: 'adset_issues',
              title: 'Conjunto com revisão/reprovação',
              description: `Status atual: ${adsetStatus}. Isso bloqueia ou reduz a entrega.`,
              action: 'Corrija itens reprovados e reenvie para aprovação.',
            },
            spend
          )
        );
      } else if (adsetStatus.includes('paused')) {
        causes.push(
          buildCause(
            {
              code: 'adset_paused',
              title: 'Conjunto pausado',
              description: 'Conjunto está pausado e não entrega anúncios para gerar conversas.',
              action: 'Reative o conjunto ou realoque orçamento para outro ativo.',
            },
            spend
          )
        );
      }
    }

    const deliveryCause = buildDeliveryCause(spend, impressions, reach);
    if (deliveryCause) causes.push(deliveryCause);

    if (eligible && causes.length === 0) {
      causes.push(
        buildCause(
          {
            code: 'generic_review',
            title: 'Revisão de criativo e público necessária',
            description: 'Nenhuma trava técnica detectada, mas o conjunto não converteu.',
            action: 'Teste novos criativos, ajuste segmentação e valide mensagem/CTA.',
            severity: 'warning',
          },
          spend
        )
      );
    }

    return {
      clientId,
      entity: { type: 'adset', id: adset.adset_id, name: adset.adset_name ?? null },
      period: range,
      metrics: {
        spend,
        impressions,
        reach,
        clicks,
        linkClicks,
        landingPageViews,
        conversations,
        leads,
        conversions,
      },
      objective: campaign.objective ?? null,
      status: adset.status ?? null,
      adsetStatusSummary: {
        total: 1,
        active: adsetStatus === 'active' ? 1 : 0,
        paused: adsetStatus.includes('paused') ? 1 : 0,
        disapproved: adsetStatus.includes('disapproved') ? 1 : 0,
        withIssues: isStatusMatch(adsetStatus, ['with_issues', 'issue', 'error']) ? 1 : 0,
        pendingReview: adsetStatus.includes('pending') ? 1 : 0,
      },
      causes,
      eligible,
      generatedAt: new Date().toISOString(),
    };
  }
}
