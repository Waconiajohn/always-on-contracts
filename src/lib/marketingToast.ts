// =====================================================
// MARKETING TOAST UTILITY - Career Vault 2.0
// =====================================================
// Helper function to display marketing messages from
// edge function responses in a consistent way.
// =====================================================

interface ToastFunction {
  (options: {
    title: string;
    description: string;
    duration?: number;
    variant?: 'default' | 'destructive';
  }): void;
}

interface EdgeFunctionResponse {
  success: boolean;
  data: any;
  error?: string;
  meta?: {
    message?: string;
    uniqueValue?: string;
    searchTip?: string;
    [key: string]: any;
  };
}

/**
 * Shows a success toast with optional marketing message
 * @param toast - The toast function from useToast hook
 * @param response - The edge function response
 * @param options - Optional configuration
 */
export function showMarketingToast(
  toast: ToastFunction,
  response: EdgeFunctionResponse,
  options?: {
    successTitle?: string;
    successDescription?: string;
    marketingTitle?: string;
    marketingDelay?: number;
    marketingDuration?: number;
  }
) {
  const {
    successTitle = '✅ Success',
    successDescription,
    marketingTitle = '✨ What Makes Us Different',
    marketingDelay = 2000,
    marketingDuration = 5000,
  } = options || {};

  // Show success toast
  toast({
    title: successTitle,
    description: successDescription || response.meta?.message || 'Operation completed successfully',
  });

  // Show marketing message if available
  if (response.meta?.uniqueValue) {
    setTimeout(() => {
      toast({
        title: marketingTitle,
        description: response.meta!.uniqueValue!,
        duration: marketingDuration,
      });
    }, marketingDelay);
  }

  // Show search tip if available (for search operations)
  if (response.meta?.searchTip) {
    setTimeout(() => {
      toast({
        title: '💡 Pro Tip',
        description: response.meta!.searchTip!,
        duration: marketingDuration,
      });
    }, marketingDelay + 3000);
  }
}
