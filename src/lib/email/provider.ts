import nodemailer from "nodemailer";
import type { Transporter, SentMessageInfo } from "nodemailer";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { retry } from "@/lib/retry";

let transporter: Transporter | null = null;

function generateMessageId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const domain = env.SMTP_USER?.split("@")[1] || "workforce.local";
  return `<${timestamp}.${random}@${domain}>`;
}

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = env;
  if (!SMTP_HOST || !SMTP_PORT) {
    logger.warn("SMTP not configured — email not sent");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    rateDelta: 1000,
    rateLimit: 5,
    socketTimeout: 15000,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    tls: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    },
  });

  return transporter;
}

function buildHeaders(messageId: string): Record<string, string> {
  return {
    "Message-ID": messageId,
    "Date": new Date().toUTCString(),
    "X-Auto-Response-Suppress": "OOF, AutoReply, DR, NDR, RN, NRN",
    "Auto-Submitted": "auto-generated",
    "X-Priority": "3",
    "Precedence": "bulk",
    "MIME-Version": "1.0",
  };
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
  text: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  const from = env.EMAIL_FROM || "noreply@localhost";
  const replyTo = env.EMAIL_REPLY_TO || undefined;
  const messageId = generateMessageId();
  const start = Date.now();

  let attempts = 0;

  try {
    const result = await retry<SentMessageInfo>(
      async () => {
        attempts++;
        return transport.sendMail({
          from,
          to,
          subject,
          html,
          text,
          replyTo,
          messageId,
          headers: buildHeaders(messageId),
        });
      },
      { maxAttempts: 2, delayMs: 500 }
    );

    const duration = Date.now() - start;
    logger.info("Email sent", {
      messageId: result.messageId,
      provider: "smtp",
      recipient: to,
      duration,
      retryCount: attempts - 1,
      accepted: result.accepted?.length || 0,
      rejected: result.rejected?.length || 0,
    });

    return true;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error("SMTP send failed", {
      to,
      provider: "smtp",
      duration,
      retryCount: attempts,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
