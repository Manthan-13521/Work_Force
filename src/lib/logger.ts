export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

type LogPayload = Record<string, unknown>;

const LOG_LEVELS: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function log(level: LogLevel, message: string, payload?: LogPayload) {
  if (!shouldLog(level)) return;
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  if (level === LogLevel.ERROR) {
    console.error(JSON.stringify(entry));
  } else if (level === LogLevel.WARN) {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (message: string, payload?: LogPayload) => log(LogLevel.DEBUG, message, payload),
  info: (message: string, payload?: LogPayload) => log(LogLevel.INFO, message, payload),
  warn: (message: string, payload?: LogPayload) => log(LogLevel.WARN, message, payload),
  error: (message: string, payload?: LogPayload) => log(LogLevel.ERROR, message, payload),
};
