import { Resend } from "resend";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { retry } from "@/lib/retry";
import { withTimeout } from "@/lib/timeout";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (client) return client;
  if (env.RESEND_API_KEY) {
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
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
  const resend = getClient();
  if (!resend) {
    logger.warn("Resend not configured — email not sent", { to });
    return false;
  }

  const from = env.EMAIL_FROM || "noreply@workforce.app";

  try {
    await retry(() =>
      withTimeout(
        resend.emails.send({
          from,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ""),
          replyTo: env.EMAIL_REPLY_TO || undefined,
        }),
        10000,
        "Resend sendEmail"
      )
    );
    return true;
  } catch (error) {
    logger.error("Resend send failed", { to, error: String(error) });
    return false;
  }
}
