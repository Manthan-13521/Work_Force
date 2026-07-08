"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function WorkerError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Something went wrong"
      message={error.message || "An unexpected error occurred."}
      onRetry={reset}
    />
  );
}
