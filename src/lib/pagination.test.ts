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
});
