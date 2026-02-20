export const calculateCPL = (spend: number, leads: number): number => {
  if (leads === 0) return 0;
  return Number((spend / leads).toFixed(2));
};

export const calculateCPA = (spend: number, conversions: number): number => {
  if (conversions === 0) return 0;
  return Number((spend / conversions).toFixed(2));
};

export const calculateCPC = (spend: number, clicks: number): number => {
  if (clicks === 0) return 0;
  return Number((spend / clicks).toFixed(2));
};

export const calculateCTR = (clicks: number, impressions: number): number => {
  if (impressions === 0) return 0;
  return Number(((clicks / impressions) * 100).toFixed(2));
};

export const calculateROAS = (revenue: number, spend: number): number => {
  if (spend === 0) return 0;
  return Number((revenue / spend).toFixed(2));
};

export const calculateCPM = (spend: number, impressions: number): number => {
  if (impressions === 0) return 0;
  return Number(((spend / impressions) * 1000).toFixed(2));
};

