export type Direction = "up" | "down" | "flat";

export type Confidence = "high" | "medium" | "low";

export interface Trend<T = number> {
  value: T;
  previous: T;
  delta: number;
  percentage: number;
  direction: Direction;
  confidence: Confidence;
  summary: string;
}

export function computeTrend(
  current: number,
  previous: number,
  label: string,
): Trend {
  const delta = current - previous;
  const percentage =
    previous > 0
      ? Math.round((delta / previous) * 1000) / 10
      : current > 0
        ? 100
        : 0;
  const direction: Direction =
    percentage > 5 ? "up" : percentage < -5 ? "down" : "flat";
  const absPct = Math.abs(percentage);

  let confidence: Confidence = "high";
  if (previous === 0 && current === 0) confidence = "low";
  else if (previous < 5 || current < 5) confidence = "medium";

  let summary: string;
  if (direction === "flat") {
    summary = `${label} remained stable compared with the previous period.`;
  } else if (direction === "up") {
    summary = `${label} increased ${absPct}% compared with the previous period.`;
  } else {
    summary = `${label} decreased ${absPct}% compared with the previous period.`;
  }

  return { value: current, previous, delta, percentage, direction, confidence, summary };
}

export function computeMultiTrend(
  items: { current: number; previous: number; label: string }[],
): Trend[] {
  return items.map((item) => computeTrend(item.current, item.previous, item.label));
}
