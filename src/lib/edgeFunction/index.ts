/**
 * Edge Function Utilities
 * 
 * Centralized utilities for calling Supabase edge functions with:
 * - Input validation using Zod schemas
 * - Consistent error handling
 * - Type safety
 * - Rate limit handling
 */

import { supabase } from "@/integrations/supabase/client";
import { z } from 'zod';
import type { EdgeFunctionError } from './errorHandler';
import { handleEdgeFunctionError } from './errorHandler';

export * from './schemas';
export { z } from 'zod';

// Simple logger utility
export const logger = {
  error: (message: string, error?: any) => {
    console.error(`[${message}]`, error);
  },
  info: (message: string, data?: any) => {
    console.log(`[${message}]`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[${message}]`, data);
  }
};

// Simplified validation result
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Safe input validation with Zod schemas
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): ValidationResult<T> {
  const result = schema.safeParse(input);
  
  if (!result.success) {
    const errorMessage = result.error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    return { success: false, error: errorMessage };
  }
  
  return { success: true, data: result.data };
}

/**
 * Invoke edge function with automatic error handling and retry logic
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body?: Record<string, any>,
  maxRetries: number = 3
): Promise<{ data: T | null; error: EdgeFunctionError | null }> {
  let lastError: EdgeFunctionError | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) {
        const handledError = handleEdgeFunctionError(error, functionName);
        
        // Only retry on network errors
        if (handledError.code === 'NETWORK_ERROR' && attempt < maxRetries) {
          lastError = handledError;
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return { data: null, error: handledError };
      }

      // Handle application-level errors in the response
      if (data?.error) {
        return {
          data: null,
          error: {
            message: data.error,
            code: 'APPLICATION_ERROR',
            details: data
          }
        };
      }

      return { data, error: null };
    } catch (error) {
      const handledError = handleEdgeFunctionError(error, functionName);
      
      // Only retry on network errors
      if (handledError.code === 'NETWORK_ERROR' && attempt < maxRetries) {
        lastError = handledError;
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return { data: null, error: handledError };
    }
  }
  
  return { data: null, error: lastError };
}
