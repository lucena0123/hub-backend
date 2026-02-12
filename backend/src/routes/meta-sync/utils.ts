import { createHash } from 'crypto';
import type { MetaAdCreative } from '../../services/meta-ads-service';

export type IsoDateRange = { since: string; until: string };

export const parseIsoDateUtc = (value: string) => new Date(`${value}T00:00:00Z`);
export const toIsoDateUtc = (date: Date) => date.toISOString().split('T')[0];

export const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const getMetaSyncChunkDays = () => {
  const raw = process.env.META_SYNC_CHUNK_DAYS;
  if (!raw) return 30;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 30;
  return parsed;
};

export const splitDateRange = (since: string, until: string, chunkDays: number): IsoDateRange[] => {
  const start = parseIsoDateUtc(since);
  const end = parseIsoDateUtc(until);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || chunkDays <= 0) {
    return [{ since, until }];
  }

  const ranges: IsoDateRange[] = [];
  let cursor = start;

  while (cursor <= end) {
    let chunkEnd = addUtcDays(cursor, chunkDays - 1);
    if (chunkEnd > end) chunkEnd = end;

    ranges.push({
      since: toIsoDateUtc(cursor),
      until: toIsoDateUtc(chunkEnd),
    });

    cursor = addUtcDays(chunkEnd, 1);
  }

  return ranges;
};

const MAX_PG_PARAMS = 65000;
const MAX_BATCH_ROWS = 1000;

export const getBatchSize = (columnsPerRow: number) =>
  Math.max(1, Math.min(MAX_BATCH_ROWS, Math.floor(MAX_PG_PARAMS / columnsPerRow)));

export const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
};

export const hashPayload = (payload: unknown) =>
  createHash('sha256').update(stableStringify(payload)).digest('hex');

export const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const extractStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        return normalizeText(rec.text ?? rec.message ?? rec.name ?? rec.value);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
  const unique = Array.from(new Set(items));
  return unique.length > 0 ? unique : null;
};

export const extractDestinationUrls = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        return normalizeText(rec.website_url ?? rec.link ?? rec.url ?? rec.value);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
  const unique = Array.from(new Set(items));
  return unique.length > 0 ? unique : null;
};

export const toJsonb = (value: unknown) => {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
};

export const extractCreativeSnapshot = (creative: MetaAdCreative) => {
  const objectStorySpec = (creative as any).object_story_spec ?? null;
  const assetFeedSpec = (creative as any).asset_feed_spec ?? null;
  const isDynamic = Boolean(assetFeedSpec && typeof assetFeedSpec === 'object');

  const assetHeadlines =
    extractStringArray((assetFeedSpec as any)?.titles) ?? extractStringArray((assetFeedSpec as any)?.headlines);
  const assetPrimaryTexts =
    extractStringArray((assetFeedSpec as any)?.bodies) ?? extractStringArray((assetFeedSpec as any)?.primary_texts);
  const assetDescriptions = extractStringArray((assetFeedSpec as any)?.descriptions);
  const assetCtaTypes = extractStringArray((assetFeedSpec as any)?.call_to_action_types);
  const assetDestinationUrls = extractDestinationUrls((assetFeedSpec as any)?.link_urls);

  const linkData = (objectStorySpec as any)?.link_data;
  const videoData = (objectStorySpec as any)?.video_data;

  const storyHeadline = normalizeText(linkData?.name ?? videoData?.title ?? videoData?.name);
  const storyPrimaryText = normalizeText(linkData?.message ?? videoData?.message);
  const storyDescription = normalizeText(linkData?.description);
  const storyDestinationUrl = normalizeText(linkData?.link ?? videoData?.call_to_action?.value?.link);
  const storyCtaType = normalizeText(linkData?.call_to_action?.type ?? videoData?.call_to_action?.type);

  const headline = normalizeText(creative.title) ?? assetHeadlines?.[0] ?? storyHeadline;
  const primaryText = normalizeText(creative.body) ?? assetPrimaryTexts?.[0] ?? storyPrimaryText;
  const description = normalizeText((creative as any).description) ?? assetDescriptions?.[0] ?? storyDescription;
  const ctaType =
    normalizeText((creative as any).call_to_action_type) ?? assetCtaTypes?.[0] ?? storyCtaType;
  const destinationUrl =
    normalizeText((creative as any).link_url) ?? assetDestinationUrls?.[0] ?? storyDestinationUrl;

  const imageUrl = normalizeText((creative as any).image_url);
  const thumbnailUrl = normalizeText((creative as any).thumbnail_url);
  const videoId = normalizeText((creative as any).video_id ?? videoData?.video_id);

  let format: string | null = null;
  const objectType = normalizeText((creative as any).object_type);
  if (isDynamic) format = 'dynamic';
  else if (objectType) format = objectType;
  else if (videoId || videoData) format = 'video';
  else if (linkData?.child_attachments?.length) format = 'carousel';
  else if (imageUrl) format = 'image';

  const contentHash = hashPayload({
    headline,
    primaryText,
    description,
    ctaType,
    destinationUrl,
    imageUrl,
    thumbnailUrl,
    videoId,
    format,
    isDynamic,
    headlines: assetHeadlines,
    primaryTexts: assetPrimaryTexts,
    descriptions: assetDescriptions,
    ctaTypes: assetCtaTypes,
    destinationUrls: assetDestinationUrls,
    objectStorySpec,
    assetFeedSpec,
  });

  return {
    creativeId: creative.id,
    contentHash,
    headline,
    primaryText,
    description,
    ctaType,
    destinationUrl,
    imageUrl,
    thumbnailUrl,
    videoId,
    format,
    isDynamic,
    headlines: assetHeadlines,
    primaryTexts: assetPrimaryTexts,
    descriptions: assetDescriptions,
    ctaTypes: assetCtaTypes,
    destinationUrls: assetDestinationUrls,
    objectStorySpec,
    assetFeedSpec,
    raw: creative as any,
  };
};
