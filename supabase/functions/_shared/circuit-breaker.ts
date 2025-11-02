/**
 * Circuit Breaker Pattern for AI API Resilience
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  name: string;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 300000, // 5 minutes
      name: config.name || 'default'
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.config.timeout) {
        console.log(`[CircuitBreaker:${this.config.name}] Transitioning to HALF_OPEN`);
        this.state = 'HALF_OPEN';
        this.successes = 0;
      } else {
        const waitTime = Math.ceil((this.config.timeout - (Date.now() - this.lastFailureTime)) / 1000);
        throw new Error(
          `Circuit breaker is OPEN. Service unavailable. Try again in ${waitTime}s.`
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        console.log(`[CircuitBreaker:${this.config.name}] Transitioning to CLOSED`);
        this.state = 'CLOSED';
        this.successes = 0;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      console.log(`[CircuitBreaker:${this.config.name}] Failure in HALF_OPEN, transitioning to OPEN`);
      this.state = 'OPEN';
      this.successes = 0;
    } else if (this.failures >= this.config.failureThreshold) {
      console.log(`[CircuitBreaker:${this.config.name}] Failure threshold reached, transitioning to OPEN`);
      this.state = 'OPEN';
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }
}

// Global circuit breaker instance for Perplexity API
export const perplexityCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 300000, // 5 minutes
  name: 'Perplexity'
});

export { CircuitBreaker };
export type { CircuitState, CircuitBreakerConfig };
