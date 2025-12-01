/**
 * Resume Builder Rules Configuration
 * 
 * Central configuration for step thresholds, validation rules,
 * and override behavior. This keeps all business logic in one place.
 */

// ============================================================================
// STEP COMPLETION THRESHOLDS
// ============================================================================

export const BUILDER_RULES = {
  /**
   * Key Highlights Section (Step 2)
   */
  highlights: {
    minBullets: 3,
    maxBullets: 6,
    recommendedBullets: 4,
    allowOverride: true,
    overrideWarning: "3+ highlights recommended for best results. Your résumé may appear thin without them.",
    hardBlockThreshold: 0, // 0 = no hard block, just warnings
  },

  /**
   * Experience Section - Per Role (Step 3)
   */
  experiencePerRole: {
    minBullets: 2,
    maxBullets: 8,
    recommendedBullets: { min: 4, max: 6 },
    showInitially: 4, // Show top 4 bullets, collapse rest
    allowOverride: true,
    overrideWarning: "This role has fewer bullets than recommended. Consider adding more impact statements.",
    fewSuggestionsThreshold: 2, // Show "limited suggestions" UI below this
  },

  /**
   * Experience Section - Overall (Step 3)
   */
  experienceOverall: {
    minRolesWithBullets: 1,
    recommendedRolesWithBullets: 2,
    minTotalBullets: 4,
    recommendedTotalBullets: 12,
    allowOverride: true,
    hardBlockThreshold: 0,
  },

  /**
   * Skills Section (Step 4)
   */
  skills: {
    minSuggested: 0, // Can skip entirely if all skills are covered
    recommendedAdditions: 3,
    maxSkills: 20,
    allowOverride: true,
    overrideWarning: "Adding recommended skills improves ATS match rate.",
  },

  /**
   * Review Section (Step 5)
   */
  review: {
    minScoreForExport: 0, // No minimum - let user export anyway
    showScoreWarningBelow: 60,
    scoreWarningMessage: "Your score is below 60. Consider addressing more gaps before exporting.",
  },
};

// ============================================================================
// WARNING MESSAGES (Soft blocks - allow override)
// ============================================================================

export const WARNING_MESSAGES = {
  criticalGapsUnresolved: {
    title: "Critical Gaps Remaining",
    message: "You still have unresolved critical gaps that may cause automatic rejection. Continue anyway?",
    severity: "high" as const,
    actionLabel: "Continue Anyway",
  },
  importantGapsUnresolved: {
    title: "Important Gaps Remaining",
    message: "Some important gaps are unresolved. Your chances would improve by addressing them.",
    severity: "medium" as const,
    actionLabel: "Continue Anyway",
  },
  tooFewBullets: {
    title: "Limited Content",
    message: "This section has fewer bullets than recommended. Your résumé may appear thin.",
    severity: "medium" as const,
    actionLabel: "Continue Anyway",
  },
  lowScore: {
    title: "Low Alignment Score",
    message: "Your current score suggests this résumé may not reach the interview stage.",
    severity: "high" as const,
    actionLabel: "Export Anyway",
  },
  noOriginalData: {
    title: "All AI-Generated",
    message: "This section contains only AI suggestions. Verify each bullet matches your actual experience.",
    severity: "medium" as const,
    actionLabel: "I Understand",
  },
};

// ============================================================================
// HARD BLOCK MESSAGES (Cannot proceed)
// ============================================================================

export const HARD_BLOCK_MESSAGES = {
  noHighlights: {
    title: "Cannot Continue",
    message: "You need at least 1 bullet in Highlights to proceed. Review the suggestions and select what fits your experience.",
    actionLabel: "Review Highlights",
  },
  noExperience: {
    title: "Cannot Continue",
    message: "You need at least 1 bullet in your Experience section. Select or add content for at least one role.",
    actionLabel: "Review Experience",
  },
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export interface ValidationResult {
  canProceed: boolean;
  type: 'pass' | 'warning' | 'block';
  message?: typeof WARNING_MESSAGES[keyof typeof WARNING_MESSAGES] | typeof HARD_BLOCK_MESSAGES[keyof typeof HARD_BLOCK_MESSAGES];
}

/**
 * Validate highlights section completion
 */
export function validateHighlights(acceptedCount: number): ValidationResult {
  if (acceptedCount === 0 && BUILDER_RULES.highlights.hardBlockThreshold > 0) {
    return { canProceed: false, type: 'block', message: HARD_BLOCK_MESSAGES.noHighlights };
  }
  if (acceptedCount < BUILDER_RULES.highlights.minBullets) {
    return { 
      canProceed: BUILDER_RULES.highlights.allowOverride, 
      type: 'warning', 
      message: WARNING_MESSAGES.tooFewBullets 
    };
  }
  return { canProceed: true, type: 'pass' };
}

/**
 * Validate experience section completion
 */
export function validateExperience(
  totalAccepted: number, 
  _rolesWithBullets: number,
  unresolvedCriticalGaps: number
): ValidationResult {
  // Hard block if nothing at all
  if (totalAccepted === 0) {
    return { canProceed: false, type: 'block', message: HARD_BLOCK_MESSAGES.noExperience };
  }
  
  // Warn about critical gaps
  if (unresolvedCriticalGaps > 0) {
    return { 
      canProceed: BUILDER_RULES.experienceOverall.allowOverride, 
      type: 'warning', 
      message: WARNING_MESSAGES.criticalGapsUnresolved 
    };
  }
  
  // Warn about thin content
  if (totalAccepted < BUILDER_RULES.experienceOverall.minTotalBullets) {
    return { 
      canProceed: BUILDER_RULES.experienceOverall.allowOverride, 
      type: 'warning', 
      message: WARNING_MESSAGES.tooFewBullets 
    };
  }
  
  return { canProceed: true, type: 'pass' };
}

/**
 * Validate skills section (always allows proceed)
 */
export function validateSkills(_addedCount: number): ValidationResult {
  // Skills is optional - always allow proceed
  return { canProceed: true, type: 'pass' };
}

/**
 * Validate before export
 */
export function validateForExport(score: number, criticalGapsRemaining: number): ValidationResult {
  if (criticalGapsRemaining > 0) {
    return { 
      canProceed: true, // Allow but warn
      type: 'warning', 
      message: WARNING_MESSAGES.criticalGapsUnresolved 
    };
  }
  if (score < BUILDER_RULES.review.showScoreWarningBelow) {
    return { 
      canProceed: true, 
      type: 'warning', 
      message: WARNING_MESSAGES.lowScore 
    };
  }
  return { canProceed: true, type: 'pass' };
}

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

export const STEP_CONFIG = {
  1: { name: 'Overview', path: 'overview', icon: 'Target' },
  2: { name: 'Highlights', path: 'highlights', icon: 'Star' },
  3: { name: 'Experience', path: 'experience', icon: 'Briefcase' },
  4: { name: 'Skills', path: 'skills', icon: 'Wrench' },
  5: { name: 'Review', path: 'review', icon: 'FileCheck' },
} as const;

export type StepNumber = keyof typeof STEP_CONFIG;
