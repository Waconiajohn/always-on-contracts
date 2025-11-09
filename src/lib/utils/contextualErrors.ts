/**
 * Contextual error handling with specific, actionable messages
 * Replaces generic error toasts with context-aware feedback
 */

import { toast } from 'sonner';

export type ErrorContext =
  | 'vault_load'
  | 'vault_save'
  | 'vault_delete'
  | 'vault_regenerate'
  | 'quiz_load'
  | 'quiz_save'
  | 'milestone_load'
  | 'milestone_save'
  | 'milestone_delete'
  | 'skill_confirm'
  | 'skill_add'
  | 'career_goals_save'
  | 'role_suggestions'
  | 'ai_generation'
  | 'resume_generate'
  | 'resume_save'
  | 'resume_export'
  | 'job_import'
  | 'job_analysis'
  | 'auth_signin'
  | 'auth_signup'
  | 'auth_signout'
  | 'network'
  | 'validation'
  | 'unknown';

interface ErrorDetails {
  title: string;
  description: string;
  action?: string;
}

const errorMessages: Record<ErrorContext, (error?: Error) => ErrorDetails> = {
  vault_load: (error) => ({
    title: 'Failed to load Career Vault',
    description: error?.message?.includes('auth')
      ? 'Please sign in again to access your vault'
      : 'Unable to load your career data. Check your connection.',
    action: error?.message?.includes('auth') ? 'Sign in' : 'Retry',
  }),
  
  vault_save: (error) => ({
    title: 'Failed to save to Career Vault',
    description: error?.message?.includes('duplicate')
      ? 'This item already exists in your vault'
      : 'Your changes could not be saved. Please try again.',
    action: 'Retry',
  }),
  
  vault_delete: () => ({
    title: 'Failed to delete item',
    description: 'The item could not be removed from your vault.',
    action: 'Retry',
  }),
  
  vault_regenerate: (error) => ({
    title: 'Failed to regenerate content',
    description: error?.message?.includes('rate limit')
      ? 'Too many requests. Please wait 30 seconds.'
      : 'AI regeneration failed. Your original content is preserved.',
    action: error?.message?.includes('rate limit') ? 'Wait' : 'Retry',
  }),
  
  quiz_load: () => ({
    title: 'Failed to load quiz questions',
    description: 'Unable to fetch questions. Check your connection.',
    action: 'Retry',
  }),
  
  quiz_save: () => ({
    title: 'Failed to save quiz progress',
    description: 'Your answers could not be saved. They are stored locally.',
    action: 'Retry later',
  }),
  
  milestone_load: () => ({
    title: 'Failed to load career milestones',
    description: 'Unable to retrieve your work history.',
    action: 'Retry',
  }),
  
  milestone_save: () => ({
    title: 'Failed to save milestone',
    description: 'Your milestone changes could not be saved.',
    action: 'Retry',
  }),
  
  milestone_delete: () => ({
    title: 'Failed to delete milestone',
    description: 'The milestone could not be removed.',
    action: 'Retry',
  }),
  
  skill_confirm: () => ({
    title: 'Failed to confirm skill',
    description: 'Unable to save your skill confirmation.',
    action: 'Retry',
  }),
  
  skill_add: () => ({
    title: 'Failed to add custom skill',
    description: 'Your custom skill could not be added.',
    action: 'Retry',
  }),
  
  career_goals_save: () => ({
    title: 'Failed to save career goals',
    description: 'Your target roles and industries could not be saved.',
    action: 'Retry',
  }),
  
  role_suggestions: () => ({
    title: 'Failed to load role suggestions',
    description: 'Unable to fetch AI-powered role recommendations.',
    action: 'Continue without suggestions',
  }),
  
  ai_generation: (error) => ({
    title: 'AI generation failed',
    description: error?.message?.includes('rate limit')
      ? 'Too many AI requests. Please wait 30 seconds.'
      : error?.message?.includes('credits')
      ? 'Insufficient credits. Please upgrade your plan.'
      : 'AI service temporarily unavailable.',
    action: error?.message?.includes('credits') ? 'Upgrade' : 'Retry',
  }),
  
  resume_generate: () => ({
    title: 'Resume generation failed',
    description: 'Unable to generate resume content. Job analysis may be incomplete.',
    action: 'Check job description',
  }),
  
  resume_save: () => ({
    title: 'Failed to save resume',
    description: 'Your resume changes could not be saved.',
    action: 'Export as backup',
  }),
  
  resume_export: () => ({
    title: 'Export failed',
    description: 'Unable to export your resume. Try a different format.',
    action: 'Try again',
  }),
  
  job_import: () => ({
    title: 'Job import failed',
    description: 'Unable to process the job file. Check the format.',
    action: 'Check file format',
  }),
  
  job_analysis: () => ({
    title: 'Job analysis incomplete',
    description: 'Unable to analyze the job description. Add more details.',
    action: 'Edit job description',
  }),
  
  auth_signin: (error) => ({
    title: 'Sign in failed',
    description: error?.message?.includes('Invalid')
      ? 'Invalid email or password'
      : 'Unable to sign in. Check your credentials.',
    action: 'Try again',
  }),
  
  auth_signup: (error) => ({
    title: 'Sign up failed',
    description: error?.message?.includes('already')
      ? 'An account with this email already exists'
      : 'Unable to create account. Try again.',
    action: error?.message?.includes('already') ? 'Sign in instead' : 'Try again',
  }),
  
  auth_signout: () => ({
    title: 'Sign out failed',
    description: 'Unable to sign out. You may need to clear your browser cache.',
    action: 'Clear cache',
  }),
  
  network: () => ({
    title: 'Connection error',
    description: 'Unable to reach the server. Check your internet connection.',
    action: 'Check connection',
  }),
  
  validation: (error) => ({
    title: 'Validation error',
    description: error?.message || 'Please check your input and try again.',
    action: 'Review input',
  }),
  
  unknown: (error) => ({
    title: 'Something went wrong',
    description: error?.message || 'An unexpected error occurred.',
    action: 'Try again',
  }),
};

