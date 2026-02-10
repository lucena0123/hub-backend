import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.ab-test-opportunity',
  level: 'creative',
  severity: 'info',
  category: 'creative',
  action: 'review',
  title: 'Oportunidade de A/B test',
  description: 'Padrões de winners sugerem experimentos de copy/CTA que podem melhorar resultados.',
  condition: 'winners.length >= 2 AND pattern_difference_detected',
};

export const creativeAbTestOpportunityRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const { winners, enrichedCreatives } = ctx;

    if (winners.length < 2) return items;

    // Compare CTA types: winners vs losers
    const losers = enrichedCreatives.filter((c: any) => c.status === 'loser');
    if (losers.length >= 2 && winners.length >= 2) {
      const winnerCtas = new Set(winners.map((w: any) => w.ctaType).filter(Boolean));
      const loserCtas = new Set(losers.map((l: any) => l.ctaType).filter(Boolean));

      const uniqueWinnerCtas = [...winnerCtas].filter((cta) => !loserCtas.has(cta));
      if (uniqueWinnerCtas.length > 0) {
        items.push({
          id: 'creative-ab-test-cta',
          ruleId: meta.id,
          severity: 'info',
          category: 'creative',
          action: 'review',
          title: 'Teste A/B sugerido: CTA',
          description: `Winners usam CTA "${uniqueWinnerCtas[0]}" que não aparece nos losers. Teste variações com esse CTA em criativos novos.`,
          theme: toThemeInfo(ctx.primaryTheme),
          metrics: {
            winnerCtaTypes: [...winnerCtas].join(', '),
            loserCtaTypes: [...loserCtas].join(', '),
          },
        });
      }
    }

    // Compare headline lengths: short vs long
    const winnerHeadlines = winners
      .map((w: any) => w.headline)
      .filter((h: any): h is string => typeof h === 'string' && h.length > 0);

    if (winnerHeadlines.length >= 2) {
      const avgWinnerLen = winnerHeadlines.reduce((s: number, h: string) => s + h.length, 0) / winnerHeadlines.length;

      const loserHeadlines = losers
        .map((l: any) => l.headline)
        .filter((h: any): h is string => typeof h === 'string' && h.length > 0);

      if (loserHeadlines.length >= 2) {
        const avgLoserLen = loserHeadlines.reduce((s: number, h: string) => s + h.length, 0) / loserHeadlines.length;
        const diff = Math.abs(avgWinnerLen - avgLoserLen);

        if (diff >= 10) {
          const winnerType = avgWinnerLen < avgLoserLen ? 'curtas' : 'longas';
          items.push({
            id: 'creative-ab-test-headline-length',
            ruleId: meta.id,
            severity: 'info',
            category: 'creative',
            action: 'review',
            title: 'Teste A/B sugerido: tamanho da headline',
            description: `Winners têm headlines ${winnerType} (média ${Math.round(avgWinnerLen)} chars) vs losers (média ${Math.round(avgLoserLen)} chars). Teste variações de comprimento.`,
            theme: toThemeInfo(ctx.primaryTheme),
            metrics: {
              avgWinnerHeadlineLength: Math.round(avgWinnerLen),
              avgLoserHeadlineLength: Math.round(avgLoserLen),
            },
          });
        }
      }
    }

    return items;
  },
};
