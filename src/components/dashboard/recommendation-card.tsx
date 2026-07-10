import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles, RefreshCw, Shield } from "lucide-react";
import type { Recommendation } from "@/lib/dashboard";

const iconMap = {
  action: Sparkles,
  improvement: RefreshCw,
  maintenance: Shield,
} as const;

interface RecommendationCardProps {
  recommendation: Recommendation;
  className?: string;
}

export function RecommendationCard({ recommendation, className }: RecommendationCardProps) {
  const Icon = iconMap[recommendation.type];
  return (
    <Card variant="ghost" className={cn("border", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{recommendation.action}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{recommendation.description}</p>
          </div>
          {recommendation.link && (
            <Link href={recommendation.link}>
              <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-xs" aria-label={`Go to ${recommendation.action}`}>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
