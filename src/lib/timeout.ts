export function withTimeout<T>(promise: Promise<T>, ms: number, label?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return Promise.race([
    promise.finally(() => clearTimeout(timeout)),
    new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () => {
        reject(new Error(label ? `Timeout: ${label} exceeded ${ms}ms` : `Operation timed out after ${ms}ms`));
      });
    }),
  ]);
}
