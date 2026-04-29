export function matchRateColor(rate: number): 'success' | 'default' | 'warning' {
  if (rate >= 85) return 'success';
  if (rate >= 70) return 'default';
  return 'warning';
}
