import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.low-variation',
  level: 'creative',
  severity: 'info',
  category: 'creative',
  action: 'review',
  title: 'Poucas variações de criativo',
  description: 'Campanha com poucos criativos ativos ou sem diversidade de CTA.',
  condition: 'active_creatives < 3 OR all_same_cta',
};

export const creativeLowVariationRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const { enrichedCreatives, campaignRows } = ctx;

    // Group active creatives by campaign
    const creativesWithSpend = enrichedCreatives.filter(
      (c: any) => c.metrics.totalSpend > 0 && c.status !== 'loser'
    );

    const byCampaign = new Map<string, any[]>();
    for (const c of creativesWithSpend) {
      const campaigns: string[] = c.campaigns || [];
      for (const camp of campaigns) {
        const list = byCampaign.get(camp) ?? [];
        list.push(c);
        byCampaign.set(camp, list);
      }
    }

    for (const [campName, creatives] of byCampaign) {
      // Find campaign row for ID
      const campRow = campaignRows.find((r: any) => String(r.campaign_name) === campName);
      const campId = campRow ? String(campRow.campaign_id) : campName;

      // Rule 1: Less than 3 active creatives with spend
      if (creatives.length < 3 && creatives.length > 0) {
        items.push({
          id: `creative-low-variation-count-${campId}`,
          ruleId: meta.id,
          severity: 'info',
          category: 'creative',
          action: 'review',
          title: 'Poucos criativos ativos',
          description: `Campanha "${campName}" tem apenas ${creatives.length} criativo(s) com gasto. Adicione 2-3 variações para melhorar a rotação.`,
          theme: toThemeInfo(ctx.primaryTheme),
          entity: { type: 'campaign', id: campId, name: campName },
          metrics: { activeCreatives: creatives.length },
        });
      }

      // Rule 2: All creatives use the same CTA
      if (creatives.length >= 2) {
        const ctaTypes = new Set(creatives.map((c: any) => c.ctaType).filter(Boolean));
        if (ctaTypes.size === 1) {
          const singleCta = [...ctaTypes][0];
          items.push({
            id: `creative-low-variation-cta-${campId}`,
            ruleId: meta.id,
            severity: 'info',
            category: 'creative',
            action: 'review',
            title: 'Sem diversidade de CTA',
            description: `Todos os ${creatives.length} criativos em "${campName}" usam o mesmo CTA (${singleCta}). Teste pelo menos uma alternativa.`,
            theme: toThemeInfo(ctx.primaryTheme),
            entity: { type: 'campaign', id: campId, name: campName },
            metrics: { ctaType: singleCta, creativeCount: creatives.length },
          });
        }
      }
    }

    return items;
  },
};
