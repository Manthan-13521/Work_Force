export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delayMs?: number; shouldRetry?: (error: unknown) => boolean } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 200, shouldRetry } = options;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (shouldRetry && !shouldRetry(e)) throw e;
      if (attempt < maxAttempts) {
        const jitter = delayMs * attempt * (0.5 + Math.random() * 0.5);
        const capped = Math.min(jitter, 10_000);
        await new Promise((r) => setTimeout(r, capped));
      }
    }
  }
  throw lastError;
}
