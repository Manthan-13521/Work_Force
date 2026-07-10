"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground/90 block">Industry</label>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
        </Select>
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
