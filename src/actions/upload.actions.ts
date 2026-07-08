"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function saveFile(file: File, prefix: string): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File must be under 5MB.");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}

export async function uploadPhoto(formData: FormData) {
  const user = await requireAuth(["WORKER"]);
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided." };

  try {
    const url = await saveFile(file, `photo-${user.id}`);
    await prisma.workerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, photoUrl: url },
      update: { photoUrl: url },
    });
    revalidateTag("worker-profile", "max");
    return { success: true, url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function uploadIdDoc(formData: FormData) {
  const user = await requireAuth(["WORKER"]);
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided." };

  try {
    const url = await saveFile(file, `id-${user.id}`);
    await prisma.workerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, idDocUrl: url },
      update: { idDocUrl: url },
    });
    revalidateTag("worker-profile", "max");
    return { success: true, url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}
