import { z } from "zod";

export const phoneSchema = z.string().regex(/^\d{10}$/, "Phone must be 10 digits");

export const otpSchema = z.string().length(6, "OTP must be 6 digits");

export const tradeSchema = z.string().min(1, "Trade is required");

export const citySchema = z.string().min(1, "City is required");

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const completeWorkerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  trade: tradeSchema,
  experienceYears: z.coerce.number().min(0).max(70).default(0),
  expectedSalary: z.coerce.number().min(0).max(9_999_999).default(0),
  city: citySchema,
  languages: z.array(z.string()).default([]),
});

export const completeEmployerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  companyName: z.string().min(1, "Company name is required").max(200),
  industry: z.string().min(1, "Industry is required"),
  gstNumber: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, "Invalid GST format").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required").max(500),
  city: citySchema,
});

export const updateEmployerProfileSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  industry: z.string().optional(),
  gstNumber: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, "Invalid GST format").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
});

export const updateWorkerProfileSchema = z.object({
  trade: z.string().min(1).optional(),
  experienceYears: z.coerce.number().min(0).max(70).optional(),
  expectedSalary: z.coerce.number().min(0).max(9_999_999).optional(),
  city: citySchema.optional(),
  languages: z.array(z.string()).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required").max(2000),
});

export const applyToJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["SHORTLISTED", "REJECTED", "HIRED"]),
});

export const createRazorpayOrderSchema = z.object({
  planId: z.string().min(1),
});

export const toggleUserStatusSchema = z.object({
  userId: z.string().min(1),
});

export const verifyEmployerSchema = z.object({
  employerId: z.string().min(1),
});

export const verifyWorkerSchema = z.object({
  workerId: z.string().min(1),
});

export const toggleJobStatusSchema = z.object({
  jobId: z.string().min(1),
});

export const updateReportStatusSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["REVIEWED", "DISMISSED"]),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
});

export const createCitySchema = z.object({
  name: z.string().min(1, "City name is required").max(100),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const createReportSchema = z.object({
  targetType: z.enum(["JOB", "WORKER", "EMPLOYER"]),
  targetId: z.string().min(1),
  reason: z.string().min(1, "Reason is required").max(1000),
});

export const updateJobStatusSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(["ACTIVE", "CLOSED", "EXPIRED", "SUSPENDED"]),
});
