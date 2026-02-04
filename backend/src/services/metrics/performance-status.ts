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

  // CTR scoring (assuming 2%+ is good)
  if (metrics.ctr >= 3) score += 3;
  else if (metrics.ctr >= 2) score += 2;
  else if (metrics.ctr >= 1) score += 1;

  // Budget utilization (not overspending)
  if (metrics.budgetUtilization <= 100 && metrics.budgetUtilization >= 80) score += 2;
  else if (metrics.budgetUtilization > 100) score -= 2;

  // Map score to status
  if (score >= 7) return 'excellent';
  if (score >= 5) return 'good';
  if (score >= 3) return 'fair';
  return 'poor';
};

