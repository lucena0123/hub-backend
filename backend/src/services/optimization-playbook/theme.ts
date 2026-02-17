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
const normalizeTag = (value: string) => normalize(value).replace(/\s+/g, '_').toUpperCase();

const findThemeByKey = (themeKey: string) => {
  const key = normalizeKey(themeKey);
  return OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES.find((theme) => normalizeKey(theme.key) === key);
};

const findThemeByTag = (tag: string) => {
  const normalizedTag = normalizeTag(tag);
  return OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES.find((theme) => {
    if (normalizeTag(theme.key) === normalizedTag) return true;
    return theme.tags.some((t) => normalizeTag(t) === normalizedTag);
  });
};

const extractBracketTags = (value: string) => {
  const tags: string[] = [];
  const regex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value)) !== null) {
    const tag = match[1]?.trim();
    if (tag) tags.push(tag);
  }
  return tags;
};

export const inferOptimizationTheme = (campaignName: string): OptimizationThemeMatch => {
  const name = campaignName || '';
  const bracketTags = extractBracketTags(name);

  if (bracketTags.length > 0) {
    const kvTags = new Map<string, string>();
    const flagTags: string[] = [];

    for (const tag of bracketTags) {
      if (tag.includes('=')) {
        const [rawKey, rawValue] = tag.split('=', 2);
        const key = normalizeKey(rawKey || '');
        const value = (rawValue || '').trim();
        if (key && value) kvTags.set(key, value);
      } else {
        flagTags.push(tag);
      }
    }

    const themeFromKv = kvTags.get('theme') ?? kvTags.get('tema');
    if (themeFromKv) {
      const byKv = findThemeByTag(themeFromKv);
      if (byKv) {
        return {
          themeKey: byKv.key,
          themeName: byKv.name,
          matchedBy: 'tag',
          matchedValue: themeFromKv,
        };
      }
    }

    for (const flag of flagTags) {
      const byTag = findThemeByTag(flag);
      if (byTag) {
        return {
          themeKey: byTag.key,
          themeName: byTag.name,
          matchedBy: 'tag',
          matchedValue: flag,
        };
      }
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
