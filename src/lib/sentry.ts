/**
 * Sentry Error Tracking Configuration
 *
 * Initialize Sentry for production error monitoring.
 * Uses environment variable for DSN to keep it secure.
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  // Only initialize in production or if DSN is explicitly set
  if (!SENTRY_DSN) {
    console.log('[Sentry] No DSN configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment detection
    environment: import.meta.env.MODE,

    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Session replay for debugging (optional, can be expensive)
    replaysSessionSampleRate: 0.01, // 1% of sessions
    replaysOnErrorSampleRate: 0.1, // 10% of error sessions

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Network errors that users can't control
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // Resize observer (common false positive)
      'ResizeObserver loop',
      // User-initiated aborts
      'AbortError',
    ],

    // Don't send PII
    beforeSend(event) {
      // Strip potential PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          // Redact URLs that might contain tokens
          if (breadcrumb.data?.url) {
            breadcrumb.data.url = breadcrumb.data.url.replace(/token=[^&]+/, 'token=[REDACTED]');
          }
          return breadcrumb;
        });
      }
      return event;
    },

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });

  console.log('[Sentry] Initialized successfully');
}

/**
 * Capture an error with additional context
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) {
    console.error('[Sentry] Error (not sent - no DSN):', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string) {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
    email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined, // Partially mask email
  });
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// Re-export Sentry's ErrorBoundary for use in components
export const SentryErrorBoundary = Sentry.ErrorBoundary;
