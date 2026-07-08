import { describe, it, expect } from "vitest";
import {
  requestOtpSchema,
  verifyOtpSchema,
  completeWorkerSchema,
  completeEmployerSchema,
  contactSchema,
  createCategorySchema,
  createReportSchema,
} from "./schemas";

describe("requestOtpSchema", () => {
  it("accepts valid 10-digit phone", () => {
    expect(requestOtpSchema.safeParse({ phone: "9876543210" }).success).toBe(true);
  });

  it("rejects short phone", () => {
    expect(requestOtpSchema.safeParse({ phone: "12345" }).success).toBe(false);
  });
});

describe("verifyOtpSchema", () => {
  it("accepts valid phone + 6-digit OTP", () => {
    expect(verifyOtpSchema.safeParse({ phone: "9876543210", otp: "123456" }).success).toBe(true);
  });

  it("rejects non-6-digit OTP", () => {
    expect(verifyOtpSchema.safeParse({ phone: "9876543210", otp: "12345" }).success).toBe(false);
  });
});

describe("completeWorkerSchema", () => {
  it("accepts valid worker data", () => {
    const result = completeWorkerSchema.safeParse({
      name: "Test Worker",
      trade: "Plumber",
      experienceYears: "3",
      expectedSalary: "25000",
      city: "Hyderabad",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experienceYears).toBe(3);
      expect(result.data.expectedSalary).toBe(25000);
    }
  });
});

describe("completeEmployerSchema", () => {
  it("accepts valid employer data", () => {
    const result = completeEmployerSchema.safeParse({
      name: "Test Employer",
      companyName: "Test Corp",
      industry: "Manufacturing",
      address: "123 Main St",
      city: "Hyderabad",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid GST format", () => {
    const result = completeEmployerSchema.safeParse({
      name: "Test",
      companyName: "Test Corp",
      industry: "Manufacturing",
      gstNumber: "invalid-gst",
      address: "123 Main St",
      city: "Hyderabad",
    });
    expect(result.success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("accepts valid contact submission", () => {
    expect(
      contactSchema.safeParse({ name: "User", email: "user@example.com", message: "Hello" }).success
    ).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(
      contactSchema.safeParse({ name: "User", email: "not-an-email", message: "Hello" }).success
    ).toBe(false);
  });

  it("rejects empty name", () => {
    expect(
      contactSchema.safeParse({ name: "", email: "user@example.com", message: "Hello" }).success
    ).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("accepts valid category name", () => {
    expect(createCategorySchema.safeParse({ name: "Plumbing" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(createCategorySchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("createReportSchema", () => {
  it("accepts valid report", () => {
    expect(
      createReportSchema.safeParse({
        targetType: "JOB",
        targetId: "abc123",
        reason: "This job listing is suspicious",
      }).success
    ).toBe(true);
  });
});
