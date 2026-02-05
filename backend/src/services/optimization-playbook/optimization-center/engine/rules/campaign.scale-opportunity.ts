import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import type { OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.scale-opportunity',
  level: 'campaign',
  severity: 'opportunity',
  category: 'campaign',
  action: 'scale',
  title: 'Oportunidade de escalar',
  description: 'Campanha está saudável (CPL bom) e com tendência positiva.',
  condition: 'cpl_last7 <= targetCplGoodMax AND (delta_contacts_pct >= 20 OR delta_cpl_pct <= -20)',
};

export const campaignScaleOpportunityRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const actionableCampaigns: Array<{
      campaignId: string;
      campaignName: string;
      contactsLast7: number;
      contactsPrev7: number;
      spendLast7: number;
      cplLast7: number | null;
      cplPrev7: number | null;
      contactsDelta: number | null;
      cplDelta: number | null;
      theme: ReturnType<typeof getCampaignFacts>['theme'];
      targets: ReturnType<typeof getCampaignFacts>['targets'];
    }> = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.spendLast7 >= facts.minSpendForEvaluation && facts.contactsLast7 > 0) {
        actionableCampaigns.push({
          campaignId: facts.campaignId,
          campaignName: facts.campaignName,
          contactsLast7: facts.contactsLast7,
          contactsPrev7: facts.contactsPrev7,
          spendLast7: facts.spendLast7,
          cplLast7: facts.costPerContact,
          cplPrev7: facts.costPerContactPrev7,
          contactsDelta: facts.contactsDelta,
          cplDelta: facts.cplChange,
          theme: facts.theme,
          targets: facts.targets,
        });
      }
    }

    const bestCampaign = [...actionableCampaigns]
      .sort((a, b) => b.contactsLast7 - a.contactsLast7)
      .find((c) => c.contactsLast7 >= Math.max(15, ctx.primaryTargets.minContactsForEvaluation));

    if (!bestCampaign) return [];

    const meetsCplTarget =
      bestCampaign.cplLast7 != null && Number.isFinite(bestCampaign.cplLast7)
        ? bestCampaign.cplLast7 <= bestCampaign.targets.targetCplGoodMax
        : false;

    if (
      meetsCplTarget &&
      ((bestCampaign.contactsDelta !== null && bestCampaign.contactsDelta >= 20) ||
        (bestCampaign.cplDelta !== null && bestCampaign.cplDelta <= -20))
    ) {
      return [
        {
          id: `opp-scale-${bestCampaign.campaignId}`,
          ruleId: meta.id,
          severity: 'opportunity',
          category: 'campaign',
          action: 'scale',
          title: 'Oportunidade de escalar',
          description:
            `A campanha "${bestCampaign.campaignName}" está performando bem nos últimos 7 dias. Considerar aumentar orçamento gradualmente e duplicar criativos vencedores para manter volume sem fadiga.`,
          theme: toThemeInfo(bestCampaign.theme),
          entity: { type: 'campaign', id: bestCampaign.campaignId, name: bestCampaign.campaignName },
          metrics: {
            contactsLast7: bestCampaign.contactsLast7,
            spendLast7: bestCampaign.spendLast7,
            cplLast7: bestCampaign.cplLast7,
          },
          thresholds: { targetCplGoodMax: bestCampaign.targets.targetCplGoodMax },
        },
      ];
    }

    return [];
  },
};

