import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'structure.too-many-adsets',
  level: 'campaign',
  severity: 'warning',
  category: 'campaign',
  action: 'review',
  title: 'Muitos conjuntos de anúncios',
  description: 'Campanha com excesso de adsets ativos, o que pode prejudicar a otimização do algoritmo.',
  condition: 'active_adsets > 8',
};

const ADSET_THRESHOLD_WARNING = 8;
const ADSET_THRESHOLD_CRITICAL = 15;

export const structureTooManyAdsetsRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const { adsetsByCampaign, campaignRows } = ctx;

    if (!adsetsByCampaign || adsetsByCampaign.size === 0) return items;

    for (const [campaignId, adsets] of adsetsByCampaign) {
      const activeAdsets = adsets.filter((a: any) => (parseFloat(a.spend_total) || 0) > 0);
      const count = activeAdsets.length;

      if (count > ADSET_THRESHOLD_WARNING) {
        const campRow = campaignRows.find((r: any) => String(r.campaign_id) === campaignId);
        const campName = campRow ? String(campRow.campaign_name) : campaignId;
        const severity = count >= ADSET_THRESHOLD_CRITICAL ? 'warning' : 'info';

        items.push({
          id: `structure-too-many-adsets-${campaignId}`,
          ruleId: meta.id,
          severity,
          category: 'campaign',
          action: 'review',
          title: 'Muitos conjuntos de anúncios',
          description: `Campanha "${campName}" tem ${count} conjuntos ativos. Muitos conjuntos dificultam a otimização do algoritmo do Meta. Considere consolidar para 3-5 conjuntos.`,
          theme: toThemeInfo(ctx.primaryTheme),
          entity: { type: 'campaign', id: campaignId, name: campName },
          metrics: { activeAdsets: count },
          thresholds: { maxRecommended: ADSET_THRESHOLD_WARNING },
        });
      }
    }

    return items;
  },
};
