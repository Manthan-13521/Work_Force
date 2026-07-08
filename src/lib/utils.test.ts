import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatRelativeTime } from "./utils";

describe("formatCurrency", () => {
  it("formats in INR locale", () => {
    expect(formatCurrency(1000)).toBe("₹1,000");
    expect(formatCurrency(50000)).toBe("₹50,000");
    expect(formatCurrency(0)).toBe("₹0");
  });
});

describe("formatDate", () => {
  it("formats date in en-IN locale", () => {
    const date = new Date("2026-06-15");
    expect(formatDate(date)).toContain("Jun");
  });
});

describe("formatRelativeTime", () => {
  it('returns "Just now" for <1 min', () => {
    expect(formatRelativeTime(new Date())).toBe("Just now");
  });

  it("returns minutes for <60 min", () => {
    const date = new Date(Date.now() - 5 * 60000);
    expect(formatRelativeTime(date)).toBe("5m ago");
  });

  it("returns hours for <24h", () => {
    const date = new Date(Date.now() - 3 * 3600000);
    expect(formatRelativeTime(date)).toBe("3h ago");
  });

  it("returns days for <7d", () => {
    const date = new Date(Date.now() - 2 * 86400000);
    expect(formatRelativeTime(date)).toBe("2d ago");
  });

  it("returns formatted date for >=7d", () => {
    const date = new Date("2026-01-01");
    expect(formatRelativeTime(date)).toContain("Jan");
  });
});
