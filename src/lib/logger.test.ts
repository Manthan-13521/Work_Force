import { describe, it, expect } from "vitest";
import { redact } from "./logger";

describe("logger redact", () => {
  it("redacts 10-digit phone numbers", () => {
    expect(redact("9876543210")).toBe("98******10");
  });

  it("redacts 6-digit OTP values", () => {
    expect(redact("123456")).toBe("******");
  });

  it("passes through non-sensitive strings", () => {
    expect(redact("hello")).toBe("hello");
    expect(redact("")).toBe("");
  });

  it("passes through non-string values", () => {
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBe(null);
    expect(redact({ key: "value" })).toEqual({ key: "value" });
  });
});
