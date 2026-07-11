"use server";

import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie, removeAuthCookie, storeOTP, verifyOTP, checkOTPRateLimit, checkVerifyRateLimit, requireAuth } from "@/lib/auth";
import { generateOTP } from "@/lib/utils";
import { redirect } from "next/navigation";
import { requestOtpSchema, verifyOtpSchema, completeWorkerSchema, completeEmployerSchema } from "@/lib/schemas";
import { recordAuditEvent } from "@/lib/audit";
import { sendEmail, renderOtpEmail, renderOtpText } from "@/lib/email";

export async function requestOTP(email: string) {
  const parsed = requestOtpSchema.safeParse({ email });
  if (!parsed.success) return { error: "Invalid email address" };

  const allowed = await checkOTPRateLimit(parsed.data.email);
  if (!allowed) return { error: "Too many requests. Please try again later." };

  const otp = generateOTP();
  await storeOTP(parsed.data.email, otp);

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV OTP] ${parsed.data.email} → ${otp}`);
    return { success: true };
  }

  const sent = await sendEmail({
    to: parsed.data.email,
    subject: `Workforce verification code: ${otp}`,
    html: renderOtpEmail(otp, 10),
    text: renderOtpText(otp, 10),
  });
  if (!sent) return { error: "Failed to send OTP. Please try again." };

  await recordAuditEvent({ action: "OTP_SENT", actorId: null, actorRole: null, resource: "email", resourceId: parsed.data.email });
  return { success: true };
}

export async function verifyLoginOTP(email: string, otp: string) {
  const parsed = verifyOtpSchema.safeParse({ email, otp });
  if (!parsed.success) return { error: "Invalid email or OTP format" };

  const allowed = await checkVerifyRateLimit(parsed.data.email);
  if (!allowed) return { error: "Too many attempts. Please try again later." };

  const isValid = await verifyOTP(parsed.data.email, parsed.data.otp);
  if (!isValid) return { error: "Invalid or expired OTP" };

  let user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, emailVerified: true, role: true, status: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email: parsed.data.email, emailVerified: true, role: "WORKER" },
    });
  } else if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
  }

  if (user.status === "SUSPENDED") {
    return { error: "Your account has been suspended" };
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  await setAuthCookie(token);

  await recordAuditEvent({ action: "LOGIN", actorId: user.id, actorRole: user.role, resource: "user", resourceId: user.id });

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

  await recordAuditEvent({ action: "REGISTER", actorId: data.userId, actorRole: "WORKER", resource: "worker_profile", resourceId: data.userId, metadata: { trade: parsed.data.trade } });

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

  await recordAuditEvent({ action: "REGISTER", actorId: data.userId, actorRole: "EMPLOYER", resource: "employer_profile", resourceId: data.userId, metadata: { companyName: parsed.data.companyName, industry: parsed.data.industry } });

  redirect("/employer/dashboard");
}

export async function logout() {
  let user;
  try { user = await requireAuth(); } catch {}
  if (user) {
    await recordAuditEvent({ action: "LOGOUT", actorId: user.id, actorRole: user.role, resource: "user", resourceId: user.id });
  }
  await removeAuthCookie();
  redirect("/");
}
