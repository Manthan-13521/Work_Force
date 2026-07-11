import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { retry } from "@/lib/retry";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = env;
  if (!SMTP_HOST || !SMTP_PORT) {
    logger.warn("SMTP not configured — email not sent");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    pool: true,
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 10,
    socketTimeout: 10000,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  });

  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  const from = env.EMAIL_FROM || "noreply@localhost";

  try {
    await retry(
      () =>
        transport.sendMail({
          from,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ""),
          replyTo: env.EMAIL_REPLY_TO || undefined,
        }),
      { maxAttempts: 2, delayMs: 500 }
    );
    return true;
  } catch (error) {
    logger.error("SMTP send failed", {
      to,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
