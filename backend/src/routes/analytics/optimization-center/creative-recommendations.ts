import type { OptimizationThemeTargets } from '../../../services/optimization-playbook';
import { OPTIMIZATION_CENTER_PLAYBOOK_V1, getOptimizationTargetsForTheme, inferOptimizationTheme } from '../../../services/optimization-playbook';
import { formatCurrency, safeText } from './helpers';
import type { OptimizationItem, OptimizationSeverity } from './types';

export const buildCreativeItems = (params: {
  enrichedCreatives: any[];
  winners: any[];
  primaryTheme: { themeKey: string; themeName: string; matchedBy: string; matchedValue: string | null };
  targets: OptimizationThemeTargets;
}) => {
  const { enrichedCreatives, winners, primaryTheme, targets } = params;
  const items: OptimizationItem[] = [];

  if (enrichedCreatives.length === 0) {
    items.push({
      id: 'creative-missing',
      ruleId: 'data.no-creatives',
      severity: 'info',
      category: 'data',
      action: 'sync',
      title: 'Sem dados de criativos',
      description: 'Não há métricas de criativos no período. Execute um sync da Meta com syncLevel "ad" ou "full" para capturar criativos e snapshots.',
      theme: {
        key: primaryTheme.themeKey,
        name: primaryTheme.themeName,
        matchedBy: primaryTheme.matchedBy,
        matchedValue: primaryTheme.matchedValue,
      },
    });
  } else {
    const losers = enrichedCreatives
      .filter((c: any) => c.status === 'loser')
      .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
      .slice(0, 3);
    for (const c of losers) {
      const spend = c.metrics.totalSpend || 0;
      const conv = c.metrics.totalConversations || 0;
      const severity: OptimizationSeverity = spend >= 400 && conv === 0 ? 'critical' : 'warning';
      items.push({
        id: `creative-loser-${c.snapshotId}`,
        ruleId: 'creative.loser',
        severity,
        category: 'creative',
        action: 'pause',
        title: 'Criativo com baixo desempenho',
        description: `${formatCurrency(spend)} de investimento com ${conv} conversas. Recomenda-se pausar/substituir e criar novas variações (copy/CTA/gancho).`,
        theme: {
          key: primaryTheme.themeKey,
          name: primaryTheme.themeName,
          matchedBy: primaryTheme.matchedBy,
          matchedValue: primaryTheme.matchedValue,
        },
        entity: { type: 'creative', id: c.snapshotId, name: c.headline },
        metrics: { spend, conversations: conv, cpl: c.metrics.cpl ?? null },
        thresholds: {
          creativeMinSpendLoser: targets.creativeMinSpendLoser,
          creativeLoserCplMultiplier: targets.creativeLoserCplMultiplier,
        },
      });
    }

    const fatigued = enrichedCreatives
      .filter((c: any) => c.status === 'fatigued')
      .sort((a: any, b: any) => (b.recent.spend || 0) - (a.recent.spend || 0))
      .slice(0, 3);
    for (const c of fatigued) {
      items.push({
        id: `creative-fatigued-${c.snapshotId}`,
        ruleId: 'creative.fatigued',
        severity: 'warning',
        category: 'creative',
        action: 'refresh',
        title: 'Sinal de fadiga de criativo',
        description: `O criativo perdeu desempenho nos últimos 7 dias. Ação: manter o ângulo vencedor e testar novas variações de título/primeiro segundo/CTA.`,
        theme: {
          key: primaryTheme.themeKey,
          name: primaryTheme.themeName,
          matchedBy: primaryTheme.matchedBy,
          matchedValue: primaryTheme.matchedValue,
        },
        entity: { type: 'creative', id: c.snapshotId, name: c.headline },
        metrics: {
          recentConversations: c.recent.conversations,
          previousConversations: c.previous.conversations,
          recentCpl: c.recent.cpl ?? null,
          previousCpl: c.previous.cpl ?? null,
        },
        thresholds: {
          creativeFatigueDropPct: targets.creativeFatigueDropPct,
          creativeFatigueCplMultiplier: targets.creativeFatigueCplMultiplier,
        },
      });
    }

    const topWinners = winners
      .filter((c: any) => typeof c.metrics.cpl === 'number' && c.metrics.cpl <= targets.targetCplGoodMax)
      .slice(0, 2);
    for (const c of topWinners) {
      items.push({
        id: `creative-winner-${c.snapshotId}`,
        ruleId: 'creative.winner',
        severity: 'opportunity',
        category: 'creative',
        action: 'scale',
        title: 'Criativo vencedor',
        description: 'Este criativo está entre os melhores do período. Use como referência para novas variações e para sustentar escala sem fadiga.',
        theme: {
          key: primaryTheme.themeKey,
          name: primaryTheme.themeName,
          matchedBy: primaryTheme.matchedBy,
          matchedValue: primaryTheme.matchedValue,
        },
        entity: { type: 'creative', id: c.snapshotId, name: c.headline },
        metrics: { spend: c.metrics.totalSpend, conversations: c.metrics.totalConversations, cpl: c.metrics.cpl ?? null },
        thresholds: { targetCplGoodMax: targets.targetCplGoodMax },
      });
    }

    const lowHook = enrichedCreatives
      .filter((c: any) => {
        const hookRate = c.metrics.hookRateAvg;
        return (
          c.isVideo &&
          typeof hookRate === 'number' &&
          Number.isFinite(hookRate) &&
          hookRate > 0 &&
          hookRate < targets.hookRateMin &&
          (c.metrics.totalSpend || 0) >= targets.creativeMinSpendWinner
        );
      })
      .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
      .slice(0, 3);
    for (const c of lowHook) {
      items.push({
        id: `creative-hook-low-${c.snapshotId}`,
        ruleId: 'creative.video-hook-low',
        severity: 'warning',
        category: 'creative',
        action: 'refresh',
        title: 'Hook baixo (vídeo)',
        description: `Hook rate ${c.metrics.hookRateAvg?.toFixed?.(1) ?? c.metrics.hookRateAvg}% abaixo do mínimo sugerido. Ajuste os 1–3 primeiros segundos (gancho/promessa/prova).`,
        theme: {
          key: primaryTheme.themeKey,
          name: primaryTheme.themeName,
          matchedBy: primaryTheme.matchedBy,
          matchedValue: primaryTheme.matchedValue,
        },
        entity: { type: 'creative', id: c.snapshotId, name: c.headline },
        metrics: {
          spend: c.metrics.totalSpend,
          conversations: c.metrics.totalConversations,
          hookRateAvg: c.metrics.hookRateAvg ?? null,
        },
        thresholds: { hookRateMin: targets.hookRateMin },
      });
    }

    const lowHold = enrichedCreatives
      .filter((c: any) => {
        const holdRate = c.metrics.holdRateAvg;
        return (
          c.isVideo &&
          typeof holdRate === 'number' &&
          Number.isFinite(holdRate) &&
          holdRate > 0 &&
          holdRate < targets.holdRateMin &&
          (c.metrics.totalSpend || 0) >= targets.creativeMinSpendWinner
        );
      })
      .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
      .slice(0, 3);
    for (const c of lowHold) {
      items.push({
        id: `creative-hold-low-${c.snapshotId}`,
        ruleId: 'creative.video-hold-low',
        severity: 'info',
        category: 'creative',
        action: 'refresh',
        title: 'Hold baixo (vídeo)',
        description: `Hold rate ${c.metrics.holdRateAvg?.toFixed?.(1) ?? c.metrics.holdRateAvg}% abaixo do mínimo sugerido. Ajuste ritmo, estrutura e clareza da mensagem.`,
        theme: {
          key: primaryTheme.themeKey,
          name: primaryTheme.themeName,
          matchedBy: primaryTheme.matchedBy,
          matchedValue: primaryTheme.matchedValue,
        },
        entity: { type: 'creative', id: c.snapshotId, name: c.headline },
        metrics: {
          spend: c.metrics.totalSpend,
          conversations: c.metrics.totalConversations,
          holdRateAvg: c.metrics.holdRateAvg ?? null,
        },
        thresholds: { holdRateMin: targets.holdRateMin },
      });
    }

    // Copy recommendations (snapshot + CTA)
    const normalizeCopyText = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();

    const preferredCtas = OPTIMIZATION_CENTER_PLAYBOOK_V1.copy?.preferredCtaTypes ?? ['WHATSAPP_MESSAGE', 'SEND_MESSAGE'];
    const prohibitedPhrases = OPTIMIZATION_CENTER_PLAYBOOK_V1.copy?.prohibitedPhrases ?? [];

    const copyCandidateIds = new Set<string>();
    for (const c of winners.slice(0, 5)) copyCandidateIds.add(c.snapshotId);
    for (const c of enrichedCreatives.filter((c: any) => c.status !== 'neutral').slice(0, 8)) copyCandidateIds.add(c.snapshotId);
    for (const c of enrichedCreatives.slice(0, 6)) copyCandidateIds.add(c.snapshotId);

    const copyCandidates = enrichedCreatives.filter((c: any) => copyCandidateIds.has(c.snapshotId));

    for (const c of copyCandidates as any[]) {
      const campaignName = Array.isArray(c.campaigns) && c.campaigns.length > 0 ? c.campaigns[0] : '';
      const creativeTheme = campaignName ? inferOptimizationTheme(campaignName) : primaryTheme;
      const creativeTargets = getOptimizationTargetsForTheme(creativeTheme.themeKey);

      const spend = c.metrics?.totalSpend || 0;
      const conv = c.metrics?.totalConversations || 0;
      const isImportant =
        c.status !== 'neutral' ||
        spend >= creativeTargets.creativeMinSpendWinner ||
        conv >= Math.max(3, Math.floor(creativeTargets.minContactsForEvaluation / 3));

      if (!isImportant) continue;

      const headline = safeText(c.headline);
      const primaryText = safeText(c.primaryText);
      const description = safeText(c.description);
      const ctaType = typeof c.ctaType === 'string' && c.ctaType.trim() ? c.ctaType.trim() : null;

      const combined = [headline, primaryText, description].filter(Boolean).join(' ');
      const combinedNormalized = combined ? normalizeCopyText(combined) : '';

      // Missing copy insights (stored)
      if (!c.copyInsightsStatus) {
        items.push({
          id: `creative-copy-insights-missing-${c.snapshotId}`,
          ruleId: 'creative.copy-insights-missing',
          severity: 'info',
          category: 'creative',
          action: 'review',
          title: 'Sem insights de copy',
          description:
            'Ainda não há análise de copy salva para este criativo. Gere sugestões (IA/fallback) e use como base para novas variações.',
          theme: {
            key: creativeTheme.themeKey,
            name: creativeTheme.themeName,
            matchedBy: creativeTheme.matchedBy,
            matchedValue: creativeTheme.matchedValue,
          },
          entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
          metrics: { spend, conversations: conv, cpl: c.metrics?.cpl ?? null },
        });
      }

      // Headline missing
      if (!headline) {
        items.push({
          id: `creative-copy-missing-headline-${c.snapshotId}`,
          ruleId: 'creative.copy-missing-headline',
          severity: 'warning',
          category: 'creative',
          action: 'refresh',
          title: 'Criativo sem título (headline)',
          description:
            'O snapshot não possui headline (título). Preencha um título curto e claro para aumentar clique e facilitar testes.',
          theme: {
            key: creativeTheme.themeKey,
            name: creativeTheme.themeName,
            matchedBy: creativeTheme.matchedBy,
            matchedValue: creativeTheme.matchedValue,
          },
          entity: { type: 'creative', id: c.snapshotId, name: 'Criativo' },
          metrics: { spend, conversations: conv },
          thresholds: {
            copyHeadlineMinChars: creativeTargets.copyHeadlineMinChars,
            copyHeadlineMaxChars: creativeTargets.copyHeadlineMaxChars,
          },
        });
      } else {
        // Headline length guardrail
        if (headline.length < creativeTargets.copyHeadlineMinChars || headline.length > creativeTargets.copyHeadlineMaxChars) {
          const reason =
            headline.length < creativeTargets.copyHeadlineMinChars
              ? `muito curto (${headline.length} chars)`
              : `muito longo (${headline.length} chars)`;

          items.push({
            id: `creative-copy-headline-length-${c.snapshotId}`,
            ruleId: 'creative.copy-headline-length',
            severity: 'info',
            category: 'creative',
            action: 'refresh',
            title: 'Título fora do recomendado',
            description: `Headline ${reason}. Ajuste para ficar entre ${creativeTargets.copyHeadlineMinChars} e ${creativeTargets.copyHeadlineMaxChars} caracteres.`,
            theme: {
              key: creativeTheme.themeKey,
              name: creativeTheme.themeName,
              matchedBy: creativeTheme.matchedBy,
              matchedValue: creativeTheme.matchedValue,
            },
            entity: { type: 'creative', id: c.snapshotId, name: headline },
            metrics: { spend, conversations: conv },
            thresholds: {
              copyHeadlineMinChars: creativeTargets.copyHeadlineMinChars,
              copyHeadlineMaxChars: creativeTargets.copyHeadlineMaxChars,
            },
          });
        }
      }

      // Primary text too long
      if (primaryText && primaryText.length > creativeTargets.copyPrimaryTextMaxChars) {
        items.push({
          id: `creative-copy-primary-too-long-${c.snapshotId}`,
          ruleId: 'creative.copy-primary-too-long',
          severity: 'info',
          category: 'creative',
          action: 'refresh',
          title: 'Texto principal muito longo',
          description: `Texto com ${primaryText.length} caracteres. Para WhatsApp, prefira algo curto e direto (≤ ${creativeTargets.copyPrimaryTextMaxChars}).`,
          theme: {
            key: creativeTheme.themeKey,
            name: creativeTheme.themeName,
            matchedBy: creativeTheme.matchedBy,
            matchedValue: creativeTheme.matchedValue,
          },
          entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
          metrics: { spend, conversations: conv },
          thresholds: { copyPrimaryTextMaxChars: creativeTargets.copyPrimaryTextMaxChars },
        });
      }

      // CTA mismatch for conversation objective
      if (ctaType && !preferredCtas.includes(ctaType)) {
        items.push({
          id: `creative-copy-cta-mismatch-${c.snapshotId}`,
          ruleId: 'creative.copy-cta-mismatch',
          severity: 'warning',
          category: 'creative',
          action: 'refresh',
          title: 'CTA pouco compatível com conversa',
          description: `CTA atual: ${ctaType}. Para campanhas de conversa, teste ${preferredCtas.join(' / ')}.`,
          theme: {
            key: creativeTheme.themeKey,
            name: creativeTheme.themeName,
            matchedBy: creativeTheme.matchedBy,
            matchedValue: creativeTheme.matchedValue,
          },
          entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
          metrics: { spend, conversations: conv, cpl: c.metrics?.cpl ?? null },
          thresholds: { preferredCtaTypes: preferredCtas.join(',') },
        });
      }

      // Theme not mentioned in copy (heuristic)
      if (creativeTheme.themeKey !== 'geral' && combined) {
        const inferredFromCopy = inferOptimizationTheme(combined);
        if (inferredFromCopy.themeKey === 'geral') {
          items.push({
            id: `creative-copy-theme-not-mentioned-${c.snapshotId}`,
            ruleId: 'creative.copy-theme-not-mentioned',
            severity: 'info',
            category: 'creative',
            action: 'refresh',
            title: 'Copy não cita o tema',
            description: `Tema detectado: ${creativeTheme.themeName}, mas a copy não contém palavras-chave claras do tema. Sugestão: explicitar o assunto para aumentar qualificação.`,
            theme: {
              key: creativeTheme.themeKey,
              name: creativeTheme.themeName,
              matchedBy: creativeTheme.matchedBy,
              matchedValue: creativeTheme.matchedValue,
            },
            entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
            metrics: { spend, conversations: conv },
          });
        }
      }

      // Compliance risk (prohibited phrases)
      if (combinedNormalized && prohibitedPhrases.length > 0) {
        const matched = prohibitedPhrases.find((phrase) => combinedNormalized.includes(normalizeCopyText(phrase)));
        if (matched) {
          items.push({
            id: `creative-copy-compliance-risk-${c.snapshotId}`,
            ruleId: 'creative.copy-compliance-risk',
            severity: 'warning',
            category: 'creative',
            action: 'review',
            title: 'Risco de promessa (copy)',
            description: `Detectado termo de promessa absoluta (“${matched}”). Ajuste a copy para evitar promessas e reduzir risco de reprovação.`,
            theme: {
              key: creativeTheme.themeKey,
              name: creativeTheme.themeName,
              matchedBy: creativeTheme.matchedBy,
              matchedValue: creativeTheme.matchedValue,
            },
            entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
            metrics: { spend, conversations: conv },
            thresholds: { prohibitedPhrase: matched },
          });
        }
      }
    }
  }


  return items;
};
