/**
 * Comprehensive Error Handling & Retry Logic
 */

import { toast } from 'sonner';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = true,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Exponential backoff with jitter
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
  
  // Add jitter (±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponentialDelay + jitter);
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (error instanceof RetryableError && !error.retryable) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, finalConfig);
      
      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Parse Supabase edge function errors
 */
export function parseEdgeFunctionError(error: any): RetryableError {
  const message = error?.message || 'Unknown error occurred';
  const statusCode = error?.status || error?.statusCode;

  // Rate limiting (429) - retryable
  if (statusCode === 429) {
    return new RetryableError(
      'Rate limit exceeded. Please wait a moment and try again.',
      true,
      429
    );
  }

  // Payment required (402) - not retryable
  if (statusCode === 402) {
    return new RetryableError(
      'Credits exhausted. Please add more credits to continue.',
      false,
      402
    );
  }

  // Server errors (5xx) - retryable
  if (statusCode >= 500 && statusCode < 600) {
    return new RetryableError(
      'Server error occurred. Retrying automatically...',
      true,
      statusCode
    );
  }

  // Timeout errors - retryable
  if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('timed out')) {
    return new RetryableError(
      'Request timed out. Retrying...',
      true
    );
  }

  // Network errors - retryable
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return new RetryableError(
      'Network error. Checking connection...',
      true
    );
  }

  // Client errors (4xx) - generally not retryable
  if (statusCode >= 400 && statusCode < 500) {
    return new RetryableError(
      message,
      false,
      statusCode
    );
  }

  // Default: retryable
  return new RetryableError(message, true);
}

/**
 * Execute with retry and user feedback
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    operationName: string;
    config?: Partial<RetryConfig>;
    showToasts?: boolean;
  }
): Promise<T> {
  const { operationName, config, showToasts = true } = options;

  try {
    return await retryWithBackoff(
      fn,
      config,
      (attempt, error) => {
        if (showToasts) {
          toast.info(`Retry ${attempt}/${config?.maxRetries || 3}`, {
            description: `${operationName} failed. Retrying...`
          });
        }
        console.warn(`Retry attempt ${attempt} for ${operationName}:`, error);
      }
    );
  } catch (error) {
    const parsedError = parseEdgeFunctionError(error);
    
    if (showToasts) {
      toast.error(`${operationName} Failed`, {
        description: parsedError.message
      });
    }
    
    throw parsedError;
  }
}

/**
 * State recovery utilities
 */
export interface SavedState {
  timestamp: number;
  step: string;
  data: any;
}

export class StateManager {
  private storageKey: string;

  constructor(key: string) {
    this.storageKey = `resume-builder-${key}`;
  }

  saveState(step: string, data: any): void {
    try {
      const state: SavedState = {
        timestamp: Date.now(),
        step,
        data
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  loadState(): SavedState | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const state: SavedState = JSON.parse(stored);
      
      // Check if state is not too old (24 hours)
      const age = Date.now() - state.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        this.clearState();
        return null;
      }

      return state;
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }

  clearState(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear state:', error);
    }
  }

  hasState(): boolean {
    return this.loadState() !== null;
  }
}
