/**
 * Metrics Collection for AI Operations
 * Tracks performance, costs, and usage patterns
 */

interface MetricData {
  function_name: string;
  metric_type: 'latency' | 'error' | 'token_usage' | 'cost';
  value: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

class MetricsCollector {
  private functionName: string;
  private timers: Map<string, number> = new Map();

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  /**
   * Start a timer for measuring latency
   */
  startTimer(operationName: string): () => number {
    const startTime = Date.now();
    this.timers.set(operationName, startTime);
    
    return (): number => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      this.timers.delete(operationName);
      return duration;
    };
  }

  /**
   * Record latency metric
   */
  recordLatency(operationName: string, latencyMs: number, metadata?: Record<string, any>): void {
    const metric: MetricData = {
      function_name: this.functionName,
      metric_type: 'latency',
      value: latencyMs,
      metadata: {
        operation: operationName,
        ...metadata
      },
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify({ type: 'metric', ...metric }));
  }

  /**
   * Record error metric
   */
  recordError(errorCode: string, metadata?: Record<string, any>): void {
    const metric: MetricData = {
      function_name: this.functionName,
      metric_type: 'error',
      value: 1,
      metadata: {
        error_code: errorCode,
        ...metadata
      },
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify({ type: 'metric', ...metric }));
  }

  /**
   * Record token usage
   */
  recordTokenUsage(inputTokens: number, outputTokens: number, model: string): void {
    const metric: MetricData = {
      function_name: this.functionName,
      metric_type: 'token_usage',
      value: inputTokens + outputTokens,
      metadata: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model
      },
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify({ type: 'metric', ...metric }));
  }

  /**
   * Record cost metric
   */
  recordCost(costUsd: number, model: string, metadata?: Record<string, any>): void {
    const metric: MetricData = {
      function_name: this.functionName,
      metric_type: 'cost',
      value: costUsd,
      metadata: {
        model,
        ...metadata
      },
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify({ type: 'metric', ...metric }));
  }

  /**
   * Time and measure an async operation
   */
  async measure<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
    const timer = this.startTimer(operationName);
    try {
      const result = await fn();
      this.recordLatency(operationName, timer(), { success: true });
      return result;
    } catch (error) {
      const latency = timer();
      this.recordLatency(operationName, latency, { success: false });
      throw error;
    }
  }
}

/**
 * Create a metrics collector for a function
 */
export function createMetricsCollector(functionName: string): MetricsCollector {
  return new MetricsCollector(functionName);
}

export { MetricsCollector };
export type { MetricData };
