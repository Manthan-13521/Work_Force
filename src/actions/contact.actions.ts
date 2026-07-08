"use server";

import { contactSchema } from "@/lib/schemas";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function submitContact(_prev: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { error: Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") };

  const dir = path.join(process.cwd(), "data", "contacts");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${Date.now()}.json`),
    JSON.stringify(parsed.data, null, 2)
  );

  return { success: true };
}
