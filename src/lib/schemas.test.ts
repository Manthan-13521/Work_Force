import { describe, it, expect } from "vitest";
import {
  requestOtpSchema,
  verifyOtpSchema,
  completeWorkerSchema,
  completeEmployerSchema,
  contactSchema,
  createCategorySchema,
  createCitySchema,
  createReportSchema,
  updateApplicationStatusSchema,
  createRazorpayOrderSchema,
  toggleUserStatusSchema,
  updateJobStatusSchema,
  applyToJobSchema,
  updateWorkerProfileSchema,
  updateEmployerProfileSchema,
} from "./schemas";

describe("requestOtpSchema", () => {
  it("accepts valid email", () => {
    expect(requestOtpSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(requestOtpSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("rejects missing @", () => {
    expect(requestOtpSchema.safeParse({ email: "userexample.com" }).success).toBe(false);
  });
});

describe("verifyOtpSchema", () => {
  it("accepts valid email + 6-digit OTP", () => {
    expect(verifyOtpSchema.safeParse({ email: "user@example.com", otp: "123456" }).success).toBe(true);
  });

  it("rejects non-6-digit OTP", () => {
    expect(verifyOtpSchema.safeParse({ email: "user@example.com", otp: "12345" }).success).toBe(false);
  });

  it("rejects empty OTP", () => {
    expect(verifyOtpSchema.safeParse({ email: "user@example.com", otp: "" }).success).toBe(false);
  });

  it("rejects OTP with letters", () => {
    expect(verifyOtpSchema.safeParse({ email: "user@example.com", otp: "abc123" }).success).toBe(false);
  });
});

describe("applyToJobSchema", () => {
  it("accepts valid job ID", () => {
    expect(applyToJobSchema.safeParse({ jobId: "abc123" }).success).toBe(true);
  });

  it("rejects empty job ID", () => {
    expect(applyToJobSchema.safeParse({ jobId: "" }).success).toBe(false);
  });

  it("rejects missing job ID", () => {
    expect(applyToJobSchema.safeParse({}).success).toBe(false);
  });
});

describe("updateApplicationStatusSchema", () => {
  it("accepts valid status values", () => {
    expect(updateApplicationStatusSchema.safeParse({ applicationId: "abc", status: "SHORTLISTED" }).success).toBe(true);
    expect(updateApplicationStatusSchema.safeParse({ applicationId: "abc", status: "HIRED" }).success).toBe(true);
    expect(updateApplicationStatusSchema.safeParse({ applicationId: "abc", status: "REJECTED" }).success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(updateApplicationStatusSchema.safeParse({ applicationId: "abc", status: "INVALID" }).success).toBe(false);
  });
});

describe("updateJobStatusSchema", () => {
  it("accepts valid status values", () => {
    expect(updateJobStatusSchema.safeParse({ jobId: "abc", status: "ACTIVE" }).success).toBe(true);
    expect(updateJobStatusSchema.safeParse({ jobId: "abc", status: "CLOSED" }).success).toBe(true);
    expect(updateJobStatusSchema.safeParse({ jobId: "abc", status: "SUSPENDED" }).success).toBe(true);
    expect(updateJobStatusSchema.safeParse({ jobId: "abc", status: "EXPIRED" }).success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(updateJobStatusSchema.safeParse({ jobId: "abc", status: "DELETED" }).success).toBe(false);
  });

  it("rejects empty jobId", () => {
    expect(updateJobStatusSchema.safeParse({ jobId: "", status: "ACTIVE" }).success).toBe(false);
  });
});

describe("createRazorpayOrderSchema", () => {
  it("accepts valid plan ID", () => {
    expect(createRazorpayOrderSchema.safeParse({ planId: "plan_abc" }).success).toBe(true);
  });

  it("rejects empty plan ID", () => {
    expect(createRazorpayOrderSchema.safeParse({ planId: "" }).success).toBe(false);
  });
});

describe("toggleUserStatusSchema", () => {
  it("accepts valid user ID", () => {
    expect(toggleUserStatusSchema.safeParse({ userId: "abc" }).success).toBe(true);
  });

  it("rejects empty user ID", () => {
    expect(toggleUserStatusSchema.safeParse({ userId: "" }).success).toBe(false);
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

  it("rejects missing name", () => {
    expect(completeWorkerSchema.safeParse({
      trade: "Plumber",
      city: "Hyderabad",
    }).success).toBe(false);
  });

  it("coerces string experience to number", () => {
    const result = completeWorkerSchema.safeParse({
      name: "Test", trade: "Welder", experienceYears: "5", expectedSalary: "20000", city: "Hyd",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.experienceYears).toBe(5);
  });

  it("rejects negative experience", () => {
    const result = completeWorkerSchema.safeParse({
      name: "Test", trade: "Welder", experienceYears: "-1", expectedSalary: "20000", city: "Hyd",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    expect(completeWorkerSchema.safeParse({
      name: "x".repeat(101), trade: "Welder", city: "Hyd",
    }).success).toBe(false);
  });

  it("uses default values", () => {
    const result = completeWorkerSchema.safeParse({
      name: "Test", trade: "Welder", city: "Hyd",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experienceYears).toBe(0);
      expect(result.data.expectedSalary).toBe(0);
      expect(result.data.languages).toEqual([]);
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

  it("accepts valid GST format", () => {
    const result = completeEmployerSchema.safeParse({
      name: "Test",
      companyName: "Test Corp",
      industry: "Manufacturing",
      gstNumber: "22AAAAA0000A1Z5",
      address: "123 Main St",
      city: "Hyderabad",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty company name", () => {
    expect(completeEmployerSchema.safeParse({
      name: "Test", companyName: "", industry: "Man", address: "Addr", city: "Hyd",
    }).success).toBe(false);
  });

  it("rejects address over 500 chars", () => {
    expect(completeEmployerSchema.safeParse({
      name: "Test", companyName: "Corp", industry: "Man", address: "x".repeat(501), city: "Hyd",
    }).success).toBe(false);
  });
});

describe("updateWorkerProfileSchema", () => {
  it("accepts partial updates", () => {
    expect(updateWorkerProfileSchema.safeParse({ trade: "Welder" }).success).toBe(true);
    expect(updateWorkerProfileSchema.safeParse({ city: "Hyderabad" }).success).toBe(true);
    expect(updateWorkerProfileSchema.safeParse({}).success).toBe(true);
  });
});

describe("updateEmployerProfileSchema", () => {
  it("accepts partial updates", () => {
    expect(updateEmployerProfileSchema.safeParse({ companyName: "New Corp" }).success).toBe(true);
    expect(updateEmployerProfileSchema.safeParse({}).success).toBe(true);
  });

  it("rejects invalid GST in update", () => {
    expect(updateEmployerProfileSchema.safeParse({ gstNumber: "bad" }).success).toBe(false);
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

  it("rejects empty message", () => {
    expect(
      contactSchema.safeParse({ name: "User", email: "user@example.com", message: "" }).success
    ).toBe(false);
  });

  it("rejects message over 2000 chars", () => {
    expect(
      contactSchema.safeParse({ name: "User", email: "user@example.com", message: "x".repeat(2001) }).success
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

  it("rejects name over 100 chars", () => {
    expect(createCategorySchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });
});

describe("createCitySchema", () => {
  it("accepts valid city name", () => {
    expect(createCitySchema.safeParse({ name: "Hyderabad" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(createCitySchema.safeParse({ name: "" }).success).toBe(false);
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

  it("accepts WORKER target type", () => {
    expect(
      createReportSchema.safeParse({ targetType: "WORKER", targetId: "abc", reason: "Fake profile" }).success
    ).toBe(true);
  });

  it("accepts EMPLOYER target type", () => {
    expect(
      createReportSchema.safeParse({ targetType: "EMPLOYER", targetId: "abc", reason: "Suspicious" }).success
    ).toBe(true);
  });

  it("rejects invalid target type", () => {
    expect(
      createReportSchema.safeParse({ targetType: "INVALID", targetId: "abc", reason: "test" }).success
    ).toBe(false);
  });

  it("rejects empty reason", () => {
    expect(
      createReportSchema.safeParse({ targetType: "JOB", targetId: "abc", reason: "" }).success
    ).toBe(false);
  });

  it("rejects reason over 1000 chars", () => {
    expect(
      createReportSchema.safeParse({ targetType: "JOB", targetId: "abc", reason: "x".repeat(1001) }).success
    ).toBe(false);
  });

  it("rejects empty targetId", () => {
    expect(
      createReportSchema.safeParse({ targetType: "JOB", targetId: "", reason: "test" }).success
    ).toBe(false);
  });
});
