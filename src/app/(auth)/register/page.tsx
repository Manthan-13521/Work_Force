"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PhoneInput } from "@/components/shared/phone-input";
import { requestOTP, verifyLoginOTP, completeWorkerProfile, completeEmployerProfile } from "@/actions/auth.actions";
import { TRADES, INDUSTRIES, HYDERABAD_ZONES } from "@/lib/constants";
import { Briefcase } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = searchParams.get("role") || "worker";

  const [step, setStep] = useState<"role" | "phone" | "otp" | "profile">("role");
  const [role, setRole] = useState<string>(preselectedRole);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Worker profile fields
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [city, setCity] = useState("");

  // Employer profile fields
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");

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
    if (!result.userId) return setError("Something went wrong");

    setUserId(result.userId);
    setStep("profile");
  }

  async function handleSubmitProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (role === "worker") {
      const res = await completeWorkerProfile({
        userId,
        name,
        trade,
        experienceYears: Number(experience),
        expectedSalary: Number(salary),
        city,
        languages: ["Telugu", "Hindi"],
      });
      if (res?.error) { setError(typeof res.error === "string" ? res.error : "Validation failed"); setLoading(false); return; }
      router.push("/worker/dashboard");
    } else {
      const res = await completeEmployerProfile({
        userId,
        name,
        companyName,
        industry,
        gstNumber: gstNumber || undefined,
        address,
        city,
      });
      if (res?.error) { setError(typeof res.error === "string" ? res.error : "Validation failed"); setLoading(false); return; }
      router.push("/employer/dashboard");
    }

    setLoading(false);
  }

  return (
    <>
      <h1 className="sr-only">Create Account</h1>
      <Card>
        <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Briefcase className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Join Workforce and find or post factory jobs in Hyderabad</CardDescription>
      </CardHeader>
      <CardContent>
        {step === "role" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center mb-4">I am a...</p>
            <Button
              variant={role === "worker" ? "default" : "outline"}
              className="w-full justify-start h-14"
              onClick={() => { setRole("worker"); setStep("phone"); }}
            >
              <Briefcase className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Worker</p>
                <p className="text-xs text-muted-foreground">Looking for factory work</p>
              </div>
            </Button>
            <Button
              variant={role === "employer" ? "default" : "outline"}
              className="w-full justify-start h-14"
              onClick={() => { setRole("employer"); setStep("phone"); }}
            >
              <Briefcase className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Employer</p>
                <p className="text-xs text-muted-foreground">Hiring factory workers</p>
              </div>
            </Button>
            <p className="text-center text-sm text-muted-foreground pt-2">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">Login</Link>
            </p>
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <PhoneInput value={phone} onChange={setPhone} error={error} />
            <Button type="submit" className="w-full" loading={loading}>
              Send OTP
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("role")}>
              Back
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">OTP sent to +91 {phone}</label>
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
              Verify
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("phone")}>
              Change phone number
            </Button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={handleSubmitProfile} className="space-y-4">
            <h3 className="font-semibold text-lg">
              {role === "worker" ? "Complete Your Profile" : "Company Details"}
            </h3>

            <div>
              <label className="text-sm font-medium mb-1 block">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
                placeholder="Your full name"
              />
            </div>

            {role === "worker" ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Trade / Skill *</label>
                  <select
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Select your trade</option>
                    {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Experience (years)</label>
                    <input
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Expected Salary (monthly)</label>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">City / Area *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Select your area</option>
                    {HYDERABAD_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Company Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    required
                    placeholder="e.g. ABC Fans Pvt Ltd"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Industry *</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">GST Number (optional)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Company Address *</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                    placeholder="Factory/office address in Hyderabad"
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              {role === "worker" ? "Create Profile & Start Applying" : "Create Account & Start Hiring"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
