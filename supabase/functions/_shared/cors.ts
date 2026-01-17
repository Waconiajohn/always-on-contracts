/**
 * Centralized CORS handling for Edge Functions
 * 
 * Uses ALLOWED_ORIGIN env var for production, or defaults to localhost for dev
 */

/**
 * Allowed origin patterns for CORS
 * - Explicit localhost ports for local development
 * - Dynamic matching for Lovable preview/production domains
 */
const LOCALHOST_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

/**
 * Check if an origin is a valid Lovable domain
 * Supports: *.lovable.app, *.lovableproject.com
 */
function isValidLovableOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // Allow Lovable production and preview domains
    // e.g., careeriq.lovable.app, id-preview--xxx.lovable.app
    // e.g., xxx.lovableproject.com
    return (
      hostname.endsWith('.lovable.app') ||
      hostname.endsWith('.lovableproject.com') ||
      hostname === 'lovable.app' ||
      hostname === 'lovableproject.com'
    );
  } catch {
    return false;
  }
}

/**
 * Get the allowed origin for CORS headers
 * Validates the request origin against allowed patterns
 */
export function getAllowedOrigin(requestOrigin?: string | null): string {
  // Check environment variable first (production override)
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && requestOrigin === envOrigin) {
    return envOrigin;
  }

  if (!requestOrigin) {
    // No origin header - return production default
    return envOrigin || 'https://careeriq.lovable.app';
  }

  // Check localhost origins for local development
  if (LOCALHOST_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Check if it's a valid Lovable domain (preview or production)
  if (isValidLovableOrigin(requestOrigin)) {
    return requestOrigin;
  }

  // Fallback to production domain
  return envOrigin || 'https://careeriq.lovable.app';
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
