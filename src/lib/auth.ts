import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";
import { env } from "@/env";
import { redisSet, checkRateLimit, atomicReadDelete } from "./redis";
import { constantTimeEqual } from "./utils";
import { logger } from "./logger";
import { retry } from "./retry";
import { withTimeout } from "./timeout";
import { CircuitBreaker } from "./circuit-breaker";

const JWT_SECRET = env.JWT_SECRET;
const COOKIE_NAME = "workforce_token";
const OTP_EXPIRY_SECONDS = 600;

export type JWTPayload = {
  userId: string;
  phone: string;
  role: string;
};

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function isJWTPayload(payload: unknown): payload is JWTPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    "phone" in payload &&
    "role" in payload
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isJWTPayload(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
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
      phone: true,
      name: true,
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

export async function storeOTP(phone: string, otp: string) {
  await redisSet(`otp:${phone}`, otp, OTP_EXPIRY_SECONDS);
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const stored = await atomicReadDelete(`otp:${phone}`);
  if (!stored) return false;
  if (!constantTimeEqual(stored, otp)) return false;
  return true;
}

export async function checkOTPRateLimit(phone: string): Promise<boolean> {
  return checkRateLimit(`rate:otp:${phone}`, 3, 60);
}

export async function checkVerifyRateLimit(phone: string): Promise<boolean> {
  return checkRateLimit(`rate:verify:${phone}`, 5, 300);
}

function redactPhone(phone: string): string {
  return phone.length >= 4 ? `${phone.slice(0, 2)}******${phone.slice(-2)}` : "******";
}

const msg91Breaker = new CircuitBreaker("msg91", {
  failureThreshold: 3,
  resetTimeoutMs: 60000,
});

export async function sendOTP(phone: string, otp: string): Promise<boolean> {
  const redacted = redactPhone(phone);

  if (env.NODE_ENV === "development") {
    return true;
  }

  if (!env.MSG91_AUTH_KEY || !env.MSG91_SENDER_ID || !env.MSG91_TEMPLATE_ID) {
    logger.warn("MSG91 not configured — OTP not sent", { phone: redacted });
    return false;
  }

  try {
    const response = await msg91Breaker.call(async () => {
      return retry(() =>
        withTimeout(
          fetch("https://api.msg91.com/api/v5/otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              authkey: env.MSG91_AUTH_KEY,
              mobile: `91${phone}`,
              otp,
              sender: env.MSG91_SENDER_ID,
              template_id: env.MSG91_TEMPLATE_ID,
            }),
          }),
          5000,
          "MSG91 OTP send"
        )
      );
    });
    if (!response.ok) {
      logger.error("MSG91 send failed", { phone: redacted, status: response.status });
    }
    return response.ok;
  } catch {
    logger.warn("MSG91 send error — SMS delivery failed", { phone: redacted });
    return false;
  }
}
