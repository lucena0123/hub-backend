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

export const safeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

