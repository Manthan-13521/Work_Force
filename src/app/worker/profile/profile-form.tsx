"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground/90 block">Trade / Skill</label>
        <Select value={trade} onValueChange={setTrade}>
          <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
          <SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input id="experience" type="number" label="Experience (years)" value={experience} onChange={(e) => setExperience(e.target.value)} min="0" placeholder="0" />
        <Input id="salary" type="number" label="Expected Salary (₹/mo)" value={salary} onChange={(e) => setSalary(e.target.value)} min="0" step="1000" placeholder="10000" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground/90 block">City / Area</label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
          <SelectContent>{HYDERABAD_ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button type="submit" loading={loading}>Save Changes</Button>
    </form>
  );
}
