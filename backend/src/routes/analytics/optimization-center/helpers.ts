const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

export const safeInt = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const safeFloat = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const percentChange = (current: number, previous: number) => {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
};

export const formatCurrency = (value: number) => brlFormatter.format(value);

export const formatPercent = (value: number) => `${value.toFixed(0)}%`;

export const getDaysForPeriod = (period: string) => {
  return period === '7d'
    ? 7
    : period === '14d'
      ? 14
      : period === '60d'
        ? 60
        : period === '90d'
          ? 90
          : 30;
};

export const toJsonStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const list = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  return list.length > 0 ? list : null;
};

export const safeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const pickText = (single: unknown, list: unknown): string | null => {
  return safeText(single) ?? safeText(toJsonStringArray(list)?.[0]) ?? null;
};

