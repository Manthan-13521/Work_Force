import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { formatCurrency, formatDate, formatRelativeTime, generateOTP, cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges Tailwind classes correctly", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
});

describe("generateOTP", () => {
  it("returns a 6-digit string", () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it("produces different values on successive calls", () => {
    const otp1 = generateOTP();
    const otp2 = generateOTP();
    expect(otp1).not.toBe(otp2);
  });

  it("generates OTP in valid range", () => {
    for (let i = 0; i < 100; i++) {
      const otp = generateOTP();
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });
});

describe("formatCurrency", () => {
  it("formats in INR locale", () => {
    expect(formatCurrency(1000)).toBe("₹1,000");
    expect(formatCurrency(50000)).toBe("₹50,000");
    expect(formatCurrency(0)).toBe("₹0");
  });

  it("formats large numbers with Indian grouping", () => {
    expect(formatCurrency(100000)).toBe("₹1,00,000");
  });

  it("handles negative amounts", () => {
    expect(formatCurrency(-1000)).toBe("₹-1,000");
  });
});

describe("formatDate", () => {
  it("formats date in en-IN locale", () => {
    const date = new Date("2026-06-15");
    expect(formatDate(date)).toContain("Jun");
  });

  it("returns a string", () => {
    const date = new Date();
    expect(typeof formatDate(date)).toBe("string");
  });

  it("formats edge dates consistently", () => {
    const d1 = formatDate(new Date("2025-01-01"));
    const d2 = formatDate(new Date("2025-01-01"));
    expect(d1).toBe(d2);
  });

  it("handles date at midnight boundary", () => {
    const date = new Date("2025-06-15T00:00:00");
    expect(() => formatDate(date)).not.toThrow();
  });
});

describe("formatRelativeTime", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T12:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for <1 min', () => {
    expect(formatRelativeTime(new Date("2026-07-09T11:59:45Z"))).toBe("Just now");
  });

  it("returns minutes for <60 min", () => {
    const date = new Date("2026-07-09T11:55:00Z");
    expect(formatRelativeTime(date)).toBe("5m ago");
  });

  it("returns hours for <24h", () => {
    const date = new Date("2026-07-09T09:00:00Z");
    expect(formatRelativeTime(date)).toBe("3h ago");
  });

  it("returns days for <7d", () => {
    const date = new Date("2026-07-07T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("2d ago");
  });

  it("returns formatted date for >=7d", () => {
    const date = new Date("2026-01-01");
    expect(formatRelativeTime(date)).toContain("Jan");
  });

  it("handles future dates gracefully", () => {
    const future = new Date(Date.now() + 3600000);
    expect(formatRelativeTime(future)).toBe("Just now");
  });
});
