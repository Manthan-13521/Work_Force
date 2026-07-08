"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PhoneInput } from "@/components/shared/phone-input";
import { requestOTP, verifyLoginOTP } from "@/actions/auth.actions";
import { Briefcase } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length !== 10) return setError("Enter a valid 10-digit phone number");
    setLoading(true);
    setError("");
    await requestOTP(phone);
    setLoading(false);
    setStep("otp");
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return setError("Enter a valid 6-digit OTP");
    setLoading(true);
    setError("");
    const result = await verifyLoginOTP(phone, otp);
    setLoading(false);

    if (result.error) return setError(result.error);

    // Redirect based on role
    if (result.role === "WORKER") router.push("/worker/dashboard");
    else if (result.role === "EMPLOYER") router.push("/employer/dashboard");
    else if (result.role === "ADMIN") router.push("/admin/dashboard");
    else router.push("/");
  }

  return (
    <>
      <h1 className="sr-only">Login to Workforce</h1>
      <Card>
        <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Briefcase className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">
          {step === "phone" ? "Login to Workforce" : "Verify OTP"}
        </CardTitle>
        <CardDescription>
          {step === "phone"
            ? "Enter your phone number to get started"
            : `Enter the 6-digit code sent to +91 ${phone}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "phone" ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <PhoneInput value={phone} onChange={setPhone} error={error} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Send OTP
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">Sign up</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">OTP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full h-12 text-center text-2xl tracking-[0.5em] rounded-md border border-input bg-background"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Verify & Login
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
            >
              Change phone number
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
    </>
  );
}
