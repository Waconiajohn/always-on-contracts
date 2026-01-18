// =====================================================
// RESUME BUILDER V3 - SHARED CONSTANTS
// =====================================================

// Session recovery thresholds (in characters)
export const SESSION_RECOVERY_MIN_CHARS = 100;
export const SESSION_RECOVERY_MIN_JOB_CHARS = 50;

// Version history limits
export const MAX_VERSION_HISTORY = 10;
export const MAX_SKILLS_DISPLAY = 10;

// Display limits
export const MAX_KEYWORDS_DISPLAY = 8;

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

// Benchmark scoring weights
export const BENCHMARK_WEIGHTS = {
  EXCEEDS: 100,
  MEETS: 70,
  BELOW: 30,
} as const;

// Step labels for navigation (single source of truth)
// Consolidated 3-step flow: Upload -> Interview -> Edit & Optimize
export const STEP_LABELS: Record<number, string> = {
  1: "Upload & Analyze",
  2: "Interview",
  3: "Edit & Optimize",
};

// Total number of steps
export const TOTAL_STEPS = 3;
