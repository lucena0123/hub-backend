export const determinePerformanceStatus = (metrics: {
  roas: number;
  cpl: number;
  ctr: number;
  budgetUtilization: number;
}): 'excellent' | 'good' | 'fair' | 'poor' => {
  // Simple scoring system (can be improved with industry benchmarks)
  let score = 0;

  // ROAS scoring
  if (metrics.roas >= 4) score += 3;
  else if (metrics.roas >= 2) score += 2;
  else if (metrics.roas >= 1) score += 1;

  // CTR scoring (Meta Ads: ~1% é um baseline comum)
  if (metrics.ctr >= 2) score += 3;
  else if (metrics.ctr >= 1) score += 2;
  else if (metrics.ctr >= 0.9) score += 1;

  // CPL scoring (interpretado como custo por contato: lead/conversa/resultado primário)
  if (metrics.cpl > 0 && metrics.cpl <= 12) score += 3;
  else if (metrics.cpl > 0 && metrics.cpl <= 18) score += 2;
  else if (metrics.cpl > 0 && metrics.cpl <= 25) score += 1;

  // Budget utilization (not overspending)
  if (metrics.budgetUtilization <= 100 && metrics.budgetUtilization >= 80) score += 2;
  else if (metrics.budgetUtilization > 100) score -= 2;

  // Map score to status
  if (score >= 7) return 'excellent';
  if (score >= 5) return 'good';
  if (score >= 3) return 'fair';
  return 'poor';
};
