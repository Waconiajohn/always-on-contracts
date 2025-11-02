/**
 * Robust Error Handling for AI Operations
 */

export type AIErrorCode = 
  | 'RATE_LIMIT'
  | 'PAYMENT_REQUIRED'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'API_ERROR'
  | 'CIRCUIT_OPEN'
  | 'VALIDATION_ERROR';

export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public statusCode?: number,
    public retryable: boolean = false,
    public userMessage?: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Parse and categorize Perplexity API errors
 */
export function handlePerplexityError(error: any): AIError {
  const errorMessage = error?.message || String(error);
  
  // Rate limiting (429)
  if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
    return new AIError(
      'Rate limit exceeded',
      'RATE_LIMIT',
      429,
      true,
      'Too many requests. Please wait a moment and try again.',
      60
    );
  }
  
  // Payment required (402)
  if (errorMessage.includes('402') || errorMessage.toLowerCase().includes('payment')) {
    return new AIError(
      'Payment required',
      'PAYMENT_REQUIRED',
      402,
      false,
      'Your Perplexity API credits are depleted. Please add credits to continue.'
    );
  }
  
  // Timeout errors
  if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('aborted')) {
    return new AIError(
      'Request timed out',
      'TIMEOUT',
      408,
      true,
      'The AI request took too long. Please try again.',
      5
    );
  }
  
  // Invalid JSON response
  if (errorMessage.toLowerCase().includes('json') || errorMessage.toLowerCase().includes('parse')) {
    return new AIError(
      'Invalid AI response format',
      'INVALID_RESPONSE',
      500,
      true,
      'The AI returned an invalid response. Please try again.'
    );
  }
  
  // Server errors (5xx)
  if (errorMessage.includes('50') || errorMessage.toLowerCase().includes('server error')) {
    return new AIError(
      'Server error occurred',
      'API_ERROR',
      500,
      true,
      'The AI service is temporarily unavailable. Please try again.'
    );
  }
  
  // Generic API error
  return new AIError(
    errorMessage,
    'API_ERROR',
    500,
    true,
    'An unexpected error occurred. Please try again.'
  );
}

/**
 * Exponential backoff with jitter
 */
export function calculateBackoff(attempt: number, baseDelay = 1000, maxDelay = 10000): number {
  const exponential = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponential + jitter);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  onRetry?: (attempt: number, error: AIError) => void
): Promise<T> {
  let lastError: AIError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof AIError ? error : handlePerplexityError(error);
      
      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = calculateBackoff(attempt);
      
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: AIError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.userMessage || error.message,
      retryable: error.retryable,
      retryAfter: error.retryAfter,
      details: error.message
    }
  };
}
