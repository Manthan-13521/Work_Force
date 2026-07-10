"use server";

import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/schemas";
import { recordAuditEvent } from "@/lib/audit";

export async function submitContact(_prev: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { error: Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") };

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    },
  });

  await recordAuditEvent({ action: "SYSTEM", actorId: null, actorRole: null, resource: "contact_message", newValues: { name: parsed.data.name, email: parsed.data.email } });
  return { success: true };
}
