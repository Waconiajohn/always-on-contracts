/**
 * Application Logger Utility
 *
 * Provides structured logging with environment-aware output.
 * In development: logs to console
 * In production: only errors are logged (can be extended to send to external service)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDev = import.meta.env.DEV;

  /**
   * Debug-level logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log('[DEBUG]', message, context || '');
    }
  }

  /**
   * Info-level logging - only in development
   */
  info(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.info('[INFO]', message, context || '');
    }
  }

  /**
   * Warning-level logging - only in development
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.warn('[WARN]', message, context || '');
    }
  }

  /**
   * Error-level logging - always logged
   * TODO: Send to error tracking service (Sentry, LogRocket, etc.)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error('[ERROR]', message, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      ...context,
    });

    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error);
  }

  /**
   * Group logging - useful for related log messages
   */
  group(label: string, fn: () => void): void {
    if (this.isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  }

  /**
   * Performance timing
   */
  time(label: string): void {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogLevel, LogContext };
