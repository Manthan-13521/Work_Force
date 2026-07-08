import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { env } from "@/env";
import { redisSet, redisGet, redisDel, checkRateLimit } from "./redis";
import { logger } from "./logger";
import { retry } from "./retry";

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
    sameSite: "lax",
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

export async function getCurrentUser() {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      workerProfile: true,
      employerProfile: true,
    },
  });

  return user;
}

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
  const stored = await redisGet(`otp:${phone}`);
  if (!stored) return false;
  if (stored !== otp) return false;
  await redisDel(`otp:${phone}`);
  return true;
}

export async function checkOTPRateLimit(phone: string): Promise<boolean> {
  return checkRateLimit(`rate:otp:${phone}`, 3, 60);
}

export async function checkVerifyRateLimit(phone: string): Promise<boolean> {
  return checkRateLimit(`rate:verify:${phone}`, 5, 300);
}

export async function sendOTP(phone: string, otp: string): Promise<boolean> {
  if (env.NODE_ENV === "development") {
    return true;
  }

  if (!env.MSG91_AUTH_KEY || !env.MSG91_SENDER_ID || !env.MSG91_TEMPLATE_ID) {
    logger.warn("MSG91 not configured — OTP not sent", { phone });
    return false;
  }

  try {
    const response = await retry(() =>
      fetch(
        `https://api.msg91.com/api/v5/otp?authkey=${env.MSG91_AUTH_KEY}&mobile=91${phone}&otp=${otp}&sender=${env.MSG91_SENDER_ID}&template_id=${env.MSG91_TEMPLATE_ID}`,
        { method: "GET" }
      )
    );
    if (!response.ok) {
      logger.error("MSG91 send failed", { phone, status: response.status });
    }
    return response.ok;
  } catch (e) {
    logger.error("MSG91 send error", { phone, error: String(e) });
    return false;
  }
}
