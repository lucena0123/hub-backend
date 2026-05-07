import type { GovernanceNameSuggestion, MetaNamingOverrideRecord } from './types';

const stripAccents = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

type ParsedNameTags = {
  keyed: Map<string, string>;
  bare: string[];
};

const parseBracketTags = (value: string | null | undefined): ParsedNameTags => {
  const keyed = new Map<string, string>();
  const bare: string[] = [];

  if (!value) {
    return { keyed, bare };
  }

  const matches = value.matchAll(/\[([^\]]+)\]/g);
  for (const match of matches) {
    const token = match[1]?.trim();
    if (!token) continue;
    const separatorIndex = token.indexOf('=');
    if (separatorIndex > 0) {
      const key = token.slice(0, separatorIndex).trim().toUpperCase();
      const rawValue = token.slice(separatorIndex + 1).trim();
      if (key) {
        keyed.set(key, rawValue);
      }
      continue;
    }
    bare.push(token);
  }

  return { keyed, bare };
};

const getTagValue = (value: string | null | undefined, key: string) =>
  parseBracketTags(value).keyed.get(key.toUpperCase()) ?? null;

const getDateTag = (value: string | null | undefined) =>
  parseBracketTags(value).bare.find((token) => /^\d{4}-\d{2}-\d{2}$/.test(token)) ?? null;

const toUnderscore = (value: string | null | undefined) => {
  if (!value) return '';
  return stripAccents(String(value))
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
};

const parseDate = (value: string | Date | null | undefined) => {
  if (!value) return '????-??-??';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '????-??-??';
  return date.toISOString().slice(0, 10);
};

const parseObjective = (name: string | null | undefined, objectiveField: string | null | undefined) => {
  const explicit = getTagValue(name, 'OBJ');
  if (explicit) return explicit.toUpperCase();

  if (name) {
    const match = name.match(/Obj\s*:\s*([^|]+)/i);
    if (match) {
      const value = match[1].toLowerCase();
      if (value.includes('mensagem') || value.includes('message') || value.includes('whatsapp')) return 'LEAD';
      if (value.includes('venda') || value.includes('sales')) return 'SALES';
      if (value.includes('audi') || value.includes('alcance') || value.includes('awareness')) return 'AUD';
      if (value.includes('traf') || value.includes('traffic')) return 'TRAFFIC';
    }
  }

  const normalized = String(objectiveField ?? '').toUpperCase();
  if (normalized.includes('LEAD') || normalized.includes('MESSAGE') || normalized.includes('ENGAGEMENT')) return 'LEAD';
  if (normalized.includes('SALES')) return 'SALES';
  if (normalized.includes('TRAFFIC')) return 'TRAFFIC';
  if (normalized.includes('AWARE') || normalized.includes('REACH') || normalized.includes('AUDIENCE')) return 'AUD';
  return '?';
};

const inferFunnel = (objective: string) => {
  if (objective === 'SALES') return 'BOFU';
  if (objective === 'TRAFFIC' || objective === 'AUD') return 'TOFU';
  if (objective === 'LEAD') return 'MOFU';
  return '?';
};

const parseRegion = (campaignName: string | null | undefined) => {
  const explicit = getTagValue(campaignName, 'REG');
  if (explicit) return explicit;
  if (campaignName && /CE\s*\/\s*RJ/i.test(campaignName)) return 'BR-CE+RJ';
  return 'BR';
};

const parseThemeTag = (campaignName: string | null | undefined) => {
  if (!campaignName) return null;
  const tags = parseBracketTags(campaignName);
  const reserved = new Set(['CONT', 'ONETIME', 'TESTE', 'TESTE_CR']);
  const explicit = tags.bare.find((token) => !reserved.has(token.toUpperCase()) && !/^\d{4}-\d{2}-\d{2}$/.test(token));
  if (explicit) return toUnderscore(explicit).toUpperCase() || null;
  return null;
};

const parseProduct = (campaignName: string | null | undefined) => {
  const explicit = getTagValue(campaignName, 'PROD');
  if (explicit) return explicit;
  if (!campaignName) return '';
  let value = campaignName.trim();
  if (value.startsWith('[')) {
    value = value.replace(/^\s*\[[^\]]+\]\s*/, '');
  }
  value = value.split('|')[0].trim();
  return toUnderscore(value);
};

const parseLifecycle = (campaignName: string | null | undefined) => {
  const tags = parseBracketTags(campaignName);
  const explicit = tags.bare.find((token) => ['CONT', 'ONETIME', 'TESTE'].includes(token.toUpperCase()));
  if (explicit) return explicit.toUpperCase();
  if (campaignName && /black\s*friday/i.test(campaignName)) return 'ONETIME';
  return 'CONT';
};

const isPlacementToken = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return normalized === 'BR' || normalized === 'IG' || normalized === 'ADVANTAGE+';
};

