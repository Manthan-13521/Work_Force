import { z } from "zod";

const booleanEnv = z
  .enum(["1", "true", "yes", "0", "false", "no", ""])
  .transform((v) => v === "1" || v === "true" || v === "yes");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database (always required)
  DATABASE_URL: z.string().url(),

  // Auth (always required)
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // Messaging (OTP)
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),

  // Media
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Payments
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

  // App (REQUIRED in production — CSRF, sitemap, redirects)
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Redis / Upstash
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),

  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_CLARITY_ID: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Feature flags
  FEATURE_DISABLE_ANALYTICS: booleanEnv.default("false"),
  FEATURE_DISABLE_NOTIFICATIONS: booleanEnv.default("false"),
  FEATURE_MAINTENANCE_MODE: booleanEnv.default("false"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

function validateEnv(): Env {
  if (cached) return cached;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    if (!process.env.NEXT_PHASE && process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables. Check server logs.");
    }
    console.warn("⚠ Running with missing or invalid env vars");
    cached = process.env as unknown as Env;
    return cached;
  }

  if (process.env.NODE_ENV === "production") {
    if (!result.data.NEXT_PUBLIC_APP_URL) {
      console.warn("⚠ NEXT_PUBLIC_APP_URL is not set! CSRF origin validation will be restricted.");
    }
    if (!result.data.RAZORPAY_WEBHOOK_SECRET && !result.data.RAZORPAY_KEY_SECRET) {
      console.warn("⚠ No Razorpay webhook secret configured! Webhook verification will fail.");
    }
    if (!result.data.SENTRY_DSN) {
      console.warn("⚠ SENTRY_DSN is not set! Production errors will not be tracked.");
    }
  }

  cached = result.data;
  return cached;
}

export const env = new Proxy({} as Env, {
  get(_, key) {
    return validateEnv()[key as keyof Env];
  },
});
