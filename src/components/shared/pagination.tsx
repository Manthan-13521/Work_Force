"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  hasMore: boolean;
  nextCursor: string | null;
  className?: string;
}

export function Pagination({ hasMore, nextCursor, className }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCursor = searchParams.get("cursor");

  function goToPage(cursor: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (cursor) {
      params.set("cursor", cursor);
    } else {
      params.delete("cursor");
    }
    router.push(`?${params.toString()}`);
  }

  if (!hasMore && !currentCursor) return null;

  return (
    <div className={cn("flex items-center justify-center gap-2 mt-8", className)}>
      {currentCursor && (
        <button
          onClick={() => goToPage(null)}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-sm font-medium hover:bg-accent transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {hasMore && nextCursor && (
        <button
          onClick={() => goToPage(nextCursor)}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-sm font-medium hover:bg-accent transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
