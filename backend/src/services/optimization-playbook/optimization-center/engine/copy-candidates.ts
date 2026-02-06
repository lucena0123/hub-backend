import type { OptimizationThemeMatch, OptimizationThemeTargets } from '../../types';
import { getOptimizationTargetsForTheme, inferOptimizationTheme } from '../../theme';
import { safeFloat } from './helpers';
import type { OptimizationRuleContext } from './types';
import { safeText } from './helpers';

const normalizeCopyText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

export type CopyCandidate = {
  snapshotId: string;
  creative: any;
  campaignName: string;
  objectives: string[];
  adNames: string[];
  creativeTheme: OptimizationThemeMatch;
  creativeTargets: OptimizationThemeTargets;
  spend: number;
  conversations: number;
  headline: string | null;
  primaryText: string | null;
  description: string | null;
  ctaType: string | null;
  combined: string;
  combinedNormalized: string;
};

export const getImportantCopyCandidates = (ctx: OptimizationRuleContext): CopyCandidate[] => {
  const { winners, enrichedCreatives, primaryTheme } = ctx;

  const copyCandidateIds = new Set<string>();
  for (const c of winners.slice(0, 5)) copyCandidateIds.add(String(c.snapshotId));
  for (const c of enrichedCreatives.filter((c: any) => c.status !== 'neutral').slice(0, 8)) {
    copyCandidateIds.add(String(c.snapshotId));
  }
  for (const c of enrichedCreatives.slice(0, 6)) copyCandidateIds.add(String(c.snapshotId));

  const copyCandidates = enrichedCreatives.filter((c: any) => copyCandidateIds.has(String(c.snapshotId)));

  const result: CopyCandidate[] = [];

  for (const creative of copyCandidates as any[]) {
    const snapshotId = String(creative.snapshotId);
    const campaignName = Array.isArray(creative.campaigns) && creative.campaigns.length > 0 ? String(creative.campaigns[0] || '') : '';
    const objectives = Array.isArray(creative.objectives) ? creative.objectives.map(String) : [];
    const adNames = Array.isArray(creative.adNames) ? creative.adNames.map(String) : [];
    const creativeTheme = campaignName ? inferOptimizationTheme(campaignName) : primaryTheme;
    const creativeTargets = getOptimizationTargetsForTheme(creativeTheme.themeKey);

    const spend = safeFloat(creative.metrics?.totalSpend);
    const conversations = safeFloat(creative.metrics?.totalConversations);
    const minConv = Math.max(3, Math.floor(creativeTargets.minContactsForEvaluation / 3));

    const isImportant =
      creative.status !== 'neutral' ||
      spend >= creativeTargets.creativeMinSpendWinner ||
      conversations >= minConv;

    if (!isImportant) continue;

    const headline = safeText(creative.headline);
    const primaryText = safeText(creative.primaryText);
    const description = safeText(creative.description);
    const ctaType = typeof creative.ctaType === 'string' && creative.ctaType.trim() ? creative.ctaType.trim() : null;

    const combined = [headline, primaryText, description].filter(Boolean).join(' ');
    const combinedNormalized = combined ? normalizeCopyText(combined) : '';

    result.push({
      snapshotId,
      creative,
      campaignName,
      objectives,
      adNames,
      creativeTheme,
      creativeTargets,
      spend,
      conversations,
      headline,
      primaryText,
      description,
      ctaType,
      combined,
      combinedNormalized,
    });
  }

  return result;
};

export const normalizeCopyForMatch = normalizeCopyText;