/**
 * Show context-aware error toast
 */
export const showContextualError = (
  context: ErrorContext,
  error?: Error | unknown
): void => {
  const err = error instanceof Error ? error : undefined;
  const details = errorMessages[context](err);
  
  toast.error(details.title, {
    description: details.description,
    action: details.action
      ? {
          label: details.action,
          onClick: () => {}, // Can be extended with actual actions
        }
      : undefined,
  });
  
  // Log for debugging
  console.error(`[${context}]`, {
    error: err,
    details,
  });
};

/**
 * Show context-aware success toast
 */
export const showContextualSuccess = (
  context: ErrorContext,
  customMessage?: string
): void => {
  const successMessages: Partial<Record<ErrorContext, string>> = {
    vault_save: 'Added to Career Vault',
    vault_delete: 'Removed from Career Vault',
    vault_regenerate: 'Content regenerated successfully',
    milestone_save: 'Milestone saved',
    milestone_delete: 'Milestone deleted',
    skill_confirm: 'Skill confirmed',
    skill_add: 'Custom skill added',
    career_goals_save: 'Career goals saved',
    resume_save: 'Resume saved',
    resume_export: 'Resume exported successfully',
    job_import: 'Job imported successfully',
    auth_signin: 'Signed in successfully',
    auth_signup: 'Account created successfully',
  };
  
  toast.success(customMessage || successMessages[context] || 'Success');
};

/**
 * Wrap async operations with contextual error handling
 */
export const withContextualError = async <T>(
  context: ErrorContext,
  operation: () => Promise<T>,
  onSuccess?: (result: T) => void
): Promise<T | null> => {
  try {
    const result = await operation();
    if (onSuccess) {
      onSuccess(result);
    }
    return result;
  } catch (error) {
    showContextualError(context, error);
    return null;
  }
};
