export const PAGE_SIZE = 20;

export function getPaginationParams(searchParams: URLSearchParams) {
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(
    Number(searchParams.get("limit")) || PAGE_SIZE,
    100
  );
  return { cursor, limit };
}

export function buildPaginatedResponse<T>(
  items: T[],
  limit: number
): {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
} {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const last = data[data.length - 1] as Record<string, unknown> | undefined;
  const nextCursor = hasMore && typeof last?.id === "string" ? last.id : null;
  return { data, nextCursor, hasMore };
}
