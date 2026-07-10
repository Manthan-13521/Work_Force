import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workerProfile: {
      upsert: vi.fn(),
    },
    employerProfile: {
      upsert: vi.fn(),
    },
    plan: {
      findFirst: vi.fn(),
    },
    jobCredit: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  signToken: vi.fn().mockReturnValue("mock-token"),
  setAuthCookie: vi.fn(),
  removeAuthCookie: vi.fn(),
  storeOTP: vi.fn(),
  verifyOTP: vi.fn(),
  sendOTP: vi.fn(),
  checkOTPRateLimit: vi.fn(),
  checkVerifyRateLimit: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  generateOTP: vi.fn().mockReturnValue("123456"),
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { redirect: redirectMock } = vi.hoisted(() => {
  const mock = vi.fn();
  return { redirect: mock };
});
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";
import { requestOTP, verifyLoginOTP, completeWorkerProfile, completeEmployerProfile, logout } from "./auth.actions";

describe("requestOTP", () => {
  it("returns error for invalid phone number", async () => {
    const result = await requestOTP("invalid");
    expect(result).toEqual({ error: "Invalid phone number" });
  });

  it("returns error when rate limited", async () => {
    vi.mocked(auth.checkOTPRateLimit).mockResolvedValueOnce(false);
    const result = await requestOTP("9876543210");
    expect(result).toEqual({ error: "Too many requests. Please try again later." });
  });

  it("sends OTP on valid request", async () => {
    vi.mocked(auth.checkOTPRateLimit).mockResolvedValueOnce(true);
    const result = await requestOTP("9876543210");
    expect(result).toEqual({ success: true });
    expect(auth.storeOTP).toHaveBeenCalledWith("9876543210", "123456");
    expect(auth.sendOTP).toHaveBeenCalledWith("9876543210", "123456");
  });
});

describe("verifyLoginOTP", () => {
  it("returns error for invalid phone or OTP format", async () => {
    const result = await verifyLoginOTP("", "");
    expect(result).toEqual({ error: "Invalid phone or OTP format" });
  });

  it("returns error when verify rate limited", async () => {
    vi.mocked(auth.checkVerifyRateLimit).mockResolvedValueOnce(false);
    const result = await verifyLoginOTP("9876543210", "123456");
    expect(result).toEqual({ error: "Too many attempts. Please try again later." });
  });

  it("returns error for invalid OTP", async () => {
    vi.mocked(auth.checkVerifyRateLimit).mockResolvedValueOnce(true);
    vi.mocked(auth.verifyOTP).mockResolvedValueOnce(false);
    const result = await verifyLoginOTP("9876543210", "000000");
    expect(result).toEqual({ error: "Invalid or expired OTP" });
  });

  it("creates new user and returns success", async () => {
    vi.mocked(auth.checkVerifyRateLimit).mockResolvedValueOnce(true);
    vi.mocked(auth.verifyOTP).mockResolvedValueOnce(true);
    const mockFind = vi.mocked(prisma.user.findUnique);
    mockFind.mockResolvedValueOnce(null);
    const mockCreate = vi.mocked(prisma.user.create);
    mockCreate.mockResolvedValueOnce({ id: "new-id", phone: "9876543210", role: "WORKER", status: "ACTIVE" } as any);

    const result = await verifyLoginOTP("9876543210", "123456");
    expect(result).toEqual({ success: true, role: "WORKER", userId: "new-id" });
    expect(auth.signToken).toHaveBeenCalled();
    expect(auth.setAuthCookie).toHaveBeenCalledWith("mock-token");
  });

  it("returns error for suspended user", async () => {
    vi.mocked(auth.checkVerifyRateLimit).mockResolvedValueOnce(true);
    vi.mocked(auth.verifyOTP).mockResolvedValueOnce(true);
    const mockFind = vi.mocked(prisma.user.findUnique);
    mockFind.mockResolvedValueOnce({ id: "suspended-id", phone: "9876543210", role: "WORKER", status: "SUSPENDED" } as any);

    const result = await verifyLoginOTP("9876543210", "123456");
    expect(result).toEqual({ error: "Your account has been suspended" });
  });
});

describe("completeWorkerProfile", () => {
  it("returns error for unauthorized access", async () => {
    vi.mocked(auth.requireAuth).mockRejectedValueOnce(new Error("Unauthorized"));
    const result = await completeWorkerProfile({ userId: "other-id", name: "Test", trade: "Welder", experienceYears: 3, expectedSalary: 25000, city: "Hyderabad", languages: ["Telugu"] });
    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("updates worker profile successfully", async () => {
    vi.mocked(auth.requireAuth).mockResolvedValueOnce({ id: "user-1", role: "WORKER" } as any);
    const mockUpdate = vi.mocked(prisma.user.update);
    mockUpdate.mockResolvedValueOnce({} as any);
    const mockUpsert = vi.mocked(prisma.workerProfile.upsert);
    mockUpsert.mockResolvedValueOnce({} as any);

    await completeWorkerProfile({ userId: "user-1", name: "Test Worker", trade: "Welder", experienceYears: 3, expectedSalary: 25000, city: "Hyderabad", languages: ["Telugu"] });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Test Worker", city: "Hyderabad", role: "WORKER" },
    });
  });
});

describe("completeEmployerProfile", () => {
  it("returns error for unauthorized access", async () => {
    vi.mocked(auth.requireAuth).mockRejectedValueOnce(new Error("Unauthorized"));
    const result = await completeEmployerProfile({ userId: "other-id", name: "Test", companyName: "Test Corp", industry: "Manufacturing", address: "Addr", city: "Hyd" });
    expect(result).toEqual({ error: "Unauthorized" });
  });
});

describe("logout", () => {
  it("removes auth cookie and redirects", async () => {
    await logout();
    expect(auth.removeAuthCookie).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
