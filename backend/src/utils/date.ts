export const toIsoDateUtc = (date: Date) => date.toISOString().split('T')[0];

export const shiftIsoDateUtc = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDateUtc(date);
};

