import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, AlertTriangle, Lightbulb, Star } from "lucide-react";
import type { Insight } from "@/lib/dashboard";

const iconMap = {
  trend: TrendingUp,
  highlight: Star,
  warning: AlertTriangle,
  tip: Lightbulb,
} as const;

const colorMap = {
  trend: "bg-primary/10 text-primary",
  highlight: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning-foreground",
  tip: "bg-secondary text-secondary-foreground",
} as const;

interface InsightCardProps {
  insight: Insight;
  className?: string;
}

export function InsightCard({ insight, className }: InsightCardProps) {
  const Icon = iconMap[insight.type];
  return (
    <Card variant="ghost" className={cn("border", className)} role="status" aria-live="polite">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", colorMap[insight.type])}>
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{insight.message}</p>
            {insight.detail && (
              <p className="text-xs text-muted-foreground mt-1">{insight.detail}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
