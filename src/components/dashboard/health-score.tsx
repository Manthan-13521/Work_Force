import { cn } from "@/lib/utils";
import type { HealthScore } from "@/lib/dashboard";

interface HealthScoreProps {
  score: HealthScore;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { ring: "h-14 w-14", text: "text-lg", label: "text-[10px]" },
  md: { ring: "h-20 w-20", text: "text-2xl", label: "text-xs" },
  lg: { ring: "h-28 w-28", text: "text-3xl", label: "text-sm" },
};

const colorMap = {
  Excellent: "stroke-success",
  Good: "stroke-info",
  Fair: "stroke-warning",
  "Needs Improvement": "stroke-destructive",
} as const;

export function HealthScoreRing({ score, size = "md", className }: HealthScoreProps) {
  const s = sizeMap[size];
  const radius = size === "sm" ? 24 : size === "md" ? 36 : 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score.score / 100) * circumference;
  const strokeColor = colorMap[score.label as keyof typeof colorMap] || "stroke-muted";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" role="img" aria-label={`Health score: ${score.score} out of 100, ${score.label}`}>
        <svg className={cn(s.ring, "transform -rotate-90")} viewBox={`0 0 ${(radius + 8) * 2} ${(radius + 8) * 2}`}>
          <circle
            cx={radius + 8}
            cy={radius + 8}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={size === "sm" ? 4 : 6}
            className="text-muted"
          />
          <circle
            cx={radius + 8}
            cy={radius + 8}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={size === "sm" ? 4 : 6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-700", strokeColor)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold tabular-nums", s.text)}>{score.score}</span>
        </div>
      </div>
      <span className={cn("font-medium text-muted-foreground", s.label)}>{score.label}</span>
    </div>
  );
}

interface HealthScoreListProps {
  score: HealthScore;
  className?: string;
}

export function HealthScoreDetails({ score, className }: HealthScoreListProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reasons</h4>
      <ul className="space-y-1">
        {score.reasons.map((reason, i) => (
          <li key={i} className="text-sm text-foreground flex items-start gap-2">
            <span className="text-success mt-0.5" aria-hidden>•</span>
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
