/**
 * Response Helpers for Edge Functions
 * Standardized response formatting for consistency
 */

import { formatErrorResponse, AIError } from './error-handling.ts';

/**
 * CORS Configuration
 *
 * For production, set ALLOWED_ORIGIN environment variable to your domain:
 *   e.g., "https://yourdomain.com"
 *
 * For development, leave unset to allow all origins.
 */
const getAllowedOrigin = (): string => {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  return allowedOrigin || '*';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Create a success response
 */
export function successResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Create an error response
 */
export function errorResponse(error: Error | AIError | any, status?: number): Response {
  if (error instanceof AIError) {
    const formatted = formatErrorResponse(error);
    return new Response(
      JSON.stringify(formatted),
      {
        status: error.statusCode || status || 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        retryable: true
      }
    }),
    {
      status: status || 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Create CORS preflight response
 */
export function corsPreflightResponse(): Response {
  return new Response(null, {
    headers: corsHeaders
  });
}

export { corsHeaders };
