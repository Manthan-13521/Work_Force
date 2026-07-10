"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/shared/phone-input";
import { requestOTP, verifyLoginOTP, completeWorkerProfile, completeEmployerProfile } from "@/actions/auth.actions";
import { TRADES, INDUSTRIES, HYDERABAD_ZONES } from "@/lib/constants";
import { Shield, ArrowLeft, Building, User } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = searchParams.get("role") || "worker";

  const [step, setStep] = useState<"role" | "phone" | "otp" | "profile">("role");
  const [role, setRole] = useState<string>(preselectedRole);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [city, setCity] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");

  const steps = [
    { key: "role", label: "Role", number: 1 },
    { key: "phone", label: "Phone", number: 2 },
    { key: "otp", label: "Verify", number: 3 },
    { key: "profile", label: "Profile", number: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

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
    if (!result?.userId) return setError("Something went wrong");
    setUserId(result.userId);
    setStep("profile");
  }

  async function handleSubmitProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (role === "worker") {
      const res = await completeWorkerProfile({ userId, name, trade, experienceYears: Number(experience), expectedSalary: Number(salary), city, languages: ["Telugu", "Hindi"] });
      if (res?.error) { setError(typeof res.error === "string" ? res.error : "Validation failed"); setLoading(false); return; }
      router.push("/worker/dashboard");
    } else {
      const res = await completeEmployerProfile({ userId, name, companyName, industry, gstNumber, address, city });
      if (res?.error) { setError(typeof res.error === "string" ? res.error : "Validation failed"); setLoading(false); return; }
      router.push("/employer/dashboard");
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((digit, i) => { if (i < 6) newOtp[i] = digit; });
      setOtp(newOtp);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "");
    if (!digit && index > 0) { setOtp((prev) => { const next = [...prev]; next[index] = ""; return next; }); otpRefs.current[index - 1]?.focus(); return; }
    setOtp((prev) => { const next = [...prev]; next[index] = digit; return next; });
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  const promptText = role === "worker" ? "Find your next job" : "Start hiring today";

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary mb-4 shadow-sm">
          <span className="text-xl font-bold text-primary-foreground">W</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-1">
          {step === "role" ? "Create your account" : step === "profile" ? "Complete your profile" : promptText}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "role" ? "Choose how you want to use Workforce" : step === "profile" ? "Tell us a bit about yourself" : "Free &bull; No spam &bull; 2 minutes"}
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-6">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
              i <= currentStepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {s.number}
            </div>
            <span className={`text-xs ${i <= currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`h-px w-4 ${i < currentStepIndex ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm transition-all duration-300">
        {step === "role" && (
          <div className="space-y-3">
            <button
              onClick={() => { setRole("worker"); setStep("phone"); }}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                role === "worker" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-sm">I&apos;m a Worker</p>
                  <p className="text-xs text-muted-foreground">Find factory jobs near you</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => { setRole("employer"); setStep("phone"); }}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                role === "employer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-sm">I&apos;m an Employer</p>
                  <p className="text-xs text-muted-foreground">Post jobs and hire workers</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <PhoneInput id="register-phone" value={phone} onChange={setPhone} error={error} />
            <Button type="submit" className="w-full" loading={loading}>Continue</Button>
            <button type="button" onClick={() => setStep("role")} className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to role selection
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-center block">Enter verification code</label>
              <p className="text-xs text-muted-foreground text-center">Sent to +91 {phone}</p>
              <div className="flex gap-2 justify-center pt-2">
                {otp.map((digit, index) => (
                  <input key={index} ref={(el) => { otpRefs.current[index] = el; }} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-11 text-center text-base font-semibold rounded-lg border border-input bg-background transition-all duration-150 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Digit ${index + 1}`} />
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive text-center" role="alert">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>Verify</Button>
            <button type="button" onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Change phone number
            </button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={handleSubmitProfile} className="space-y-4">
            <Input id="name" label={role === "worker" ? "Full name" : "Your name"} placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
            {role === "employer" && (
              <>
                <Input id="company" label="Company name" placeholder="Enter company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90 block">Industry</label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input id="gst" label="GST number (optional)" placeholder="Enter GST number" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90 block">Company address</label>
                  <Textarea placeholder="Enter company address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
                </div>
              </>
            )}
            {role === "worker" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90 block">Trade</label>
                  <Select value={trade} onValueChange={setTrade}>
                    <SelectTrigger><SelectValue placeholder="Select your trade" /></SelectTrigger>
                    <SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input id="experience" type="number" label="Years of experience" placeholder="0" value={experience} onChange={(e) => setExperience(e.target.value)} />
                <Input id="salary" type="number" label="Expected monthly salary" placeholder="Enter amount in ₹" value={salary} onChange={(e) => setSalary(e.target.value)} />
              </>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/90 block">City / Zone</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue placeholder="Select your city/zone" /></SelectTrigger>
                <SelectContent>{HYDERABAD_ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              {role === "worker" ? "Find Jobs" : "Start Hiring"}
            </Button>
          </form>
        )}
      </div>

      {step !== "profile" && (
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Login</Link>
        </p>
      )}

      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> OTP verified</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>Free to join</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>No spam</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
