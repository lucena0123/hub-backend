import { OPTIMIZATION_CENTER_PLAYBOOK_V1_DEFAULTS } from './optimization-center/v1/defaults';
import { OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES } from './optimization-center/v1/themes';
import type { OptimizationThemeMatch, OptimizationThemeTargets } from './types';

export const getOptimizationTargetsForTheme = (
  themeKey: string,
  clientOverrides?: Partial<OptimizationThemeTargets> | null,
): OptimizationThemeTargets => {
  const base = OPTIMIZATION_CENTER_PLAYBOOK_V1_DEFAULTS;
  const theme = OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES.find((t) => t.key === themeKey);
  return { ...base, ...(theme?.targets ?? {}), ...(clientOverrides ?? {}) };
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

const normalizeKey = (value: string) => normalize(value).replace(/\s+/g, '_');

const findThemeByKey = (themeKey: string) => {
  const key = normalizeKey(themeKey);
  return OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES.find((theme) => normalizeKey(theme.key) === key);
};

export const inferOptimizationTheme = (campaignName: string): OptimizationThemeMatch => {
  const name = campaignName || '';
  const bracketTag = name.match(/\[([^\]]+)\]/)?.[1] ?? null;

  if (bracketTag) {
    const normalizedTag = normalize(bracketTag).replace(/\s+/g, '_').toUpperCase();
    const byTag = OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES.find((theme) =>
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
  for (const theme of OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES) {
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

  const fallback = OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES.find((t) => t.key === 'geral')!;
  return { themeKey: fallback.key, themeName: fallback.name, matchedBy: 'default', matchedValue: null };
};

export const resolveOptimizationTheme = (opts: {
  campaignName?: string | null;
  themeKey?: string | null;
  subthemeKey?: string | null;
}): OptimizationThemeMatch => {
  const campaignName = opts.campaignName ?? '';

  if (opts.subthemeKey) {
    const subtheme = findThemeByKey(opts.subthemeKey);
    if (subtheme) {
      return {
        themeKey: subtheme.key,
        themeName: subtheme.name,
        matchedBy: 'manual',
        matchedValue: opts.subthemeKey,
      };
    }
  }

  if (opts.themeKey) {
    const theme = findThemeByKey(opts.themeKey);
    if (theme) {
      return {
        themeKey: theme.key,
        themeName: theme.name,
        matchedBy: 'manual',
        matchedValue: opts.themeKey,
      };
    }
  }

  return inferOptimizationTheme(campaignName);
};
