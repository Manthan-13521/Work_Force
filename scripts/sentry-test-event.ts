/**
 * Sentry Test Event Script
 *
 * Sends a test error event to Sentry to verify configuration.
 * Run: npx tsx scripts/sentry-test-event.ts <message>
 */

async function main() {
  const message = process.argv[2] || "Production validation test event";

  const SENTRY_DSN = process.env.SENTRY_DSN;
  if (!SENTRY_DSN) {
    console.error("❌ SENTRY_DSN environment variable is not set");
    process.exit(1);
  }

  const dsn = new URL(SENTRY_DSN);
  const projectId = dsn.pathname.replace("/", "");
  const host = dsn.hostname;
  const key = dsn.username;

  const body = JSON.stringify({
    event_id: crypto.randomUUID?.() || Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    level: "error",
    timestamp: new Date().toISOString(),
    logger: "production-validation",
    message: {
      formatted: message,
    },
    extra: {
      source: "production-validation-script",
      node_version: process.version,
      platform: process.platform,
    },
    tags: {
      environment: "production-validation",
      script: "sentry-test-event",
    },
  });

  console.log(`Sending test event to Sentry (${host})...`);
  const res = await fetch(`https://${host}/api/${projectId}/store/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}, sentry_client=sentry-test-script/1.0`,
    },
    body,
  });

  if (res.ok || res.status === 200) {
    console.log("✅ Sentry test event sent successfully");
    console.log("   Check your Sentry dashboard to confirm the event appears");
    process.exit(0);
  } else {
    const text = await res.text();
    console.error(`❌ Failed to send Sentry test event: ${res.status} ${res.statusText}`);
    console.error(`   Response: ${text}`);
    process.exit(1);
  }
}

main();
