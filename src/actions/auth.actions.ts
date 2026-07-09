"use server";

import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie, removeAuthCookie, storeOTP, verifyOTP, sendOTP, checkOTPRateLimit, checkVerifyRateLimit, requireAuth } from "@/lib/auth";
import { generateOTP } from "@/lib/utils";
import { redirect } from "next/navigation";
import { requestOtpSchema, verifyOtpSchema, completeWorkerSchema, completeEmployerSchema } from "@/lib/schemas";

export async function requestOTP(phone: string) {
  const parsed = requestOtpSchema.safeParse({ phone });
  if (!parsed.success) return { error: "Invalid phone number" };

  const phoneAllowed = await checkOTPRateLimit(parsed.data.phone);
  if (!phoneAllowed) return { error: "Too many requests. Please try again later." };

  const otp = generateOTP();
  await storeOTP(parsed.data.phone, otp);
  await sendOTP(parsed.data.phone, otp);
  return { success: true };
}

export async function verifyLoginOTP(phone: string, otp: string) {
  const parsed = verifyOtpSchema.safeParse({ phone, otp });
  if (!parsed.success) return { error: "Invalid phone or OTP format" };

  const allowed = await checkVerifyRateLimit(parsed.data.phone);
  if (!allowed) return { error: "Too many attempts. Please try again later." };

  const isValid = await verifyOTP(parsed.data.phone, parsed.data.otp);
  if (!isValid) return { error: "Invalid or expired OTP" };

  let user = await prisma.user.findUnique({
    where: { phone: parsed.data.phone },
    select: { id: true, phone: true, role: true, status: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { phone: parsed.data.phone, role: "WORKER" },
    });
  }

  if (user.status === "SUSPENDED") {
    return { error: "Your account has been suspended" };
  }

  const token = signToken({ userId: user.id, phone: user.phone, role: user.role });
  await setAuthCookie(token);

  return { success: true, role: user.role, userId: user.id };
}

export async function completeWorkerProfile(data: {
  userId: string;
  name: string;
  trade: string;
  experienceYears: number;
  expectedSalary: number;
  city: string;
  languages: string[];
}) {
  const parsed = completeWorkerSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  try {
    const currentUser = await requireAuth();
    if (currentUser.id !== data.userId) return { error: "Unauthorized" };
  } catch {
    return { error: "Unauthorized" };
  }

  await prisma.user.update({
    where: { id: data.userId },
    data: { name: parsed.data.name, city: parsed.data.city, role: "WORKER" },
  });

  await prisma.workerProfile.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      trade: parsed.data.trade,
      experienceYears: parsed.data.experienceYears,
      expectedSalary: parsed.data.expectedSalary,
      languages: parsed.data.languages,
    },
    update: {
      trade: parsed.data.trade,
      experienceYears: parsed.data.experienceYears,
      expectedSalary: parsed.data.expectedSalary,
      languages: parsed.data.languages,
    },
  });

  redirect("/worker/dashboard");
}

export async function completeEmployerProfile(data: {
  userId: string;
  name: string;
  companyName: string;
  industry: string;
  gstNumber?: string;
  address: string;
  city: string;
}) {
  const parsed = completeEmployerSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  try {
    const currentUser = await requireAuth();
    if (currentUser.id !== data.userId) return { error: "Unauthorized" };
  } catch {
    return { error: "Unauthorized" };
  }

  await prisma.user.update({
    where: { id: data.userId },
    data: { name: parsed.data.name, role: "EMPLOYER", city: parsed.data.city },
  });

  await prisma.employerProfile.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      companyName: parsed.data.companyName,
      industry: parsed.data.industry,
      gstNumber: parsed.data.gstNumber || undefined,
      address: parsed.data.address,
    },
    update: {
      companyName: parsed.data.companyName,
      industry: parsed.data.industry,
      gstNumber: parsed.data.gstNumber || undefined,
      address: parsed.data.address,
    },
  });

  const starterPlan = await prisma.plan.findFirst({
    where: { name: "Starter" },
    select: { jobPostLimit: true, durationDays: true },
  });
  if (starterPlan) {
    const existing = await prisma.jobCredit.findUnique({
      where: { employerId: data.userId },
      select: { id: true },
    });
    if (!existing) {
      await prisma.jobCredit.create({
        data: {
          employerId: data.userId,
          remaining: starterPlan.jobPostLimit,
          expiryDate: new Date(Date.now() + starterPlan.durationDays * 86400000),
        },
      });
    }
  }

  redirect("/employer/dashboard");
}

export async function logout() {
  await removeAuthCookie();
  redirect("/");
}
