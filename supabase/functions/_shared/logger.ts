/**
 * Structured Logging Utility
 * Replaces console.log with structured, searchable logs
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: unknown;
}

interface StructuredLog {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

class Logger {
  private functionName: string;

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const structuredLog: StructuredLog = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        function: this.functionName,
        ...context
      }
    };

    const logMethod = level === 'ERROR' ? console.error : console.log;
    logMethod(JSON.stringify(structuredLog));
  }

  debug(message: string, context?: LogContext): void {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const structuredLog: StructuredLog = {
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      context: {
        function: this.functionName,
        ...context
      }
    };

    if (error instanceof Error) {
      structuredLog.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    } else if (error) {
      structuredLog.context = {
        ...structuredLog.context,
        error: String(error)
      };
    }

    console.error(JSON.stringify(structuredLog));
  }

  /**
   * Log AI API call metrics
   */
  logAICall(params: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    cost: number;
    success: boolean;
    errorCode?: string;
  }): void {
    this.info('AI_CALL_COMPLETED', {
      ...params,
      event_type: 'ai_call'
    });
  }

  /**
   * Time a function execution
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`${label} completed`, { duration_ms: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`${label} failed`, error, { duration_ms: duration });
      throw error;
    }
  }
}

/**
 * Create a logger instance for a function
 */
export function createLogger(functionName: string): Logger {
  return new Logger(functionName);
}

export { Logger };
export type { LogLevel, LogContext };
