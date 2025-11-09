/**
 * Async state management utilities to prevent race conditions
 * Ensures state updates from concurrent operations don't conflict
 */

import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook to prevent race conditions in async operations
 * Ensures only the latest operation's result is used
 */
export const useAsyncOperation = <T>() => {
  const currentOperationRef = useRef<symbol | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (
      operation: () => Promise<T>,
      onSuccess: (result: T) => void,
      onError?: (error: Error) => void
    ): Promise<void> => {
      const operationId = Symbol('operation');
      currentOperationRef.current = operationId;

      try {
        const result = await operation();

        // Only update state if this is still the current operation and component is mounted
        if (
          currentOperationRef.current === operationId &&
          isMountedRef.current
        ) {
          onSuccess(result);
        }
      } catch (error) {
        // Only handle error if this is still the current operation and component is mounted
        if (
          currentOperationRef.current === operationId &&
          isMountedRef.current &&
          onError
        ) {
          onError(error instanceof Error ? error : new Error('Unknown error'));
        }
      }
    },
    []
  );

  const cancel = useCallback(() => {
    currentOperationRef.current = null;
  }, []);

  return { execute, cancel };
};

/**
 * Hook for debouncing async operations
 */
export const useDebouncedAsync = <T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { execute } = useAsyncOperation();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        execute(
          () => callback(...args),
          () => {}, // Success handled by original callback
          (error) => console.error('Debounced operation failed:', error)
        );
      }, delay);
    },
    [callback, delay, execute]
  );
};

/**
 * Hook for throttling async operations
 */
export const useThrottledAsync = <T extends (...args: any[]) => Promise<any>>(
  callback: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  const inThrottleRef = useRef(false);
  const { execute } = useAsyncOperation();

  return useCallback(
    (...args: Parameters<T>) => {
      if (inThrottleRef.current) return;

      inThrottleRef.current = true;

      execute(
        () => callback(...args),
        () => {
          setTimeout(() => {
            inThrottleRef.current = false;
          }, limit);
        },
        (error) => {
          console.error('Throttled operation failed:', error);
          setTimeout(() => {
            inThrottleRef.current = false;
          }, limit);
        }
      );
    },
    [callback, limit, execute]
  );
};

/**
 * Queue for sequential async operations
 */
export class AsyncQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Queue operation failed:', error);
        }
      }
    }

    this.processing = false;
  }

  clear(): void {
    this.queue = [];
  }

  get length(): number {
    return this.queue.length;
  }
}

/**
 * Hook for managing async queue
 */
export const useAsyncQueue = () => {
  const queueRef = useRef(new AsyncQueue());

  useEffect(() => {
    return () => {
      queueRef.current.clear();
    };
  }, []);

  return queueRef.current;
};

/**
 * Batch async operations together
 */
export const batchAsync = async <T>(
  operations: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<T[]> => {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((op) => op()));
    results.push(...batchResults);
  }

  return results;
};
