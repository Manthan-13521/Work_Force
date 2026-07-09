"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { env } from "@/env";
import { v2 as cloudinary } from "cloudinary";

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isAllowedMimeType(mime: string): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.has(mime);
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

async function saveFile(file: File, prefix: string): Promise<string> {
  if (!isAllowedMimeType(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File must be under 5MB.");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Try Cloudinary first, fall back to local filesystem
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    try {
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "workforce",
            public_id: filename.replace(`.${ext}`, ""),
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
          },
          (err, result) => {
            if (err || !result) reject(err || new Error("Upload failed"));
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
      return result.secure_url;
    } catch {
      // Fall through to local upload
    }
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
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
