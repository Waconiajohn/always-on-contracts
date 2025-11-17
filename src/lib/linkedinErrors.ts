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
} {
  if (error instanceof LinkedInError) {
    switch (error.code) {
      case LinkedInErrorCode.RATE_LIMITED:
        return {
          title: 'Rate limit reached',
          description: 'Please wait a few minutes before trying again.',
          variant: 'destructive',
          action: 'retry_later'
        };
      
      case LinkedInErrorCode.VAULT_DATA_MISSING:
        return {
          title: 'Career Vault incomplete',
          description: 'Please complete your Career Vault first to enable LinkedIn optimization.',
          variant: 'default',
          action: 'go_to_vault'
        };
      
      case LinkedInErrorCode.CHARACTER_LIMIT_EXCEEDED:
        return {
          title: 'LinkedIn limit exceeded',
          description: error.userMessage,
          variant: 'destructive'
        };
      
      default:
        return {
          title: 'Generation failed',
          description: error.userMessage,
          variant: 'destructive'
        };
    }
  }
  
  // Generic error
  return {
    title: 'Something went wrong',
    description: error.message || 'Please try again',
    variant: 'destructive'
  };
}
