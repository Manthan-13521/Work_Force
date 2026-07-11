import { describe, it, expect, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { JWT_SECRET: "test-secret-that-is-at-least-32-characters-long!!", NODE_ENV: "test" },
}));

vi.mock("./prisma", () => ({ prisma: {} }));
vi.mock("./redis", () => ({
  redisSet: vi.fn(),
  redisGet: vi.fn(),
  redisDel: vi.fn(),
  checkRateLimit: vi.fn().mockResolvedValue(true),
  atomicReadDelete: vi.fn(),
}));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

import { signToken, verifyToken } from "./auth";
import { generateOTP } from "./utils";

describe("signToken / verifyToken", () => {
  it("signs and verifies a valid token", () => {
    const payload = { userId: "abc123", email: "worker@example.com", role: "WORKER" };
    const token = signToken(payload);
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("abc123");
    expect(decoded!.email).toBe("worker@example.com");
    expect(decoded!.role).toBe("WORKER");
  });

  it("returns null for invalid token", () => {
    expect(verifyToken("invalid-token")).toBeNull();
  });

  it("returns null for tampered token", () => {
    const token = signToken({ userId: "abc", email: "worker@example.com", role: "WORKER" });
    const tampered = token.slice(0, -5) + "xxxxx";
    expect(verifyToken(tampered)).toBeNull();
  });

  it("returns null for empty token", () => {
    expect(verifyToken("")).toBeNull();
  });
});

describe("generateOTP", () => {
  it("generates a 6-digit string", () => {
    const otp = generateOTP();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("generates different values on successive calls", () => {
    const otp1 = generateOTP();
    const otp2 = generateOTP();
    expect(otp1).not.toBe(otp2);
  });
});

describe("verifyToken type guard", () => {
  it("rejects token with missing fields", () => {
    const token = signToken({ userId: "abc", email: "worker@example.com", role: "WORKER" });
    const decoded = verifyToken(token);
    expect(decoded).toHaveProperty("userId");
    expect(decoded).toHaveProperty("email");
    expect(decoded).toHaveProperty("role");
  });
});
