import { OPTIMIZATION_CENTER_PLAYBOOK_V1 } from './playbook-v1';
import type { OptimizationThemeMatch, OptimizationThemeTargets } from './types';

export const getOptimizationTargetsForTheme = (themeKey: string): OptimizationThemeTargets => {
  const base = OPTIMIZATION_CENTER_PLAYBOOK_V1.defaults;
  const theme = OPTIMIZATION_CENTER_PLAYBOOK_V1.themes.find((t) => t.key === themeKey);
  return { ...base, ...(theme?.targets ?? {}) };
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

export const inferOptimizationTheme = (campaignName: string): OptimizationThemeMatch => {
  const name = campaignName || '';
  const bracketTag = name.match(/\[([^\]]+)\]/)?.[1] ?? null;

  if (bracketTag) {
    const normalizedTag = normalize(bracketTag).replace(/\s+/g, '_').toUpperCase();
    const byTag = OPTIMIZATION_CENTER_PLAYBOOK_V1.themes.find((theme) =>
      theme.tags.some((tag) => normalize(tag).replace(/\s+/g, '_').toUpperCase() === normalizedTag)
    );
    if (byTag) {
      return {
        themeKey: byTag.key,
        themeName: byTag.name,
        matchedBy: 'tag',
        matchedValue: bracketTag,
      };
    }
  }

  const normalizedName = normalize(name);
  for (const theme of OPTIMIZATION_CENTER_PLAYBOOK_V1.themes) {
    if (theme.key === 'geral') continue;
    for (const keyword of theme.keywords) {
      const normalizedKeyword = normalize(keyword);
      if (normalizedKeyword && normalizedName.includes(normalizedKeyword)) {
        return {
          themeKey: theme.key,
          themeName: theme.name,
          matchedBy: 'keyword',
          matchedValue: keyword,
        };
      }
    }
  }

  const fallback = OPTIMIZATION_CENTER_PLAYBOOK_V1.themes.find((t) => t.key === 'geral')!;
  return { themeKey: fallback.key, themeName: fallback.name, matchedBy: 'default', matchedValue: null };
};

