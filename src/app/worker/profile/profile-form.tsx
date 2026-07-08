"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateWorkerProfile } from "@/actions/worker.actions";
import { TRADES, HYDERABAD_ZONES } from "@/lib/constants";

interface ProfileFormProps {
  initialData: {
    trade: string;
    experienceYears: number;
    expectedSalary: number;
    city: string;
    languages: string[];
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [trade, setTrade] = useState(initialData.trade);
  const [experience, setExperience] = useState(String(initialData.experienceYears));
  const [salary, setSalary] = useState(String(initialData.expectedSalary));
  const [city, setCity] = useState(initialData.city);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await updateWorkerProfile({
      trade,
      experienceYears: Number(experience),
      expectedSalary: Number(salary),
      city,
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Trade / Skill</label>
        <select
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select trade</option>
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
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Expected Salary (₹/mo)</label>
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
        <label className="text-sm font-medium mb-1 block">City / Area</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select area</option>
          {HYDERABAD_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>
      <Button type="submit" loading={loading}>Save Changes</Button>
    </form>
  );
}
