"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { env } from "@/env";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import { CircuitBreaker } from "@/lib/circuit-breaker";
import { withTimeout } from "@/lib/timeout";
import { logger } from "@/lib/logger";

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const CLOUDINARY_TIMEOUT = 15000;

const cloudinaryBreaker = new CircuitBreaker("cloudinary-upload", {
  failureThreshold: 3,
  resetTimeoutMs: 30000,
});

function cloudinaryConfigured() {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
}

async function saveFile(file: File, prefix: string): Promise<string> {
  const ext = ALLOWED_IMAGE_TYPES.get(file.type);
  if (!ext) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File must be under 5MB.");
  }

  const uniqueId = crypto.randomUUID();
  const filename = `${prefix}-${uniqueId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (cloudinaryConfigured()) {
    try {
      const url = await cloudinaryBreaker.call(async () => {
        const result = await withTimeout(
          new Promise<{ secure_url: string }>((resolve, reject) => {
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
          }),
          CLOUDINARY_TIMEOUT,
          "Cloudinary upload"
        );
        return result;
      });
      return url.secure_url;
    } catch (error) {
      logger.warn("Cloudinary upload failed, falling back to local", { error: String(error) });
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
