"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  cursor?: string | null;
  nextCursor?: string | null;
  hasMore: boolean;
}

export function Pagination({ cursor, nextCursor, hasMore }: PaginationProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentCursor = searchParams.get("cursor");
  const effectiveCursor = cursor ?? nextCursor ?? null;

  function navigate(newCursor: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (newCursor) {
      params.set("cursor", newCursor);
    } else {
      params.delete("cursor");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  if (!effectiveCursor && !hasMore && !currentCursor) return null;

  return (
    <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        disabled={!currentCursor}
        onClick={() => navigate(null)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      {hasMore && effectiveCursor && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(effectiveCursor)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </nav>
  );
}