const parseAudience = (adsetName: string | null | undefined) => {
  const explicit = getTagValue(adsetName, 'AUD');
  if (explicit) return explicit;
  if (!adsetName) return '?';
  const parts = adsetName.split('|').map((part) => part.trim()).filter(Boolean);
  const kept = parts.filter((part) => !isPlacementToken(part));
  return kept.map((part) => toUnderscore(part)).filter(Boolean).join('_') || '?';
};

const parsePlacement = (adsetName: string | null | undefined) => {
  const explicit = getTagValue(adsetName, 'PLAC');
  if (explicit) return explicit.toUpperCase();
  if (!adsetName) return '?';
  const parts = adsetName.split('|').map((part) => part.trim()).filter(Boolean);
  if (parts.some((part) => /^IG$/i.test(part))) return 'IG';
  if (parts.some((part) => /^ADVANTAGE\+$/i.test(part))) return 'ADVPLUS';
  return '?';
};

const parseAngle = (adName: string | null | undefined) => {
  const explicit = getTagValue(adName, 'ANG');
  if (explicit) return explicit;
  if (!adName) return '?';
  const parts = adName.replace(/\s+/g, ' ').trim().split(/\s[-–—]\s/);
  const candidate = parts.length >= 2 ? parts[1] : adName;
  const withoutTest = candidate.split(/teste/i)[0] || candidate;
  const withoutQuotes = withoutTest.replace(/".*?"/g, '').trim();
  return toUnderscore(withoutQuotes || candidate) || '?';
};

const parseForm = (adName: string | null | undefined) => {
  const explicit = getTagValue(adName, 'FORM');
  if (explicit) return explicit.toUpperCase();
  if (!adName) return '?';
  const normalized = adName.trim().toLowerCase();
  if (normalized.startsWith('imagem')) return 'IMG';
  if (normalized.startsWith('video')) return 'VIDEO';
  return '?';
};

const parseVar = (adName: string | null | undefined) => {
  const explicit = getTagValue(adName, 'VAR');
  if (explicit) return explicit;
  if (!adName) return 'v??';
  const match = adName.match(/\bV(\d{1,2})\b/i);
  if (!match) return 'v??';
  return `v${match[1].padStart(2, '0')}`;
};

const parseCta = (adName: string | null | undefined) => {
  const explicit = getTagValue(adName, 'CTA');
  if (explicit) return explicit.toUpperCase();
  if (!adName) return '?';
  const match = adName.match(/CTA\s*([A-Za-zÀ-ÿ_]+)/i);
  if (match) return toUnderscore(match[1]).toUpperCase() || '?';
  if (/whatsapp/i.test(adName)) return 'WHATSAPP';
  return '?';
};

const parseSequence = (adsetName: string | null | undefined, fallback: number) => {
  if (!adsetName) return String(fallback).padStart(2, '0');
  const match = adsetName.match(/^\s*(\d{1,3})_/);
  if (!match) return String(fallback).padStart(2, '0');
  return match[1]!.padStart(2, '0');
};

const parseHeat = (adsetName: string | null | undefined) =>
  (getTagValue(adsetName, 'HEAT') ?? 'COLD').toUpperCase();

const parseWindow = (adsetName: string | null | undefined) =>
  (getTagValue(adsetName, 'WIN') ?? 'ALL').toUpperCase();

const parseLanguage = (name: string | null | undefined) =>
  (getTagValue(name, 'LANG') ?? 'PT').toUpperCase();

export const isSafeGovernanceSuggestion = (value: string) => {
  if (!value) return false;
  const normalized = value.toUpperCase().replace('[BUDGET=UNK]', '[BUDGET=ALLOWED]');
  return !(
    normalized.includes('UNK') ||
    normalized.includes('?') ||
    normalized.includes('V??') ||
    normalized.includes('[????-??-??]')
  );
};

export const buildCampaignNameSuggestion = (params: {
  entityExternalId: string;
  currentName: string | null;
  objective?: string | null;
  createdTime?: string | Date | null;
}): GovernanceNameSuggestion => {
  const objective = parseObjective(params.currentName, params.objective);
  const funnel = getTagValue(params.currentName, 'FUNIL') ?? inferFunnel(objective);
  const product = parseProduct(params.currentName);
  const themeTag = parseThemeTag(params.currentName);
  const lifecycle = parseLifecycle(params.currentName);
  const region = parseRegion(params.currentName);
  const date = params.createdTime ? parseDate(params.createdTime) : (getDateTag(params.currentName) ?? '????-??-??');
  const language = parseLanguage(params.currentName);
  const budget = getTagValue(params.currentName, 'BUDGET') ?? 'UNK';

  const parts = [`[OBJ=${objective}]`, `[PROD=${product}]`, `[FUNIL=${funnel}]`];
  if (themeTag) parts.push(`[${themeTag}]`);
  parts.push(`[${lifecycle}]`, `[BUDGET=${budget}]`, `[REG=${region}]`, `[LANG=${language}]`, `[${date}]`);

  const expectedName = `${parts.join(' ')} |CAM`;
  return {
    entityType: 'campaign',
    entityExternalId: params.entityExternalId,
    currentName: params.currentName,
    expectedName,
    safeToApply: isSafeGovernanceSuggestion(expectedName),
    overrideApplied: false,
    overrideId: null,
    tokens: { objective, funnel, product, themeTag, lifecycle, region, date },
  };
};

