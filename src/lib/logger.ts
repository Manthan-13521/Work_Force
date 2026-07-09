import { getRequestContext } from "./tracer";

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  AUDIT = "audit",
  SECURITY = "security",
}

type LogPayload = Record<string, unknown>;

const LOG_LEVELS: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.AUDIT]: 2,
  [LogLevel.SECURITY]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export function redact(value: unknown): unknown {
  if (typeof value === "string") {
    if (/^\d{10}$/.test(value)) return value.slice(0, 2) + "******" + value.slice(-2);
    if (/^\d{6}$/.test(value)) return "******";
    return value;
  }
  return value;
}

export function sanitizePayload(payload?: LogPayload): LogPayload | undefined {
  if (!payload) return undefined;
  const sanitized: LogPayload = {};
  for (const [key, val] of Object.entries(payload)) {
    if (["otp", "code", "token", "secret", "password", "key", "authkey", "authorization"].some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = redact(val);
    }
  }
  return sanitized;
}

function log(level: LogLevel, message: string, payload?: LogPayload) {
  if (!shouldLog(level)) return;
  const globalCtx = typeof globalThis !== "undefined" ? (globalThis as Record<string, unknown>)["__requestId"] : undefined;
  const requestId = typeof globalCtx === "string" ? globalCtx : undefined;
  const ctx = requestId ? getRequestContext(requestId) : undefined;
  const entry: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(ctx || {}),
    ...sanitizePayload(payload),
  };
  const output = JSON.stringify(entry);
  if (level === LogLevel.ERROR) {
    console.error(output);
  } else if (level === LogLevel.WARN || level === LogLevel.SECURITY) {
    console.warn(output);
  } else if (level === LogLevel.AUDIT) {
    console.info(`[AUDIT] ${output}`);
  } else {
    console.log(output);
  }
}

function createLogMethod(level: LogLevel) {
  return (message: string, payload?: LogPayload) => log(level, message, payload);
}

export const logger = {
  debug: createLogMethod(LogLevel.DEBUG),
  info: createLogMethod(LogLevel.INFO),
  warn: createLogMethod(LogLevel.WARN),
  error: createLogMethod(LogLevel.ERROR),
  audit: createLogMethod(LogLevel.AUDIT),
  security: createLogMethod(LogLevel.SECURITY),
};
