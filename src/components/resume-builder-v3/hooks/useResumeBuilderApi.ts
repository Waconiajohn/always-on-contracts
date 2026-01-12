// =====================================================
// API CALL HOOK WITH RETRY LOGIC
// =====================================================

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRetryWithBackoff } from "./useRetryWithBackoff";

type Step = "fit_analysis" | "standards" | "questions" | "generate_resume";

interface ApiCallOptions {
  step: Step;
  body: Record<string, unknown>;
  onSuccess?: (data: unknown) => void;
  successMessage?: string;
}

export function useResumeBuilderApi() {
  const { executeWithRetry, isRetrying, currentAttempt, cancel } = useRetryWithBackoff({
    maxAttempts: 3,
    initialDelayMs: 1500,
    maxDelayMs: 8000,
    onRetry: (attempt, error) => {
      console.log(`Resume Builder API retry attempt ${attempt}:`, error.message);
    },
  });

  const callApi = useCallback(
    async <T>(options: ApiCallOptions): Promise<T | null> => {
      const { step, body, onSuccess, successMessage } = options;

      try {
        const result = await executeWithRetry<T>(async (signal) => {
          const { data, error } = await supabase.functions.invoke("resume-builder-v3", {
            body: { step, ...body },
          });

          // Check if aborted
          if (signal.aborted) {
            throw new Error("Operation cancelled");
          }

          if (error) {
            // Check for specific error types that should not retry
            if (error.message?.includes("rate limit")) {
              throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
            }
            throw error;
          }

          if (!data.success) {
            throw new Error(data.error || `${step} failed`);
          }

          return data.data as T;
        });

        if (successMessage) {
          toast.success(successMessage);
        }

        if (onSuccess && result) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        
        // Show appropriate error message
        if (message.includes("cancelled")) {
          toast.info("Operation cancelled");
        } else {
          toast.error(message, {
            description: "Please try again or contact support if the issue persists.",
            action: {
              label: "Retry",
              onClick: () => callApi(options),
            },
          });
        }

        return null;
      }
    },
    [executeWithRetry]
  );

  return {
    callApi,
    cancel,
    isRetrying,
    currentAttempt,
  };
}
