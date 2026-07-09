type State = "CLOSED" | "OPEN" | "HALF_OPEN";

type CircuitBreakerOptions = {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxRequests?: number;
};

const defaults: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenMaxRequests: 1,
};

export class CircuitBreaker {
  private state: State = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenRequests = 0;
  private options: CircuitBreakerOptions;

  constructor(name: string, opts?: Partial<CircuitBreakerOptions>) {
    this.options = { ...defaults, ...opts };
  }

  async call<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        this.halfOpenRequests = 0;
      } else {
        if (fallback) return fallback();
        throw new Error("Circuit breaker is OPEN");
      }
    }

    if (this.state === "HALF_OPEN" && this.halfOpenRequests >= (this.options.halfOpenMaxRequests ?? 1)) {
      if (fallback) return fallback();
      throw new Error("Circuit breaker is HALF_OPEN (max requests reached)");
    }

    this.halfOpenRequests++;
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (e) {
      this.onFailure();
      if (fallback) return fallback();
      throw e;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
    }
  }

  getState(): State {
    return this.state;
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
  }
}
