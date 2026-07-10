import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { Direction } from "@/lib/dashboard";

interface TrendBadgeProps {
  direction: Direction;
  percentage: number;
  className?: string;
}

const colorMap: Record<Direction, string> = {
  up: "text-success bg-success/10",
  down: "text-destructive bg-destructive/10",
  flat: "text-muted-foreground bg-muted",
};

const iconMap: Record<Direction, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
};

export function TrendBadge({ direction, percentage, className }: TrendBadgeProps) {
  const Icon = iconMap[direction];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", colorMap[direction], className)}
      aria-label={`${direction === "up" ? "Increased" : direction === "down" ? "Decreased" : "Stable"} by ${Math.abs(percentage)}%`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {Math.abs(percentage)}%
    </span>
  );
}
