export function formatPercentage(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export function timesMore(a: number, b: number): string {
  if (b <= 0) return "N/A";
  const ratio = Math.round((a / b) * 10) / 10;
  return `${ratio}×`;
}

export function formatScore(value: number): string {
  return `${Math.round(Math.max(0, Math.min(100, value)))}`;
}

export function scoreLabel(value: number): string {
  if (value >= 80) return "Excellent";
  if (value >= 60) return "Good";
  if (value >= 40) return "Fair";
  return "Needs Improvement";
}
