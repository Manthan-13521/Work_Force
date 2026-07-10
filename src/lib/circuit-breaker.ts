type State = "CLOSED" | "OPEN" | "HALF_OPEN";

type CircuitBreakerOptions = {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxRequests?: number;
  onStateChange?: (state: State, previous: State) => void;
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
  private name: string;

  constructor(name: string, opts?: Partial<CircuitBreakerOptions>) {
    this.name = name;
    this.options = { ...defaults, ...opts };
  }

  private transition(newState: State) {
    const prev = this.state;
    this.state = newState;
    this.options.onStateChange?.(newState, prev);
  }

  async call<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs) {
        this.transition("HALF_OPEN");
        this.halfOpenRequests = 0;
      } else {
        if (fallback) return fallback();
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    if (this.state === "HALF_OPEN" && this.halfOpenRequests >= (this.options.halfOpenMaxRequests ?? 1)) {
      if (fallback) return fallback();
      throw new Error(`Circuit breaker ${this.name} is HALF_OPEN (max requests reached)`);
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
    this.transition("CLOSED");
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.options.failureThreshold) {
      this.transition("OPEN");
    }
  }

  getState(): State {
    return this.state;
  }

  reset() {
    this.failureCount = 0;
    this.transition("CLOSED");
  }
}
