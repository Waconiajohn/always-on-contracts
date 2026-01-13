// =====================================================
// RESUME BUILDER V3 - SHARED CONSTANTS
// =====================================================

// Session recovery thresholds (in characters)
export const SESSION_RECOVERY_MIN_CHARS = 100;
export const SESSION_RECOVERY_MIN_JOB_CHARS = 50;

// Version history limits
export const MAX_VERSION_HISTORY = 10;
export const MAX_SKILLS_DISPLAY = 10;

// Input limits
export const MAX_ANSWER_LENGTH = 2000;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1500,
  MAX_DELAY_MS: 8000,
} as const;

// Export timeout (30 seconds)
export const EXPORT_TIMEOUT_MS = 30000;

// Step labels for navigation (single source of truth)
export const STEP_LABELS: Record<number, string> = {
  1: "Upload & Analyze",
  2: "Industry Standards",
  3: "Interview",
  4: "Generate Resume",
};
