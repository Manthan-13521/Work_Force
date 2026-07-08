import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@/lib/utils";
import { storeOTP, sendOTP, checkOTPRateLimit } from "@/lib/auth";
import { checkRateLimit } from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipAllowed = await checkRateLimit(`rate:otp:ip:${ip}`, 10, 60);
    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { phone } = await request.json();
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const allowed = await checkOTPRateLimit(phone);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    await storeOTP(phone, otp);
    await sendOTP(phone, otp);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
