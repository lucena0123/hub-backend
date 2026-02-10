import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'structure.single-creative',
  level: 'adset',
  severity: 'info',
  category: 'creative',
  action: 'review',
  title: 'Conjunto sem rotação de criativos',
  description: 'Adset com apenas 1 criativo ativo, sem rotação possível.',
  condition: 'adset_active_creatives == 1',
};

export const structureSingleCreativeRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const { adsetRows, campaignRows } = ctx;

    if (!adsetRows || adsetRows.length === 0) return items;

    for (const adset of adsetRows) {
      const spend = parseFloat(adset.spend_total) || 0;
      if (spend <= 0) continue;

      const adCount = parseInt(adset.ad_count) || 1;
      if (adCount > 1) continue;

      const adsetName = String(adset.adset_name || adset.adset_id);
      const campaignId = String(adset.campaign_id);
      const campRow = campaignRows.find((r: any) => String(r.campaign_id) === campaignId);
      const campName = campRow ? String(campRow.campaign_name) : campaignId;

      items.push({
        id: `structure-single-creative-${adset.adset_id}`,
        ruleId: meta.id,
        severity: 'info',
        category: 'creative',
        action: 'review',
        title: 'Sem rotação de criativos',
        description: `Conjunto "${adsetName}" em "${campName}" tem apenas 1 anúncio ativo. Adicione 2-3 variações para melhorar a otimização.`,
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'adset', id: String(adset.adset_id), name: adsetName },
        metrics: { adCount, spend },
      });
    }

    return items;
  },
};
