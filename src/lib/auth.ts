import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";
import { redisSet, checkRateLimit, atomicReadDelete } from "./redis";
import { constantTimeEqual } from "./utils";
import { verifyToken } from "./jwt";
export { signToken, verifyToken } from "./jwt";
export type { JWTPayload } from "./jwt";

const COOKIE_NAME = "workforce_token";
const OTP_EXPIRY_SECONDS = 600;

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export const getCurrentUser = cache(async () => {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      phone: true,
      role: true,
      city: true,
      status: true,
      workerProfile: {
        select: {
          trade: true,
          experienceYears: true,
          expectedSalary: true,
          languages: true,
          photoUrl: true,
          idDocUrl: true,
          isVerified: true,
          rating: true,
        },
      },
      employerProfile: {
        select: {
          companyName: true,
          industry: true,
          gstNumber: true,
          address: true,
          isVerified: true,
        },
      },
    },
  });

  return user;
});

export async function requireAuth(roles?: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (roles && !roles.includes(user.role)) throw new Error("Forbidden");
  if (user.status === "SUSPENDED") throw new Error("Account suspended");
  return user;
}

export async function storeOTP(email: string, otp: string) {
  await redisSet(`otp:${email}`, otp, OTP_EXPIRY_SECONDS);
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const stored = await atomicReadDelete(`otp:${email}`);
  if (!stored) return false;
  if (!constantTimeEqual(stored, otp)) return false;
  return true;
}

export async function checkOTPRateLimit(email: string): Promise<boolean> {
  return checkRateLimit(`rate:otp:${email}`, 3, 60);
}

export async function checkVerifyRateLimit(email: string): Promise<boolean> {
  return checkRateLimit(`rate:verify:${email}`, 5, 300);
}
