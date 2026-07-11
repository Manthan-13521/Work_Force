import { NextRequest } from "next/server";
import { generateOTP } from "@/lib/utils";
import { storeOTP, checkOTPRateLimit } from "@/lib/auth";
import { checkRateLimit } from "@/lib/redis";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { sendEmail, renderOtpEmail } from "@/lib/email";
import { env } from "@/env";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipAllowed = await checkRateLimit(`rate:otp:ip:${ip}`, 10, 60);
    if (!ipAllowed) {
      return apiError("Too many requests. Please try again later.", 429, "RATE_LIMITED");
    }

    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError("Invalid email address", 400, "INVALID_EMAIL");
    }

    const allowed = await checkOTPRateLimit(email);
    if (!allowed) {
      return apiError("Too many requests. Please try again later.", 429, "RATE_LIMITED");
    }

    const otp = generateOTP();
    await storeOTP(email, otp);

    if (env.NODE_ENV !== "development") {
      await sendEmail({
        to: email,
        subject: "Your Workforce verification code",
        html: renderOtpEmail(otp, 10),
      });
    }

    return apiSuccess({ email });
  } catch {
    return apiServerError("Failed to send OTP");
  }
}
