"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  unstable_retry: retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">500</h1>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            An unexpected error occurred. Our team has been notified.
          </p>
          <Button onClick={() => retry()}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
