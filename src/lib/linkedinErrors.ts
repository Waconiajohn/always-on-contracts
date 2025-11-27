export enum LinkedInErrorCode {
  INVALID_INPUT = 'invalid_input',
  RATE_LIMITED = 'rate_limited',
  AI_GENERATION_FAILED = 'ai_generation_failed',
  VAULT_DATA_MISSING = 'vault_data_missing',
  AUTHENTICATION_REQUIRED = 'authentication_required',
  CHARACTER_LIMIT_EXCEEDED = 'character_limit_exceeded'
}

export class LinkedInError extends Error {
  constructor(
    public code: LinkedInErrorCode,
    message: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LinkedInError';
  }
}

export function handleLinkedInError(error: any): { 
  title: string; 
  description: string; 
  variant: 'destructive' | 'default';
  action?: string;
  retryAfter?: number;
} {
  if (error instanceof LinkedInError) {
    switch (error.code) {
      case LinkedInErrorCode.RATE_LIMITED:
        return {
          title: 'Rate limit reached',
          description: 'You\'ve reached the rate limit. Please wait 5-10 minutes before trying again. This helps maintain quality output.',
          variant: 'destructive',
          action: 'retry_later',
          retryAfter: 300000 // 5 minutes in ms
        };
      
      case LinkedInErrorCode.VAULT_DATA_MISSING:
        return {
          title: 'Career Vault needs more data',
          description: 'To generate high-quality LinkedIn content, please add at least 10 career milestones and complete the Intelligence Builder.',
          variant: 'default',
          action: 'go_to_vault'
        };
      
      case LinkedInErrorCode.CHARACTER_LIMIT_EXCEEDED:
        return {
          title: 'LinkedIn limit exceeded',
          description: `${error.userMessage} Try using a briefer writing style or selecting fewer items.`,
          variant: 'destructive'
        };
      
      case LinkedInErrorCode.AI_GENERATION_FAILED:
        return {
          title: 'AI generation failed',
          description: 'The AI service encountered an error. Please try again in a moment.',
          variant: 'destructive',
          action: 'retry_later',
          retryAfter: 10000 // 10 seconds
        };
      
      default:
        return {
          title: 'Generation failed',
          description: error.userMessage || 'An unexpected error occurred. Please try again.',
          variant: 'destructive'
        };
    }
  }
  
  // Generic error
  return {
    title: 'Something went wrong',
    description: error.message || 'Please try again. If the issue persists, check your Career Vault data.',
    variant: 'destructive'
  };
}
