"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4" role="alert">
      <div className="mb-4 p-3 rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          Try again
        </Button>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        If this persists, please contact support.
      </p>
    </div>
  );
}
