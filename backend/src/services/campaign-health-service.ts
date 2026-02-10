import type { Pool } from 'pg';
import {
  resolveOptimizationTheme,
  getOptimizationTargetsForTheme,
} from './optimization-playbook';

export type HealthFactor = {
  name: string;
  score: number;
  weight: number;
  weighted: number;
  detail: string;
};

export type CampaignHealthResult = {
  campaignId: string;
  campaignName: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: HealthFactor[];
  recommendation: string;
};

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function buildRecommendation(factors: HealthFactor[], grade: string, campaignName: string): string {
  const worst = [...factors].sort((a, b) => a.score - b.score);
  const weakest = worst[0];

  if (grade === 'A') return `"${campaignName}" está com excelente performance. Mantenha o ritmo e monitore a frequência.`;
  if (grade === 'B') return `"${campaignName}" está bem. Melhore "${weakest.name}" para subir para nota A.`;

  const top2 = worst.slice(0, 2).map(f => f.name).join(' e ');
  return `"${campaignName}" precisa de atenção em ${top2}. ${weakest.detail}`;
}

export class CampaignHealthService {
  constructor(private pool: Pool) {}

  async getHealthScores(clientId: string, campaignId?: string): Promise<CampaignHealthResult[]> {
    // Get campaign metrics: last 7d and previous 7d
    const result = await this.pool.query(
      `SELECT
        cm.campaign_id,
        c.name as campaign_name,
        c.optimization_theme_key as optimization_theme_key,
        c.optimization_subtheme_key as optimization_subtheme_key,
        COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.spend ELSE 0 END), 0)::float as spend_7d,
        COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.messaging_conversations ELSE 0 END), 0)::int as conv_7d,
        COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '14 days' AND cm.date < CURRENT_DATE - INTERVAL '7 days' THEN cm.messaging_conversations ELSE 0 END), 0)::int as conv_prev7d,
        COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.impressions ELSE 0 END), 0)::int as impressions_7d,
        COALESCE(SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.reach ELSE 0 END), 0)::int as reach_7d,
        COALESCE(AVG(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.frequency ELSE NULL END), 0)::float as avg_frequency,
        COALESCE(SUM(cm.spend), 0)::float as spend_total,
        c.budget as client_budget
      FROM campaign_metrics cm
      JOIN campaigns c ON c.id = cm.campaign_id
      WHERE c."clientId" = $1
        AND cm.date >= CURRENT_DATE - INTERVAL '30 days'
        ${campaignId ? 'AND cm.campaign_id = $2' : ''}
      GROUP BY cm.campaign_id, c.name, c.budget, c.optimization_theme_key, c.optimization_subtheme_key
      HAVING SUM(CASE WHEN cm.date >= CURRENT_DATE - INTERVAL '7 days' THEN cm.spend ELSE 0 END) > 0`,
      campaignId ? [clientId, campaignId] : [clientId]
    );

    // Get creative counts per campaign
    const creativeResult = await this.pool.query(
      `SELECT acm.campaign_id, COUNT(DISTINCT acm.ad_id)::int as active_ads
       FROM ad_creative_metrics acm
       JOIN campaigns c ON c.id = acm.campaign_id
       WHERE c."clientId" = $1
         AND acm.date >= CURRENT_DATE - INTERVAL '7 days'
         ${campaignId ? 'AND acm.campaign_id = $2' : ''}
       GROUP BY acm.campaign_id`,
      campaignId ? [clientId, campaignId] : [clientId]
    );

    const creativeMap = new Map<string, number>();
    for (const row of creativeResult.rows) {
      creativeMap.set(row.campaign_id, row.active_ads);
    }

    // Get lead qualification rates
    const leadResult = await this.pool.query(
      `SELECT campaign_id,
              COALESCE(SUM(leads_responded), 0)::int as total_leads,
              COALESCE(SUM(qualified_leads), 0)::int as qualified_leads
       FROM campaign_lead_tracking
       WHERE campaign_id = ANY(SELECT id FROM campaigns WHERE "clientId" = $1)
         AND date >= CURRENT_DATE - INTERVAL '14 days'
       GROUP BY campaign_id`,
      [clientId]
    );

    const leadMap = new Map<string, { total: number; qualified: number }>();
    for (const row of leadResult.rows) {
      leadMap.set(row.campaign_id, {
        total: row.total_leads || 0,
        qualified: row.qualified_leads || 0,
      });
    }

    const results: CampaignHealthResult[] = [];

    for (const row of result.rows) {
      const theme = resolveOptimizationTheme({
        campaignName: row.campaign_name,
        themeKey: row.optimization_theme_key ?? null,
        subthemeKey: row.optimization_subtheme_key ?? null,
      });
      const targets = getOptimizationTargetsForTheme(theme.themeKey, null);

      const factors: HealthFactor[] = [];

      // 1. CPL vs Target (30%)
      const cpl7d = row.conv_7d > 0 ? row.spend_7d / row.conv_7d : null;
      let cplScore = 0;
      let cplDetail = 'Sem conversas suficientes para avaliar CPL';
      if (cpl7d != null) {
        if (cpl7d <= targets.targetCplGoodMax) {
          cplScore = 100;
          cplDetail = `CPL R$ ${cpl7d.toFixed(2)} dentro do ideal (≤ R$ ${targets.targetCplGoodMax})`;
        } else if (cpl7d <= targets.targetCplOkMax) {
          cplScore = 60;
          cplDetail = `CPL R$ ${cpl7d.toFixed(2)} aceitável (≤ R$ ${targets.targetCplOkMax})`;
        } else {
          cplScore = Math.max(0, 30 - Math.floor((cpl7d - targets.targetCplBadMin) / 5) * 10);
          cplDetail = `CPL R$ ${cpl7d.toFixed(2)} acima do alvo. Revise criativos e audiência.`;
        }
      }
      factors.push({ name: 'CPL', score: cplScore, weight: 0.3, weighted: cplScore * 0.3, detail: cplDetail });

      // 2. Trend (20%)
      let trendScore = 60;
      let trendDetail = 'Sem dados suficientes para avaliar tendência';
      if (row.conv_prev7d > 0) {
        const changePct = ((row.conv_7d - row.conv_prev7d) / row.conv_prev7d) * 100;
        if (changePct >= 10) {
          trendScore = 100;
          trendDetail = `Conversas crescendo ${changePct.toFixed(0)}% WoW`;
        } else if (changePct >= -10) {
          trendScore = 60;
          trendDetail = `Conversas estáveis (${changePct > 0 ? '+' : ''}${changePct.toFixed(0)}% WoW)`;
        } else {
          trendScore = Math.max(0, 40 + Math.floor(changePct / 5) * 5);
          trendDetail = `Conversas caindo ${Math.abs(changePct).toFixed(0)}% WoW. Investigue a causa.`;
        }
      }
      factors.push({ name: 'Tendência', score: trendScore, weight: 0.2, weighted: trendScore * 0.2, detail: trendDetail });

      // 3. Creative Variety (15%)
      const activeAds = creativeMap.get(row.campaign_id) || 0;
      let creativeScore = 20;
      let creativeDetail = `${activeAds} criativo(s) ativo(s). Adicione variações.`;
      if (activeAds >= 4) {
        creativeScore = 100;
        creativeDetail = `${activeAds} criativos ativos — boa rotação`;
      } else if (activeAds >= 2) {
        creativeScore = 60;
        creativeDetail = `${activeAds} criativos ativos. Ideal seria 4+.`;
      }
      factors.push({ name: 'Criativos', score: creativeScore, weight: 0.15, weighted: creativeScore * 0.15, detail: creativeDetail });

      // 4. Frequency (15%)
      const freq = row.avg_frequency || 0;
      let freqScore = 100;
      let freqDetail = `Frequência ${freq.toFixed(1)} — saudável`;
      if (freq > 4.5) {
        freqScore = 20;
        freqDetail = `Frequência ${freq.toFixed(1)} — muito alta, público saturado`;
      } else if (freq > 3) {
        freqScore = 60;
        freqDetail = `Frequência ${freq.toFixed(1)} — atenção, aumentando`;
      }
      factors.push({ name: 'Frequência', score: freqScore, weight: 0.15, weighted: freqScore * 0.15, detail: freqDetail });

      // 5. Budget Pacing (10%)
      const clientBudget = parseFloat(row.client_budget) || 0;
      let pacingScore = 60;
      let pacingDetail = 'Sem orçamento definido para avaliar pacing';
      if (clientBudget > 0) {
        const daysInMonth = 30;
        const expectedDailyBudget = clientBudget / daysInMonth;
        const actualDaily = row.spend_7d / 7;
        const utilization = (actualDaily / expectedDailyBudget) * 100;
        if (utilization >= 80 && utilization <= 100) {
          pacingScore = 100;
          pacingDetail = `Pacing ${utilization.toFixed(0)}% — no ritmo ideal`;
        } else if (utilization >= 60 && utilization <= 110) {
          pacingScore = 60;
          pacingDetail = `Pacing ${utilization.toFixed(0)}% — aceitável`;
        } else {
          pacingScore = 20;
          pacingDetail = utilization > 110
            ? `Pacing ${utilization.toFixed(0)}% — gastando acima do orçamento`
            : `Pacing ${utilization.toFixed(0)}% — subinvestindo`;
        }
      }
      factors.push({ name: 'Pacing', score: pacingScore, weight: 0.1, weighted: pacingScore * 0.1, detail: pacingDetail });

      // 6. Lead Qualification (10%)
      const leads = leadMap.get(row.campaign_id);
      let qualScore = 60;
      let qualDetail = 'Sem dados de qualificação de leads';
      if (leads && leads.total > 0) {
        const qualRate = (leads.qualified / leads.total) * 100;
        if (qualRate >= 50) {
          qualScore = 100;
          qualDetail = `${qualRate.toFixed(0)}% dos leads qualificados — excelente`;
        } else if (qualRate >= 25) {
          qualScore = 60;
          qualDetail = `${qualRate.toFixed(0)}% dos leads qualificados — aceitável`;
        } else {
          qualScore = 20;
          qualDetail = `${qualRate.toFixed(0)}% dos leads qualificados — revise o público-alvo`;
        }
      }
      factors.push({ name: 'Qualificação', score: qualScore, weight: 0.1, weighted: qualScore * 0.1, detail: qualDetail });

      const totalScore = Math.round(factors.reduce((s, f) => s + f.weighted, 0));
      const grade = scoreToGrade(totalScore);
      const recommendation = buildRecommendation(factors, grade, row.campaign_name);

      results.push({
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        score: totalScore,
        grade,
        factors,
        recommendation,
      });
    }

    return results.sort((a, b) => a.score - b.score);
  }
}
