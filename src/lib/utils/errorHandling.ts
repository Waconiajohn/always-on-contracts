import { toast } from 'sonner';

/**
 * Centralized error handling for Career Vault operations
 * Ensures consistent error messages and logging
 */
export const handleVaultError = (error: any, context: string) => {
  console.error(`[Career Vault - ${context}]`, error);
  
  const errorMessage = error?.message || 'An unexpected error occurred';
  toast.error(`Failed to ${context.toLowerCase()}: ${errorMessage}`);
};

export const handleVaultSuccess = (message: string) => {
  toast.success(message);
};
