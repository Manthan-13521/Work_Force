"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateEmployerProfile } from "@/actions/employer.actions";
import { INDUSTRIES } from "@/lib/constants";

interface CompanyProfileFormProps {
  initialData: {
    companyName: string;
    industry: string;
    gstNumber: string;
    address: string;
  };
}

export function CompanyProfileForm({ initialData }: CompanyProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(initialData.companyName);
  const [industry, setIndustry] = useState(initialData.industry);
  const [gstNumber, setGstNumber] = useState(initialData.gstNumber);
  const [address, setAddress] = useState(initialData.address);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await updateEmployerProfile({ companyName, industry, gstNumber, address });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Company Name</label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Industry</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select industry</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">GST Number (optional)</label>
        <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Company Address</label>
        <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
      </div>
      <Button type="submit" loading={loading}>Save Changes</Button>
    </form>
  );
}
