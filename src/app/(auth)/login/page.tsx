"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/shared/phone-input";
import { requestOTP, verifyLoginOTP } from "@/actions/auth.actions";
import { Shield, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length !== 10) return setError("Enter a valid 10-digit phone number");
    setLoading(true);
    setError("");
    const result = await requestOTP(phone);
    setLoading(false);
    if (result?.error) return setError(result.error);
    setStep("otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return setError("Enter the complete 6-digit OTP");
    setLoading(true);
    setError("");
    const result = await verifyLoginOTP(phone, code);
    setLoading(false);
    if (result?.error) return setError(result.error);
    if (result.role === "WORKER") router.push("/worker/dashboard");
    else if (result.role === "EMPLOYER") router.push("/employer/dashboard");
    else if (result.role === "ADMIN") router.push("/admin/dashboard");
    else router.push("/");
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((digit, i) => { if (i < 6) newOtp[i] = digit; });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "");
    if (!digit && index > 0) {
      setOtp((prev) => { const next = [...prev]; next[index] = ""; return next; });
      otpRefs.current[index - 1]?.focus();
      return;
    }
    setOtp((prev) => { const next = [...prev]; next[index] = digit; return next; });
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary mb-4 shadow-sm">
          <span className="text-xl font-bold text-primary-foreground">W</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-1">
          {step === "phone" ? "Welcome back" : "Check your phone"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "phone"
            ? "Enter your phone number to login"
            : `We sent a code to +91 ${phone}`}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        {step === "phone" ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <PhoneInput
              id="login-phone"
              value={phone}
              onChange={setPhone}
              error={error}
              placeholder="Enter your phone number"
            />
            <Button type="submit" className="w-full" loading={loading}>
              Continue with OTP
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-center block">Enter verification code</label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-11 text-center text-base font-semibold rounded-lg border border-input bg-background transition-all duration-150 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              Verify and Login
            </Button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change phone number
            </button>
          </form>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-8 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          OTP verified
        </span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>256-bit encrypted</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>No spam</span>
      </div>
    </div>
  );
}
