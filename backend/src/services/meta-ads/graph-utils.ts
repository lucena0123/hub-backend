export function normalizeMetaAccountId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^act_/i, '');
}

export function buildMetaGraphUrl(apiVersion: string, path: string, query?: Record<string, string>) {
  const base = `https://graph.facebook.com/${apiVersion}/${path}`;
  if (!query || Object.keys(query).length === 0) return base;
  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}
