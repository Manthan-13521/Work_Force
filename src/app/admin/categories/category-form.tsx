"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory } from "@/actions/admin.actions";

export function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await createCategory(name);
    setLoading(false);
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        required
      />
      <Button type="submit" loading={loading}>Add</Button>
    </form>
  );
}
