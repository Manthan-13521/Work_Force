import { NextRequest } from "next/server";
import { generateOTP } from "@/lib/utils";
import { storeOTP, sendOTP, checkOTPRateLimit } from "@/lib/auth";
import { checkRateLimit } from "@/lib/redis";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipAllowed = await checkRateLimit(`rate:otp:ip:${ip}`, 10, 60);
    if (!ipAllowed) {
      return apiError("Too many requests. Please try again later.", 429, "RATE_LIMITED");
    }

    const { phone } = await request.json();
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return apiError("Invalid phone number", 400, "INVALID_PHONE");
    }

    const allowed = await checkOTPRateLimit(phone);
    if (!allowed) {
      return apiError("Too many requests. Please try again later.", 429, "RATE_LIMITED");
    }

    const otp = generateOTP();
    await storeOTP(phone, otp);
    await sendOTP(phone, otp);

    return apiSuccess({ phone });
  } catch {
    return apiServerError("Failed to send OTP");
  }
}
