import { toast } from "sonner";
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

export interface EdgeFunctionError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * Handles edge function errors with user-friendly messages and proper logging
 */
export function handleEdgeFunctionError(error: unknown, functionName: string): EdgeFunctionError {
  console.error(`Edge function error [${functionName}]:`, error);

  // Rate limit error (429)
  if (error instanceof FunctionsHttpError && error.context?.status === 429) {
    const message = "You're sending requests too quickly. Please wait a moment and try again.";
    toast.error(message);
    return {
      message,
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429
    };
  }

  // Payment required error (402) - Out of credits
  if (error instanceof FunctionsHttpError && error.context?.status === 402) {
    const message = "AI credits depleted. Please add credits in Settings → Workspace → Usage.";
    toast.error(message, {
      duration: 6000,
      action: {
        label: "View Settings",
        onClick: () => window.location.href = "/settings"
      }
    });
    return {
      message,
      code: 'PAYMENT_REQUIRED',
      status: 402
    };
  }

  // HTTP errors (4xx, 5xx)
  if (error instanceof FunctionsHttpError) {
    const message = error.context?.body?.error || error.message || 'An error occurred';
    toast.error(message);
    return {
      message,
      code: 'HTTP_ERROR',
      status: error.context?.status,
      details: error.context?.body
    };
  }

  // Network/relay errors
  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    const message = "Network error. Please check your connection and try again.";
    toast.error(message);
    return {
      message,
      code: 'NETWORK_ERROR'
    };
  }

  // Generic errors
  if (error instanceof Error) {
    const message = error.message || 'An unexpected error occurred';
    toast.error(message);
    return {
      message,
      code: 'UNKNOWN_ERROR',
      details: error
    };
  }

  // Unknown error types
  const message = 'An unexpected error occurred. Please try again.';
  toast.error(message);
  return {
    message,
    code: 'UNKNOWN_ERROR',
    details: error
  };
}

/**
 * Wrapper for edge function invocations with automatic error handling
 */
export async function invokeEdgeFunction<T = any>(
  supabase: any,
  functionName: string,
  body?: Record<string, any>,
  options?: {
    showSuccessToast?: boolean;
    successMessage?: string;
    suppressErrorToast?: boolean;
  }
): Promise<{ data: T | null; error: EdgeFunctionError | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

    if (error) {
      const handledError = handleEdgeFunctionError(error, functionName);
      return { data: null, error: handledError };
    }

    // Handle application-level errors in the response
    if (data?.error) {
      const message = data.error;
      if (!options?.suppressErrorToast) {
        toast.error(message);
      }
      return {
        data: null,
        error: {
          message,
          code: 'APPLICATION_ERROR',
          details: data
        }
      };
    }

    // Success toast if requested
    if (options?.showSuccessToast && options?.successMessage) {
      toast.success(options.successMessage);
    }

    return { data, error: null };
  } catch (error) {
    const handledError = handleEdgeFunctionError(error, functionName);
    return { data: null, error: handledError };
  }
}

/**
 * Checks if an error is a rate limit error
 */
export function isRateLimitError(error: EdgeFunctionError | null): boolean {
  return error?.code === 'RATE_LIMIT_EXCEEDED' || error?.status === 429;
}

/**
 * Checks if an error is a payment/credits error
 */
export function isPaymentError(error: EdgeFunctionError | null): boolean {
  return error?.code === 'PAYMENT_REQUIRED' || error?.status === 402;
}

/**
 * Retry function with exponential backoff for rate limit errors
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry for non-rate-limit errors
      if (!(error instanceof FunctionsHttpError && error.context?.status === 429)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Rate limited, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
