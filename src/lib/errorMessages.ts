/**
 * User-friendly error messages for resume generation
 * Maps technical errors to helpful guidance
 */

export interface ErrorContext {
  error: Error;
  operation: 'research' | 'ideal_generation' | 'personalized_generation' | 'general';
  retryable: boolean;
}

export const getErrorMessage = (context: ErrorContext): {
  title: string;
  description: string;
  actionText?: string;
  action?: () => void;
} => {
  const { error, operation } = context;
  const errorMessage = error.message.toLowerCase();
  
  // Check for structured error responses from edge functions
  try {
    const errorData = JSON.parse(error.message);
    if (errorData.error && errorData.message) {
      switch (errorData.error) {
        case 'API_KEY_MISSING':
          return {
            title: "Configuration Error",
            description: errorData.message,
            actionText: "Contact Support",
          };
        case 'AI_GENERATION_FAILED':
          return {
            title: errorData.statusCode === 429 ? "Rate Limit Exceeded" : "AI Service Error",
            description: errorData.message,
            actionText: "Retry",
          };
        case 'MISSING_JOB_ANALYSIS':
          return {
            title: "Missing Job Analysis",
            description: errorData.message,
            actionText: "Edit Job Description",
          };
        case 'NETWORK_ERROR':
          return {
            title: "Connection Error",
            description: errorData.message,
            actionText: "Retry",
          };
        case 'TIMEOUT_ERROR':
          return {
            title: "Request Timeout",
            description: errorData.message,
            actionText: "Retry",
          };
      }
    }
  } catch (e) {
    // Not a JSON error, continue with pattern matching
  }

  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      title: "Too many requests",
      description: "Please wait a moment before trying again. Our AI is processing many requests.",
      actionText: "Try again in 30s",
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      title: "Connection issue",
      description: "Check your internet connection and try again.",
      actionText: "Retry",
    };
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      title: "Generation taking too long",
      description: "The AI is taking longer than expected. This usually resolves itself - please try again.",
      actionText: "Retry",
    };
  }

  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return {
      title: "Session expired",
      description: "Your session has expired. Please refresh the page and log in again.",
      actionText: "Refresh page",
    };
  }

  // Empty job description
  if (errorMessage.includes('job description') && errorMessage.includes('empty')) {
    return {
      title: "Missing job description",
      description: "Please provide a job description to generate your resume content.",
    };
  }

  // Research-specific errors
  if (operation === 'research') {
    if (errorMessage.includes('analysis failed') || errorMessage.includes('research failed')) {
      return {
        title: "Job analysis incomplete",
        description: "We couldn't analyze the job description. Please check that it contains enough detail about the role.",
        actionText: "Edit job description",
      };
    }
  }

  // Generation-specific errors
  if (operation === 'ideal_generation') {
    return {
      title: "Industry standard generation failed",
      description: "We encountered an issue creating the industry-standard example. Your job description may need more detail.",
      actionText: "Try again",
    };
  }

  if (operation === 'personalized_generation') {
    return {
      title: "Personalization failed",
      description: "We couldn't personalize the content with your Career Vault. Try using the industry standard version instead.",
      actionText: "Use industry standard",
    };
  }

  // Invalid response format
  if (errorMessage.includes('json') || errorMessage.includes('parse')) {
    return {
      title: "AI response format error",
      description: "The AI returned an unexpected format. This is usually temporary - please try again.",
      actionText: "Regenerate",
    };
  }

  // Generic fallback
  return {
    title: "Generation failed",
    description: "Something went wrong during generation. Please try again or contact support if the issue persists.",
    actionText: "Try again",
  };
};

/**
 * Get a recovery suggestion based on the error context
 */
export const getRecoverySuggestion = (context: ErrorContext): string[] => {
  const { error, operation } = context;
  const errorMessage = error.message.toLowerCase();

  const suggestions: string[] = [];

  // Research errors
  if (operation === 'research') {
    suggestions.push("Make sure your job description is detailed and complete");
    suggestions.push("Check that company name and job title are filled in");
  }

  // Personalization errors
  if (operation === 'personalized_generation') {
    suggestions.push("Try selecting different Career Vault items");
    suggestions.push("Use the industry standard version for now");
    suggestions.push("Complete your Career Vault with more details");
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    suggestions.push("Check your internet connection");
    suggestions.push("Try refreshing the page");
    suggestions.push("Disable VPN if you're using one");
  }

  // Rate limit errors
  if (errorMessage.includes('rate limit')) {
    suggestions.push("Wait 30-60 seconds before trying again");
    suggestions.push("Consider upgrading your plan for higher limits");
  }

  // Generic suggestions if no specific ones
  if (suggestions.length === 0) {
    suggestions.push("Try again in a moment");
    suggestions.push("Refresh the page and retry");
    suggestions.push("Contact support if this persists");
  }

  return suggestions;
};

/**
 * Determine if an error is retryable
 */
export const isRetryableError = (error: Error): boolean => {
  const errorMessage = error.message.toLowerCase();

  // Not retryable
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    return false;
  }
  if (errorMessage.includes('invalid') && errorMessage.includes('job')) {
    return false;
  }

  // Retryable
  if (errorMessage.includes('timeout')) return true;
  if (errorMessage.includes('network')) return true;
  if (errorMessage.includes('rate limit')) return true;
  if (errorMessage.includes('503') || errorMessage.includes('500')) return true;

  // Default: retryable
  return true;
};
