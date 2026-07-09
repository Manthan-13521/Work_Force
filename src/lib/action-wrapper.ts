import { logger } from "./logger";
import { startSpan } from "./observability";

type ActionResult =
  | { error: string }
  | { error: Record<string, string[]> }
  | { success: true }
  | { success: true; [key: string]: unknown };

export async function withActionSpan<T extends ActionResult>(
  name: string,
  fn: () => Promise<T>,
  context?: { userId?: string; role?: string }
): Promise<T> {
  const span = startSpan(`action:${name}`, {
    userId: context?.userId,
    role: context?.role,
  });

  try {
    const result = await fn();
    const failed = "error" in result;
    span.finish(failed);

    if (failed) {
      logger.warn(`Server action failed: ${name}`, {
        action: name,
        error: typeof result.error === "string" ? result.error : "validation_error",
        userId: context?.userId,
        role: context?.role,
      });
    } else {
      logger.info(`Server action: ${name}`, {
        action: name,
        userId: context?.userId,
        role: context?.role,
      });
    }

    return result;
  } catch (e) {
    span.finish(true);
    const message = e instanceof Error ? e.message : String(e);
    logger.error(`Server action threw: ${name}`, {
      action: name,
      error: message,
      userId: context?.userId,
      role: context?.role,
    });
    throw e;
  }
}