export const buildAdSetNameSuggestion = (params: {
  entityExternalId: string;
  currentName: string | null;
  campaignName: string | null;
  campaignObjective?: string | null;
  createdTime?: string | Date | null;
  sequenceNumber: number;
}): GovernanceNameSuggestion => {
  const audience = parseAudience(params.currentName);
  const placement = parsePlacement(params.currentName);
  const objective = parseObjective(params.campaignName, params.campaignObjective);
  const funnel = getTagValue(params.currentName, 'FUNIL') ?? inferFunnel(objective);
  const region = parseRegion(params.campaignName);
  const date = params.createdTime ? parseDate(params.createdTime) : (getDateTag(params.currentName) ?? '????-??-??');
  const sequence = parseSequence(params.currentName, params.sequenceNumber);
  const heat = parseHeat(params.currentName);
  const window = parseWindow(params.currentName);
  const language = parseLanguage(params.currentName);
  const explicitRegion = parseRegion(params.currentName);

  const expectedName = `${sequence}_[AUD=${audience}] [HEAT=${heat}] [WIN=${window}] [FUNIL=${funnel}] [PLAC=${placement}] [REG=${explicitRegion || region}] [LANG=${language}] [${date}] |AS`;

  return {
    entityType: 'adset',
    entityExternalId: params.entityExternalId,
    currentName: params.currentName,
    expectedName,
    safeToApply: isSafeGovernanceSuggestion(expectedName),
    overrideApplied: false,
    overrideId: null,
    tokens: { audience, placement, objective, funnel, region: explicitRegion || region, date, sequence: Number(sequence) },
  };
};

export const buildAdNameSuggestion = (params: {
  entityExternalId: string;
  currentName: string | null;
  campaignName: string | null;
  createdTime?: string | Date | null;
}): GovernanceNameSuggestion => {
  const angle = parseAngle(params.currentName);
  const form = parseForm(params.currentName);
  const variation = parseVar(params.currentName);
  const cta = parseCta(params.currentName);
  const region = getTagValue(params.currentName, 'REG') ?? parseRegion(params.campaignName);
  const date = params.createdTime ? parseDate(params.createdTime) : (getDateTag(params.currentName) ?? '????-??-??');
  const language = parseLanguage(params.currentName);
  const testTag = parseBracketTags(params.currentName).bare.some((token) => token.toUpperCase() === 'TESTE_CR') ? ' [TESTE_CR]' : '';

  const expectedName = `AD_[ANG=${angle}] [FORM=${form}] [VAR=${variation}]${testTag} [CTA=${cta}] [LANG=${language}] [REG=${region}] [${date}] |AD`;

  return {
    entityType: 'ad',
    entityExternalId: params.entityExternalId,
    currentName: params.currentName,
    expectedName,
    safeToApply: isSafeGovernanceSuggestion(expectedName),
    overrideApplied: false,
    overrideId: null,
    tokens: { angle, form, variation, cta, region, date, isTest: Boolean(testTag) },
  };
};

const scoreOverride = (suggestion: GovernanceNameSuggestion, override: MetaNamingOverrideRecord) => {
  let score = override.priority ?? 0;
  if (override.entityExternalId && override.entityExternalId === suggestion.entityExternalId) score += 1000;

  const product = String(suggestion.tokens.product ?? '');
  const themeTag = String(suggestion.tokens.themeTag ?? '');
  const audience = String(suggestion.tokens.audience ?? '');

  if (override.productKey && override.productKey === product) score += 100;
  if (override.themeKey && override.themeKey === themeTag) score += 100;
  if (override.audienceKey && override.audienceKey === audience) score += 100;
  return score;
};

export const applyNamingOverride = (
  suggestion: GovernanceNameSuggestion,
  overrides: MetaNamingOverrideRecord[],
): GovernanceNameSuggestion => {
  const applicable = overrides
    .filter((override) => override.active && override.entityType === suggestion.entityType)
    .filter((override) => {
      if (override.entityExternalId && override.entityExternalId !== suggestion.entityExternalId) return false;
      if (override.productKey && override.productKey !== suggestion.tokens.product) return false;
      if (override.themeKey && override.themeKey !== suggestion.tokens.themeTag) return false;
      if (override.audienceKey && override.audienceKey !== suggestion.tokens.audience) return false;
      return true;
    })
    .sort((left, right) => scoreOverride(suggestion, right) - scoreOverride(suggestion, left));

  const winner = applicable[0];
  if (!winner?.overridePayload?.expectedName) {
    return suggestion;
  }

  return {
    ...suggestion,
    expectedName: String(winner.overridePayload.expectedName),
    safeToApply: isSafeGovernanceSuggestion(String(winner.overridePayload.expectedName)),
    overrideApplied: true,
    overrideId: winner.id,
  };
};

