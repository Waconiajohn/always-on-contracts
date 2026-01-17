/**
 * Centralized CORS handling for Edge Functions
 * 
 * Uses ALLOWED_ORIGIN env var for production, or defaults to localhost for dev
 */

const ALLOWED_ORIGINS = [
  'https://careeriq.lovable.app',
  'https://id-preview--063e2d87-a1fd-4f0f-a2a2-78aeab05c9f0.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

/**
 * Get the allowed origin for CORS headers
 * Validates the request origin against the allowlist
 */
export function getAllowedOrigin(requestOrigin?: string | null): string {
  // Check environment variable first
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin) {
    // If request origin matches env origin, return it
    if (requestOrigin === envOrigin) {
      return envOrigin;
    }
    // Otherwise still use env origin (more restrictive)
    return envOrigin;
  }

  // Check against allowlist
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Default to first allowed origin for development
  return ALLOWED_ORIGINS[0];
}

/**
 * Generate CORS headers for a request
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function handleCorsPreFlight(requestOrigin?: string | null): Response {
  return new Response(null, { 
    headers: getCorsHeaders(requestOrigin),
    status: 204,
  });
}

/**
 * Get the redirect base URL for Stripe returns
 * Only allows known domains to prevent open redirect vulnerabilities
 */
export function getRedirectBase(): string {
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin) {
    return envOrigin;
  }
  // Default to production URL
  return 'https://careeriq.lovable.app';
}
