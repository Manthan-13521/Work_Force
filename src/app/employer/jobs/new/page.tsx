"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { postJob } from "@/actions/job.actions";
import { SHIFT_TYPES, JOB_TYPES, HYDERABAD_ZONES } from "@/lib/constants";

const JOB_CATEGORIES = [
  "Assembly",
  "Machine Operation",
  "Packaging",
  "Warehouse",
  "Quality Check",
  "Production",
  "Maintenance",
  "Fabrication",
  "Loading/Unloading",
  "Other",
];

export default function PostJobPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [vacancies, setVacancies] = useState("1");
  const [shiftType, setShiftType] = useState("GENERAL");
  const [jobType, setJobType] = useState("FULL_TIME");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("city", city);
    formData.append("salaryMin", salaryMin);
    formData.append("salaryMax", salaryMax);
    formData.append("vacancies", vacancies);
    formData.append("shiftType", shiftType);
    formData.append("jobType", jobType);

    await postJob(formData);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Post a Job</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <CardTitle>
            {step === 1 ? "Basic Details" : step === 2 ? "Compensation & Shifts" : "Location & Publish"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "What kind of worker are you looking for?"
              : step === 2
              ? "Set the pay and working conditions"
              : "Where is the job located?"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Job Title *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Assembly Line Worker"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90 block">Category *</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{JOB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the role, responsibilities, and any requirements..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Number of Vacancies *</label>
                  <Input
                    type="number"
                    value={vacancies}
                    onChange={(e) => setVacancies(e.target.value)}
                    min="1"
                    required
                  />
                </div>
                <Button type="button" onClick={() => setStep(2)} className="w-full">Next</Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Min Salary (₹/month)</label>
                    <Input
                      type="number"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Max Salary (₹/month)</label>
                    <Input
                      type="number"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      placeholder="20000"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90 block">Shift Type *</label>
                  <Select value={shiftType} onValueChange={setShiftType}>
                    <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                    <SelectContent>{SHIFT_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90 block">Job Type *</label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                    <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button type="button" onClick={() => setStep(3)} className="flex-1">Next</Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Location / Factory Name *</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Jeedimetla Industrial Area"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90 block">City</label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger><SelectValue placeholder="Select city/zone" /></SelectTrigger>
                    <SelectContent>
                      {HYDERABAD_ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                      <SelectItem value="Hyderabad">Hyderabad (Other)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button type="submit" loading={loading} className="flex-1">Publish Job</Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
