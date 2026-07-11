export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<SendResult | null>;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}
