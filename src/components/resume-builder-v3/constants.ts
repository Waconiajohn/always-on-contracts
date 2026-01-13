// =====================================================
// RESUME BUILDER V3 - SHARED CONSTANTS
// =====================================================

// Session recovery threshold (in characters)
export const SESSION_RECOVERY_MIN_CHARS = 100;

// Version history limits
export const MAX_VERSION_HISTORY = 10;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1500,
  MAX_DELAY_MS: 8000,
} as const;
