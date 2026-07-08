import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables. Check server logs.");
    }
    console.warn("⚠ Running with missing env vars in development mode.");
    return process.env as unknown as z.infer<typeof envSchema>;
  }
  return result.data;
}

export const env = validateEnv();
