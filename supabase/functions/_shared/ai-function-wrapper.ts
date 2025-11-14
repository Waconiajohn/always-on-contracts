/**
 * Production-Ready AI Function Wrapper
 *
 * Provides standardized error handling, retry logic, JSON parsing,
 * validation, logging, and cost tracking for all AI edge functions.
 *
 * Usage:
 * ```typescript
 * import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
 *
 * serve(createAIHandler({
 *   functionName: 'analyze-linkedin-writing',
 *   schema: LinkedInAnalysisSchema,
 *   handler: async ({ user, body, supabase }) => {
 *     // Your AI logic here
 *     const response = await callPerplexity(...);
 *     return response;
 *   }
 * }));
 * ```
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ZodSchema } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { extractJSON, extractToolCallJSON, ParseResult } from './json-parser.ts';
import { createLogger } from './logger.ts';
import { AIError, retryWithBackoff } from './error-handling.ts';
import { checkRateLimit } from './rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface AIHandlerContext {
  user: any;
  body: any;
  supabase: any;
  logger: ReturnType<typeof createLogger>;
}

export interface AIHandlerConfig<T> {
  functionName: string;
  schema?: ZodSchema<T>;
  requireAuth?: boolean;
  rateLimit?: {
    maxPerMinute?: number;
    maxPerHour?: number;
  };
  inputValidation?: (body: any) => void | Promise<void>;
  handler: (context: AIHandlerContext) => Promise<any>;
  parseResponse?: boolean; // Auto-parse JSON from AI response
  useToolCalls?: boolean; // Expect tool call format
}

/**
 * Create a production-ready AI function handler
 */
export function createAIHandler<T = any>(config: AIHandlerConfig<T>) {
  const {
    functionName,
    schema,
    requireAuth = true,
    rateLimit = { maxPerMinute: 10, maxPerHour: 100 },
    inputValidation,
    handler,
    parseResponse = true,
    useToolCalls = false
  } = config;

  const logger = createLogger(functionName);

  return async (req: Request): Promise<Response> => {
    const startTime = Date.now();

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ====================================================================
      // 1. AUTHENTICATION
      // ====================================================================
      let user = null;
      let supabase = null;

      if (requireAuth) {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          throw new AIError(
            'Missing authorization header',
            'AUTHENTICATION_ERROR',
            401,
            false,
            'Please log in to use this feature'
          );
        }

        supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !authUser) {
          throw new AIError(
            'Invalid or expired session',
            'AUTHENTICATION_ERROR',
            401,
            false,
            'Please log in again'
          );
        }
        user = authUser;
      } else {
        // Service role for non-authenticated endpoints
        supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
      }

      // ====================================================================
      // 2. RATE LIMITING
      // ====================================================================
      if (user && rateLimit) {
        const rateLimitResult = await checkRateLimit(
          user.id,
          functionName,
          rateLimit.maxPerMinute || 10
        );

        if (!rateLimitResult.allowed) {
          logger.warn('Rate limit exceeded', {
            userId: user.id,
            retryAfter: rateLimitResult.retryAfter
          });

          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded',
              retryAfter: rateLimitResult.retryAfter,
              userMessage: `Please wait ${rateLimitResult.retryAfter} seconds before trying again`
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Retry-After': String(rateLimitResult.retryAfter || 60)
              }
            }
          );
        }
      }

      // ====================================================================
      // 3. INPUT VALIDATION
      // ====================================================================
      const body = await req.json().catch(() => ({}));

      // Custom validation
      if (inputValidation) {
        await inputValidation(body);
      }

      // Basic input sanitization
      if (body.content && typeof body.content === 'string') {
        const MAX_CONTENT_LENGTH = 100000; // ~25k tokens
        if (body.content.length > MAX_CONTENT_LENGTH) {
          throw new AIError(
            `Content too long (max ${MAX_CONTENT_LENGTH} characters)`,
            'VALIDATION_ERROR',
            400,
            false,
            'Please provide shorter content'
          );
        }
      }

      // ====================================================================
      // 4. EXECUTE HANDLER WITH RETRY LOGIC
      // ====================================================================
      const context: AIHandlerContext = {
        user,
        body,
        supabase,
        logger
      };

      const result = await retryWithBackoff(
        async () => await handler(context),
        3, // max retries
        (attempt, error) => {
          logger.warn(`Retry attempt ${attempt}`, {
            error: error.message,
            userId: user?.id
          });
        }
      );

      // ====================================================================
      // 5. PARSE AND VALIDATE RESPONSE
      // ====================================================================
      let finalResult = result;

      if (parseResponse && result) {
        // Check if result is a Perplexity API response
        if (result.choices?.[0]?.message) {
          const content = result.choices[0].message.content;

          let parsed: ParseResult<T>;

          if (useToolCalls) {
            parsed = extractToolCallJSON<T>(result, functionName, schema);
          } else {
            parsed = extractJSON<T>(content, schema);
          }

          if (!parsed.success) {
            logger.error('JSON parsing failed', {
              error: parsed.error,
              content: content?.substring(0, 500)
            });

            throw new AIError(
              'AI returned invalid response format',
              'INVALID_RESPONSE',
              500,
              true,
              'The AI service returned an unexpected format. Please try again.'
            );
          }

          finalResult = parsed.data;
        }
      }

      // ====================================================================
      // 6. LOG SUCCESS METRICS
      // ====================================================================
      const latencyMs = Date.now() - startTime;

      logger.info('Request successful', {
        userId: user?.id,
        latencyMs,
        success: true
      });

      // If result includes AI usage metrics, log them
      if (result?.metrics) {
        logger.logAICall({
          model: result.metrics.model,
          inputTokens: result.metrics.input_tokens,
          outputTokens: result.metrics.output_tokens,
          latencyMs,
          cost: result.metrics.cost_usd,
          success: true
        });
      }

      // ====================================================================
      // 7. RETURN SUCCESS RESPONSE
      // ====================================================================
      return new Response(
        JSON.stringify(finalResult),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error: any) {
      // ====================================================================
      // 8. ERROR HANDLING
      // ====================================================================
      const latencyMs = Date.now() - startTime;

      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let userMessage = 'An unexpected error occurred. Please try again.';

      if (error instanceof AIError) {
        statusCode = error.statusCode || 500;
        errorCode = error.code;
        userMessage = error.userMessage || error.message;
      } else if (error.message?.includes('timeout')) {
        statusCode = 504;
        errorCode = 'TIMEOUT';
        userMessage = 'Request timed out. Please try again.';
      } else if (error.message?.includes('rate limit')) {
        statusCode = 429;
        errorCode = 'RATE_LIMIT';
        userMessage = 'Too many requests. Please slow down.';
      }

      logger.error('Request failed', {
        error: error.message,
        errorCode,
        statusCode,
        latencyMs,
        stack: error.stack
      });

      return new Response(
        JSON.stringify({
          error: errorCode,
          message: userMessage,
          details: Deno.env.get('ENVIRONMENT') === 'development' ? error.message : undefined
        }),
        {
          status: statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Simplified wrapper for functions that don't need full validation
 */
export function createSimpleAIHandler(
  functionName: string,
  handler: (context: AIHandlerContext) => Promise<any>
) {
  return createAIHandler({
    functionName,
    handler,
    parseResponse: false
  });
}
