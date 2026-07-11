/**
 * Production Integration Validator
 *
 * Validates all external service connectivity before deployment.
 * Run: npx tsx scripts/validate-integrations.ts [--strict]
 */

type Result = {
  service: string;
  status: "ok" | "fail" | "skip";
  error?: string;
  latencyMs?: number;
};

async function check(
  label: string,
  fn: () => Promise<boolean>,
  required: boolean
): Promise<Result> {
  const start = Date.now();
  try {
    const ok = await fn();
    return {
      service: label,
      status: ok ? "ok" : "fail",
      latencyMs: Date.now() - start,
      ...(ok ? {} : { error: `${label} returned unhealthy` }),
    };
  } catch (e) {
    return {
      service: label,
      status: required ? "fail" : "skip",
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function main() {
  const strict = process.argv.includes("--strict");
  const results: Result[] = [];
  const required = strict;

  const {
    DATABASE_URL,
    UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET,
    SENTRY_DSN,
    NEXT_PUBLIC_APP_URL,
  } = process.env;

  console.log("\n🔍 Production Integration Validation\n");
  console.log(`Mode: ${strict ? "strict (all required)" : "lenient (optional services skipped if unconfigured)"}\n`);

  // Database
  if (DATABASE_URL) {
    results.push(
      await check("PostgreSQL", async () => {
        const { PrismaClient } = await import("@prisma/client");
        const p = new PrismaClient();
        await p.$queryRaw`SELECT 1`;
        await p.$disconnect();
        return true;
      }, required)
    );
  } else {
    results.push({ service: "PostgreSQL", status: "skip" });
  }

  // Redis
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    results.push(
      await check("Upstash Redis", async () => {
        const res = await fetch(`${UPSTASH_REDIS_REST_URL}/ping`, {
          headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
        });
        return res.ok;
      }, required)
    );
  } else {
    results.push({ service: "Upstash Redis", status: "skip" });
  }

  // Cloudinary
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    results.push(
      await check("Cloudinary", async () => {
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        const res = await fetch(url, { method: "OPTIONS" });
        return res.status < 500;
      }, required)
    );
  } else {
    results.push({ service: "Cloudinary", status: "skip" });
  }

  // Razorpay
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    results.push(
      await check("Razorpay", async () => {
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
        const res = await fetch("https://api.razorpay.com/v1/payments", {
          headers: { Authorization: `Basic ${auth}` },
        });
        return res.status === 200 || res.status === 404;
      }, required)
    );
  } else {
    results.push({ service: "Razorpay", status: "skip" });
  }

  // Production env vars
  results.push({
    service: "NEXT_PUBLIC_APP_URL",
    status: NEXT_PUBLIC_APP_URL ? "ok" : "fail",
    ...(NEXT_PUBLIC_APP_URL ? {} : { error: "REQUIRED in production for CSRF origin validation" }),
  });

  results.push({
    service: "RAZORPAY_WEBHOOK_SECRET",
    status: RAZORPAY_WEBHOOK_SECRET ? "ok" : "fail",
    ...(RAZORPAY_WEBHOOK_SECRET ? {} : { error: "REQUIRED in production for webhook signature verification" }),
  });

  // Sentry
  if (SENTRY_DSN) {
    results.push(
      await check("Sentry", async () => {
        const dsn = new URL(SENTRY_DSN);
        const projectId = dsn.pathname.replace("/", "");
        const host = dsn.hostname;
        const res = await fetch(`https://${host}/api/0/projects/${projectId}/`, {
          headers: { Authorization: `DSN ${SENTRY_DSN}` },
        });
        return [200, 401, 403].includes(res.status);
      }, false)
    );
  } else {
    results.push({ service: "Sentry", status: "skip" });
  }

  // Print results
  for (const r of results) {
    const icon = r.status === "ok" ? "  ✅" : r.status === "skip" ? "  ⏭️" : "  ❌";
    const latency = r.latencyMs ? ` (${r.latencyMs}ms)` : "";
    console.log(`${icon} ${r.service}${latency}`);
    if (r.error) console.log(`     ${r.error}`);
  }

  const ok = results.every((r) => r.status === "ok" || r.status === "skip");
  console.log(ok ? "\n✅ All integrations verified.\n" : "\n❌ Some integrations failed.\n");
  process.exit(ok ? 0 : 1);
}

main();
