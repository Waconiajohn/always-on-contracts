// =====================================================
// RETRY WITH EXPONENTIAL BACKOFF HOOK
// =====================================================

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface RetryConfig {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  lastError: Error | null;
}

export function useRetryWithBackoff(config: RetryConfig = {}) {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = config;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  // Track latest error in ref to avoid stale closure
  const lastErrorRef = useRef<Error | null>(null);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const calculateDelay = useCallback(
    (attempt: number) => {
      const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
      // Add jitter (±20%) to prevent thundering herd
      const jitter = delay * 0.2 * (Math.random() - 0.5);
      return Math.min(delay + jitter, maxDelayMs);
    },
    [initialDelayMs, backoffMultiplier, maxDelayMs]
  );

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const executeWithRetry = useCallback(
    async <T>(
      fn: (signal: AbortSignal) => Promise<T>,
      options?: { silent?: boolean }
    ): Promise<T> => {
      // Abort any existing operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setState({ isRetrying: false, attempt: 0, lastError: null });
      lastErrorRef.current = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          setState((prev) => ({ ...prev, attempt, isRetrying: attempt > 1 }));

          const result = await fn(signal);

          // Success - reset state
          setState({ isRetrying: false, attempt: 0, lastError: null });
          lastErrorRef.current = null;
          return result;
        } catch (error) {
          if (signal.aborted) {
            throw new Error("Operation cancelled");
          }

          const err = error instanceof Error ? error : new Error(String(error));
          setState((prev) => ({ ...prev, lastError: err }));
          lastErrorRef.current = err;

          // Check if we should retry
          if (attempt < maxAttempts) {
            const delay = calculateDelay(attempt);

            if (!options?.silent) {
              toast.warning(`Request failed. Retrying in ${Math.round(delay / 1000)}s...`, {
                description: `Attempt ${attempt} of ${maxAttempts}`,
              });
            }

            onRetry?.(attempt, err);
            await sleep(delay);
          } else {
            // Final attempt failed
            setState((prev) => ({ ...prev, isRetrying: false }));
            throw err;
          }
        }
      }

      // Use ref to avoid stale closure issue
      throw lastErrorRef.current || new Error("All retry attempts failed");
    },
    [maxAttempts, calculateDelay, onRetry]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({ isRetrying: false, attempt: 0, lastError: null });
    lastErrorRef.current = null;
    logger.debug("Retry operation cancelled");
  }, []);

  return {
    executeWithRetry,
    cancel,
    isRetrying: state.isRetrying,
    currentAttempt: state.attempt,
    lastError: state.lastError,
  };
}
