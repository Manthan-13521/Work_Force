"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { verifyLoginOTP, requestOTP } from "@/actions/auth.actions";
import { Briefcase } from "lucide-react";

export default function VerifyOTPPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  async function handleSendOTP() {
    if (phone.length !== 10) return setError("Enter a valid phone number");
    setLoading(true);
    setError("");
    await requestOTP(phone);
    setOtpSent(true);
    setLoading(false);
  }

  async function handleVerify() {
    if (otp.length !== 6) return setError("Enter a valid OTP");
    setLoading(true);
    setError("");
    const result = await verifyLoginOTP(phone, otp);
    setLoading(false);

    if (result.error) return setError(result.error);
    if (result.role === "WORKER") router.push("/worker/dashboard");
    else if (result.role === "EMPLOYER") router.push("/employer/dashboard");
    else if (result.role === "ADMIN") router.push("/admin/dashboard");
  }

  return (
    <>
      <h1 className="sr-only">Verify Phone</h1>
      <Card>
        <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Briefcase className="h-10 w-10 text-primary" />
        </div>
        <CardTitle>Verify Phone</CardTitle>
        <CardDescription>Enter your phone number to receive an OTP</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Phone Number</label>
          <div className="flex gap-2">
            <div className="flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted text-sm">+91</div>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="flex-1 h-10 rounded-r-md border border-input bg-background px-3 text-sm"
              disabled={otpSent}
            />
          </div>
        </div>

        {!otpSent ? (
          <Button className="w-full" onClick={handleSendOTP} loading={loading}>
            Send OTP
          </Button>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium mb-1 block">Enter OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full h-12 text-center text-2xl tracking-[0.5em] rounded-md border border-input bg-background"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleVerify} loading={loading}>
              Verify
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { setOtpSent(false); setOtp(""); }}>
              Change number
            </Button>
          </>
        )}
      </CardContent>
    </Card>
    </>
  );
}
