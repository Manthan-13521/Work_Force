import { describe, it, expect } from "vitest";
import { getPaginationParams, buildPaginatedResponse, PAGE_SIZE } from "./pagination";

describe("getPaginationParams", () => {
  it("returns defaults when no params", () => {
    const sp = new URLSearchParams();
    const result = getPaginationParams(sp);
    expect(result.cursor).toBeUndefined();
    expect(result.limit).toBe(PAGE_SIZE);
  });

  it("parses cursor from searchParams", () => {
    const sp = new URLSearchParams("cursor=abc123");
    const result = getPaginationParams(sp);
    expect(result.cursor).toBe("abc123");
  });

  it("clamps limit to 100", () => {
    const sp = new URLSearchParams("limit=999");
    const result = getPaginationParams(sp);
    expect(result.limit).toBe(100);
  });

  it("uses default limit when limit=0", () => {
    const sp = new URLSearchParams("limit=0");
    const result = getPaginationParams(sp);
    expect(result.limit).toBe(PAGE_SIZE);
  });

  it("uses default limit when limit is negative", () => {
    const sp = new URLSearchParams("limit=-5");
    const result = getPaginationParams(sp);
    expect(result.limit).toBe(PAGE_SIZE);
  });

  it("parses limit from searchParams", () => {
    const sp = new URLSearchParams("limit=10");
    const result = getPaginationParams(sp);
    expect(result.limit).toBe(10);
  });

  it("handles empty cursor string as undefined", () => {
    const sp = new URLSearchParams("cursor=");
    const result = getPaginationParams(sp);
    expect(result.cursor).toBeUndefined();
  });

  it("handles non-numeric limit string", () => {
    const sp = new URLSearchParams("limit=abc");
    const result = getPaginationParams(sp);
    expect(result.limit).toBe(PAGE_SIZE);
  });

  it("handles NaN limit gracefully", () => {
    const sp = new URLSearchParams("limit=NaN");
    const result = getPaginationParams(sp);
    expect(result.limit).toBe(PAGE_SIZE);
  });

  it("parses limit=1 to 1", () => {
    const sp = new URLSearchParams("limit=1");
    const result = getPaginationParams(sp);
    expect(result.limit).toBe(1);
  });
});

describe("buildPaginatedResponse", () => {
  it("returns hasMore=false when items <= limit", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const result = buildPaginatedResponse(items, 5);
    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("returns hasMore=true when items > limit", () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const result = buildPaginatedResponse(items, 2);
    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("2");
  });

  it("uses last item id as nextCursor", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const result = buildPaginatedResponse(items, 2);
    expect(result.nextCursor).toBe("b");
  });

  it("returns hasMore=false with empty items", () => {
    const result = buildPaginatedResponse([], 10);
    expect(result.data).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("handles single item correctly", () => {
    const items = [{ id: "1" }];
    const result = buildPaginatedResponse(items, 1);
    expect(result.data).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("handles exact limit (no hasMore)", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const result = buildPaginatedResponse(items, 2);
    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("handles items without id field", () => {
    const items = [{ name: "a" }, { name: "b" }, { name: "c" }] as Record<string, unknown>[];
    const result = buildPaginatedResponse(items, 2);
    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeNull();
  });
});
