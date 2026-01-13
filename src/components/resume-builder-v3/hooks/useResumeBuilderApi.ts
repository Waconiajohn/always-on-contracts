// =====================================================
// API CALL HOOK WITH RETRY LOGIC
// =====================================================

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRetryWithBackoff } from "./useRetryWithBackoff";
import { logger } from "@/lib/logger";
import { validateApiResponse } from "../utils/validators";
import { RETRY_CONFIG } from "../constants";

type Step = "fit_analysis" | "standards" | "questions" | "generate_resume";

interface ApiCallOptions {
  step: Step;
  body: Record<string, unknown>;
  onSuccess?: (data: unknown) => void;
  successMessage?: string;
}

export function useResumeBuilderApi() {
  const { executeWithRetry, isRetrying, currentAttempt, cancel } = useRetryWithBackoff({
    maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelayMs: RETRY_CONFIG.INITIAL_DELAY_MS,
    maxDelayMs: RETRY_CONFIG.MAX_DELAY_MS,
    onRetry: (attempt, error) => {
      logger.debug(`Resume Builder API retry attempt ${attempt}:`, { error: error.message });
    },
  });

  const callApi = useCallback(
    async <T>(options: ApiCallOptions): Promise<T | null> => {
      const { step, body, onSuccess, successMessage } = options;

      try {
        const result = await executeWithRetry<T>(async (signal) => {
          // Create a promise that rejects on abort
          const abortPromise = new Promise<never>((_, reject) => {
            signal.addEventListener('abort', () => {
              reject(new Error("Operation cancelled"));
            });
          });

          // Race between the API call and abort signal
          const apiPromise = supabase.functions.invoke("resume-builder-v3", {
            body: { step, ...body },
          });

          const { data, error } = await Promise.race([apiPromise, abortPromise.then(() => ({ data: null, error: new Error("Operation cancelled") }))]);

          // Check if aborted after call completes
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

          // Validate response against expected schema
          const validatedData = validateApiResponse<T>(step, data.data);
          return validatedData;
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
    maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
  };
}
