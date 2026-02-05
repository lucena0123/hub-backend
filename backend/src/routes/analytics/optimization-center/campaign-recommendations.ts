import type { OptimizationThemeTargets } from '../../../services/optimization-playbook';
import { getOptimizationTargetsForTheme, inferOptimizationTheme } from '../../../services/optimization-playbook';
import { formatCurrency, formatPercent, percentChange, safeFloat, safeInt } from './helpers';
import type { OptimizationItem } from './types';

type LeadTrackingAgg = { recordsLast7: number; qualifiedLast7: number; qualifiedPrev7: number };

export const buildCampaignItems = (params: {
  campaignRows: any[];
  leadTrackingByCampaign: Map<string, LeadTrackingAgg>;
  reasonsByCampaign: Map<string, Array<{ key: string; count: number }>>;
  primaryTargets: OptimizationThemeTargets;
  adsetBudgetsByCampaign: Map<string, { dailyBudget: number; lifetimeBudget: number }>;
}) => {
  const { campaignRows, leadTrackingByCampaign, reasonsByCampaign, primaryTargets, adsetBudgetsByCampaign } = params;
  const items: OptimizationItem[] = [];

  const actionableCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    contactsLast7: number;
    contactsPrev7: number;
    spendLast7: number;
    cplLast7: number | null;
    cplPrev7: number | null;
  }> = [];

  for (const camp of campaignRows as any[]) {
    const campaignIdValue = String(camp.campaign_id);
    const campaignName = String(camp.campaign_name || '');
    const campaignStatus = String(camp.campaign_status || '');

    const campaignTheme = inferOptimizationTheme(campaignName);
    const campaignTargets = getOptimizationTargetsForTheme(campaignTheme.themeKey);

    const spendTotal = safeFloat(camp.spend_total);
    const impressionsTotal = safeInt(camp.impressions_total);

    const spendLast7 = safeFloat(camp.spend_last7);
    const spendPrev7 = safeFloat(camp.spend_prev7);

    const campaignBudget = safeFloat(camp.budget);
    const adsetBudgets = adsetBudgetsByCampaign.get(campaignIdValue);
    const adsetDailyBudget = safeFloat(adsetBudgets?.dailyBudget);
    const adsetLifetimeBudget = safeFloat(adsetBudgets?.lifetimeBudget);

    const floorMinSpend = Math.max(20, Math.round(campaignTargets.minSpendForEvaluation * 0.2));

    const budgetCandidate =
      campaignBudget > 0
        ? { value: campaignBudget, isDaily: spendLast7 > campaignBudget * 1.2 }
        : adsetDailyBudget > 0
          ? { value: adsetDailyBudget, isDaily: true }
          : adsetLifetimeBudget > 0
            ? { value: adsetLifetimeBudget, isDaily: false }
            : { value: 0, isDaily: false };

    const expectedSpendLast7 =
      budgetCandidate.value > 0 ? (budgetCandidate.isDaily ? budgetCandidate.value * 7 : budgetCandidate.value) : 0;

    const minSpendForEvaluation =
      expectedSpendLast7 > 0
        ? Math.min(campaignTargets.minSpendForEvaluation, Math.max(floorMinSpend, expectedSpendLast7 * 0.8))
        : campaignTargets.minSpendForEvaluation;

    const firstReplyLast7 = safeInt(camp.first_reply_last7);
    const avgFrequencyLast7 = safeFloat(camp.avg_frequency_last7);
    const avgCpmLast7 = safeFloat(camp.avg_cpm_last7);

    const conversionsLast7 = safeInt(camp.conversions_last7);
    const conversionsPrev7 = safeInt(camp.conversions_prev7);
    const leadsLast7 = safeInt(camp.leads_last7);
    const leadsPrev7 = safeInt(camp.leads_prev7);
    const messagingLast7 = safeInt(camp.conversations_last7);
    const messagingPrev7 = safeInt(camp.conversations_prev7);

    const isMessagingCampaign = messagingLast7 > 0 || messagingPrev7 > 0;
    const contactsLast7 = messagingLast7 > 0 ? messagingLast7 : leadsLast7 > 0 ? leadsLast7 : conversionsLast7;
    const contactsPrev7 = messagingPrev7 > 0 ? messagingPrev7 : leadsPrev7 > 0 ? leadsPrev7 : conversionsPrev7;

    const costPerContact = contactsLast7 > 0 ? spendLast7 / contactsLast7 : null;
    const costPerContactPrev7 = contactsPrev7 > 0 ? spendPrev7 / contactsPrev7 : null;

    const firstReplyRate =
      messagingLast7 > 0 && firstReplyLast7 >= 0 ? (firstReplyLast7 / messagingLast7) * 100 : null;

    const contactsDelta = percentChange(contactsLast7, contactsPrev7);
    const cplChange =
      costPerContact != null && costPerContactPrev7 != null
        ? percentChange(costPerContact, costPerContactPrev7)
        : null;

    const leadTracking = leadTrackingByCampaign.get(campaignIdValue) ?? {
      recordsLast7: 0,
      qualifiedLast7: 0,
      qualifiedPrev7: 0,
    };

    const topReasons = (reasonsByCampaign.get(campaignIdValue) ?? [])
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map((r) => `${r.key.replaceAll('_', ' ')} (${r.count})`)
      .join(', ');

    // Delivery stalled in the selected window.
    if (spendTotal === 0 && impressionsTotal === 0 && campaignStatus === 'active') {
      items.push({
        id: `camp-stalled-${campaignIdValue}`,
        ruleId: 'campaign.stalled',
        severity: 'warning',
        category: 'campaign',
        action: 'review',
        title: 'Campanha ativa sem entrega',
        description:
          'A campanha está marcada como ativa, mas não teve impressões/gasto no período selecionado. Verifique status, público, orçamento e limites na conta.',
        theme: {
          key: campaignTheme.themeKey,
          name: campaignTheme.themeName,
          matchedBy: campaignTheme.matchedBy,
          matchedValue: campaignTheme.matchedValue,
        },
        entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
        metrics: { spend: spendTotal, impressions: impressionsTotal },
        thresholds: { minSpendForEvaluation },
      });
      continue;
    }

    // Spend with no contacts.
    if (spendLast7 >= minSpendForEvaluation && contactsLast7 === 0) {
      items.push({
        id: `camp-no-contacts-${campaignIdValue}`,
        ruleId: 'campaign.no-contacts',
        severity: 'critical',
        category: 'campaign',
        action: 'refresh',
        title: 'Gasto sem gerar contatos',
        description: `${formatCurrency(spendLast7)} investidos nos últimos 7 dias (dentro do período selecionado) sem gerar contatos. Ação: revisar criativos, público e página/conversa de destino.`,
        theme: {
          key: campaignTheme.themeKey,
          name: campaignTheme.themeName,
          matchedBy: campaignTheme.matchedBy,
          matchedValue: campaignTheme.matchedValue,
        },
        entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
        metrics: { spendLast7, contactsLast7 },
        thresholds: { minSpendForEvaluation },
      });
    }

    // Sharp drop in contacts week-over-week.
    if (
      contactsPrev7 >= campaignTargets.minContactsForEvaluation &&
      contactsDelta !== null &&
      contactsDelta <= campaignTargets.contactsDropPctWarning &&
      spendLast7 >= Math.min(minSpendForEvaluation, 100)
    ) {
      items.push({
        id: `camp-contacts-drop-${campaignIdValue}`,
        ruleId: 'campaign.contacts-drop',
        severity: 'warning',
        category: 'campaign',
        action: 'refresh',
        title: 'Queda brusca de contatos',
        description: `Queda de contatos: ${contactsPrev7} → ${contactsLast7} (${formatPercent(contactsDelta)}). Sinal de fadiga de criativo ou mudança de público.`,
        theme: {
          key: campaignTheme.themeKey,
          name: campaignTheme.themeName,
          matchedBy: campaignTheme.matchedBy,
          matchedValue: campaignTheme.matchedValue,
        },
        entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
        metrics: { contactsLast7, contactsPrev7, spendLast7 },
        thresholds: {
          minContactsForEvaluation: campaignTargets.minContactsForEvaluation,
          contactsDropPctWarning: campaignTargets.contactsDropPctWarning,
        },
      });
    }

    // Cost per contact increased significantly.
    if (
      contactsPrev7 >= campaignTargets.minContactsForEvaluation &&
      contactsLast7 >= Math.min(5, campaignTargets.minContactsForEvaluation) &&
      cplChange !== null &&
      cplChange >= campaignTargets.cplRisePctWarning &&
      costPerContact != null &&
      costPerContactPrev7 != null
    ) {
      items.push({
        id: `camp-cpl-rise-${campaignIdValue}`,
        ruleId: 'campaign.cpl-rise',
        severity: 'warning',
        category: 'campaign',
        action: 'refresh',
        title: 'Custo por contato subiu',
        description: `Custo por contato subiu: ${formatCurrency(costPerContactPrev7)} → ${formatCurrency(costPerContact)} (${formatPercent(cplChange)}). Recomenda-se testar novas variações de criativos.`,
        theme: {
          key: campaignTheme.themeKey,
          name: campaignTheme.themeName,
          matchedBy: campaignTheme.matchedBy,
          matchedValue: campaignTheme.matchedValue,
        },
        entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
        metrics: { costPerContact, costPerContactPrev7, spendLast7 },
        thresholds: { cplRisePctWarning: campaignTargets.cplRisePctWarning },
      });
    }

    // CPL guardrails (theme targets)
    if (
      costPerContact != null &&
      contactsLast7 >= campaignTargets.minContactsForEvaluation &&
      spendLast7 >= minSpendForEvaluation
    ) {
      if (costPerContact >= campaignTargets.targetCplBadMin) {
        items.push({
          id: `camp-cpl-high-${campaignIdValue}`,
          ruleId: 'campaign.cpl-high',
          severity: 'critical',
          category: 'campaign',
          action: 'refresh',
          title: 'CPL acima do ideal (tema)',
          description: `CPL atual ${formatCurrency(costPerContact)} está acima do ideal para o tema (${campaignTheme.themeName}). Recomendado: revisar criativos, públicos e proposta para reduzir custo por contato.`,
          theme: {
            key: campaignTheme.themeKey,
            name: campaignTheme.themeName,
            matchedBy: campaignTheme.matchedBy,
            matchedValue: campaignTheme.matchedValue,
          },
          entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
          metrics: { cplLast7: costPerContact, contactsLast7, spendLast7 },
          thresholds: {
            targetCplGoodMax: campaignTargets.targetCplGoodMax,
            targetCplOkMax: campaignTargets.targetCplOkMax,
            targetCplBadMin: campaignTargets.targetCplBadMin,
          },
        });
      } else if (costPerContact > campaignTargets.targetCplOkMax) {
        items.push({
          id: `camp-cpl-above-ok-${campaignIdValue}`,
          ruleId: 'campaign.cpl-above-ok',
          severity: 'warning',
          category: 'campaign',
          action: 'refresh',
          title: 'CPL acima do desejado (tema)',
          description: `CPL atual ${formatCurrency(costPerContact)} acima do desejado para o tema (${campaignTheme.themeName}). Sugestão: criar novas variações de criativo e testar ângulos/copy.`,
          theme: {
            key: campaignTheme.themeKey,
            name: campaignTheme.themeName,
            matchedBy: campaignTheme.matchedBy,
            matchedValue: campaignTheme.matchedValue,
          },
          entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
          metrics: { cplLast7: costPerContact, contactsLast7, spendLast7 },
          thresholds: { targetCplOkMax: campaignTargets.targetCplOkMax },
        });
      }
    }

    // Frequency (saturation) guardrail
    if (avgFrequencyLast7 >= campaignTargets.frequencyCritical && spendLast7 >= minSpendForEvaluation) {
      items.push({
        id: `camp-frequency-critical-${campaignIdValue}`,
        ruleId: 'campaign.frequency-high',
        severity: 'critical',
        category: 'campaign',
        action: 'refresh',
        title: 'Frequência muito alta (saturação)',
        description: `Frequência média ${avgFrequencyLast7.toFixed(2)}x nos últimos 7 dias. Sinal de saturação: priorize renovação de criativos e/ou ampliar público.`,
        theme: {
          key: campaignTheme.themeKey,
          name: campaignTheme.themeName,
          matchedBy: campaignTheme.matchedBy,
          matchedValue: campaignTheme.matchedValue,
        },
        entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
        metrics: { avgFrequencyLast7, avgCpmLast7 },
        thresholds: {
          frequencyWarning: campaignTargets.frequencyWarning,
          frequencyCritical: campaignTargets.frequencyCritical,
        },
      });
    } else if (avgFrequencyLast7 >= campaignTargets.frequencyWarning && spendLast7 >= minSpendForEvaluation) {
      items.push({
        id: `camp-frequency-warning-${campaignIdValue}`,
        ruleId: 'campaign.frequency-high',
        severity: 'warning',
        category: 'campaign',
        action: 'refresh',
        title: 'Frequência alta (atenção)',
        description: `Frequência média ${avgFrequencyLast7.toFixed(2)}x nos últimos 7 dias. Comece a renovar criativos para evitar queda por fadiga.`,
        theme: {
          key: campaignTheme.themeKey,
          name: campaignTheme.themeName,
          matchedBy: campaignTheme.matchedBy,
          matchedValue: campaignTheme.matchedValue,
        },
        entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
        metrics: { avgFrequencyLast7, avgCpmLast7 },
        thresholds: { frequencyWarning: campaignTargets.frequencyWarning },
      });
    }

    // Messaging first reply rate (quality proxy)
    if (
      firstReplyRate != null &&
      messagingLast7 >= campaignTargets.minContactsForEvaluation &&
      firstReplyRate < campaignTargets.firstReplyRateMin &&
      spendLast7 >= minSpendForEvaluation
    ) {
      items.push({
        id: `camp-first-reply-low-${campaignIdValue}`,
        ruleId: 'campaign.first-reply-low',
        severity: 'warning',
        category: 'campaign',
        action: 'review',
        title: 'Baixa taxa de primeira resposta',
        description: `Taxa de primeira resposta ${formatPercent(firstReplyRate)} (meta: ≥ ${campaignTargets.firstReplyRateMin}%). Pode indicar conversa iniciada mas sem engajamento. Revise criativos e a abordagem inicial no WhatsApp.`,
        theme: {
          key: campaignTheme.themeKey,
          name: campaignTheme.themeName,
          matchedBy: campaignTheme.matchedBy,
          matchedValue: campaignTheme.matchedValue,
        },
        entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
        metrics: { messagingLast7, firstReplyLast7, firstReplyRate },
        thresholds: { firstReplyRateMin: campaignTargets.firstReplyRateMin },
      });
    }

    // Qualification tracking reminders.
    if (contactsLast7 > 0 && spendLast7 > minSpendForEvaluation && leadTracking.recordsLast7 === 0) {
      items.push({
        id: `qual-missing-${campaignIdValue}`,
        ruleId: 'qualification.missing',
        severity: 'info',
        category: 'qualification',
        action: 'track',
        title: 'Sem dados de qualificação',
        description:
          'Há contatos no período, mas não há registros de qualificação. Preencha “Dados do Funil” para medir a qualidade e o custo por interessado real.',
        theme: {
          key: campaignTheme.themeKey,
          name: campaignTheme.themeName,
          matchedBy: campaignTheme.matchedBy,
          matchedValue: campaignTheme.matchedValue,
        },
        entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
        metrics: { contactsLast7, spendLast7 },
        thresholds: { minSpendForEvaluation },
      });
    }

    // Low qualification rate (manual).
    if (leadTracking.recordsLast7 > 0 && contactsLast7 > 0) {
      const qualificationRate = leadTracking.qualifiedLast7 > 0 ? (leadTracking.qualifiedLast7 / contactsLast7) * 100 : 0;
      const costPerQualified = leadTracking.qualifiedLast7 > 0 ? spendLast7 / leadTracking.qualifiedLast7 : null;

      if (spendLast7 > minSpendForEvaluation && leadTracking.qualifiedLast7 === 0) {
        items.push({
          id: `qual-zero-${campaignIdValue}`,
          ruleId: 'qualification.zero',
          severity: 'critical',
          category: 'qualification',
          action: 'review',
          title: 'Contatos sem qualificados',
          description: `Contatos sem nenhum qualificado nesta semana com ${formatCurrency(spendLast7)} de gasto. Verifique mensagem, triagem e atendimento. ${topReasons ? `Motivos comuns: ${topReasons}.` : ''}`,
          theme: {
            key: campaignTheme.themeKey,
            name: campaignTheme.themeName,
            matchedBy: campaignTheme.matchedBy,
            matchedValue: campaignTheme.matchedValue,
          },
          entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
          metrics: { contactsLast7, qualifiedLast7: leadTracking.qualifiedLast7, spendLast7 },
          thresholds: { qualificationRateTargetMin: campaignTargets.qualificationRateTargetMin },
        });
      } else if (qualificationRate < campaignTargets.qualificationRateTargetMin) {
        items.push({
          id: `qual-low-${campaignIdValue}`,
          ruleId: 'qualification.low',
          severity: qualificationRate < Math.max(5, campaignTargets.qualificationRateTargetMin * 0.6) ? 'critical' : 'warning',
          category: 'qualification',
          action: 'review',
          title: 'Qualificação baixa',
          description: `Qualificação baixa: ${leadTracking.qualifiedLast7} qualificados em ${contactsLast7} contatos (${formatPercent(qualificationRate)}). ${costPerQualified != null ? `Custo por qualificado: ${formatCurrency(costPerQualified)}.` : ''} ${topReasons ? `Motivos comuns: ${topReasons}.` : ''}`,
          theme: {
            key: campaignTheme.themeKey,
            name: campaignTheme.themeName,
            matchedBy: campaignTheme.matchedBy,
            matchedValue: campaignTheme.matchedValue,
          },
          entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
          metrics: {
            qualificationRate,
            costPerQualified,
            contactsLast7,
            qualifiedLast7: leadTracking.qualifiedLast7,
          },
          thresholds: { qualificationRateTargetMin: campaignTargets.qualificationRateTargetMin },
        });
      }
    }

    if (spendLast7 >= minSpendForEvaluation && contactsLast7 > 0) {
      actionableCampaigns.push({
        campaignId: campaignIdValue,
        campaignName,
        contactsLast7,
        contactsPrev7,
        spendLast7,
        cplLast7: costPerContact,
        cplPrev7: costPerContactPrev7,
      });
    }

    // If it's clearly a messaging campaign, keep this hint for the consumer.
    if (isMessagingCampaign && spendLast7 > 0 && contactsLast7 > 0 && leadTracking.recordsLast7 > 0) {
      // no-op: placeholder for future playbook rules.
    }
  }

  // Opportunity: scale the best performer this week (simple heuristic)
  const bestCampaign = [...actionableCampaigns]
    .sort((a, b) => b.contactsLast7 - a.contactsLast7)
    .find((c) => c.contactsLast7 >= Math.max(15, primaryTargets.minContactsForEvaluation));

  if (bestCampaign) {
    const bestTheme = inferOptimizationTheme(bestCampaign.campaignName);
    const bestTargets = getOptimizationTargetsForTheme(bestTheme.themeKey);
    const contactsDelta = percentChange(bestCampaign.contactsLast7, bestCampaign.contactsPrev7);
    const cplDelta =
      bestCampaign.cplLast7 != null && bestCampaign.cplPrev7 != null
        ? percentChange(bestCampaign.cplLast7, bestCampaign.cplPrev7)
        : null;

    const meetsCplTarget =
      bestCampaign.cplLast7 != null && Number.isFinite(bestCampaign.cplLast7)
        ? bestCampaign.cplLast7 <= bestTargets.targetCplGoodMax
        : false;

    if (
      meetsCplTarget &&
      ((contactsDelta !== null && contactsDelta >= 20) || (cplDelta !== null && cplDelta <= -20))
    ) {
      items.push({
        id: `opp-scale-${bestCampaign.campaignId}`,
        ruleId: 'campaign.scale-opportunity',
        severity: 'opportunity',
        category: 'campaign',
        action: 'scale',
        title: 'Oportunidade de escalar',
        description:
          `A campanha "${bestCampaign.campaignName}" está performando bem nos últimos 7 dias. Considerar aumentar orçamento gradualmente e duplicar criativos vencedores para manter volume sem fadiga.`,
        theme: {
          key: bestTheme.themeKey,
          name: bestTheme.themeName,
          matchedBy: bestTheme.matchedBy,
          matchedValue: bestTheme.matchedValue,
        },
        entity: { type: 'campaign', id: bestCampaign.campaignId, name: bestCampaign.campaignName },
        metrics: {
          contactsLast7: bestCampaign.contactsLast7,
          spendLast7: bestCampaign.spendLast7,
          cplLast7: bestCampaign.cplLast7,
        },
        thresholds: { targetCplGoodMax: bestTargets.targetCplGoodMax },
      });
    }
  }


  return items;
};
