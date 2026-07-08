"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
                <div>
                  <label className="text-sm font-medium mb-1 block">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Select category</option>
                    {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
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
                <div>
                  <label className="text-sm font-medium mb-1 block">Shift Type *</label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {SHIFT_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Job Type *</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
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
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {HYDERABAD_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                    <option value="Hyderabad">Hyderabad (Other)</option>
                  </select>
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
