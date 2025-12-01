/**
 * UI Copy Standards
 * 
 * Standardized micro-copy for buttons, labels, disclaimers.
 * Ensures consistent, professional language throughout the builder.
 * 
 * Goals:
 * - Clear, action-oriented button labels
 * - Non-scary disclaimers that build trust
 * - Consistent terminology
 */

// ============================================================================
// BUTTON LABELS
// ============================================================================

export const BUTTON_LABELS = {
  // Bullet actions
  useAi: "Use AI Version",
  keepOriginal: "Keep My Original",
  addBullet: "Add This Bullet",
  skipBullet: "Skip",
  editFirst: "Edit Before Adding",
  removeBullet: "Remove",
  undoSkip: "Undo",

  // Batch actions
  approveHighConfidence: "Approve All High-Confidence",
  approveAll: "Approve All",
  skipAll: "Skip All",
  resetSection: "Reset Section",

  // Navigation
  back: "Back",
  next: "Continue",
  continueAnyway: "Continue Anyway",
  startBuilding: "Start Building",
  finishReview: "Finish & Export",

  // Export
  downloadDocx: "Download as Word",
  downloadPdf: "Download as PDF",
  copyToClipboard: "Copy to Clipboard",
  rescore: "Re-Score Résumé",

  // Skills
  addSkill: "Add",
  skipSkill: "Skip",
  removeSkill: "Remove",

  // Misc
  viewDetails: "View Details",
  showMore: "Show More",
  showLess: "Show Less",
  edit: "Edit",
  save: "Save",
  cancel: "Cancel",
};

// ============================================================================
// DISCLAIMERS
// ============================================================================

export const DISCLAIMERS = {
  /**
   * Section-level disclaimer (shown once per section)
   */
  sectionLevel: "AI-generated drafts based on your career data. Edit to match your actual experience.",
  
  /**
   * Per-bullet disclaimer (for edited bullets)
   */
  editedBullet: "Changes you make will appear in your final résumé.",
  
  /**
   * Export disclaimer
   */
  export: "This is your final résumé. No AI markers or drafts are included.",
  
  /**
   * Interview prep context
   */
  interviewQuestions: "If you use this bullet, be prepared to discuss it in detail.",

  /**
   * High confidence disclaimer
   */
  highConfidence: "Based on your actual career data from Career Vault.",

  /**
   * Medium confidence disclaimer
   */
  mediumConfidence: "Review before accepting—some details may need adjustment.",

  /**
   * Low confidence disclaimer
   */
  lowConfidence: "This suggestion may need significant editing to match your experience.",

  /**
   * No original data disclaimer
   */
  noOriginalData: "These suggestions are based on your job title and industry, not your original résumé content.",
};

// ============================================================================
// CONFIDENCE LABELS
// ============================================================================

export const CONFIDENCE_LABELS = {
  high: {
    label: "High Confidence",
    shortLabel: "High",
    description: "Based on your vault data",
    color: "green",
  },
  medium: {
    label: "Verify This",
    shortLabel: "Verify",
    description: "Review before accepting",
    color: "amber",
  },
  low: {
    label: "Needs Review",
    shortLabel: "Review",
    description: "May require editing",
    color: "red",
  },
};

// ============================================================================
// STATUS LABELS
// ============================================================================

export const STATUS_LABELS = {
  pending: "Pending Review",
  accepted: "Accepted",
  edited: "Edited & Accepted",
  rejected: "Skipped",
};

// ============================================================================
// SECTION LABELS
// ============================================================================

export const SECTION_LABELS = {
  overview: {
    title: "Overview & Plan",
    description: "See your current alignment score and identified gaps",
  },
  highlights: {
    title: "Key Highlights",
    description: "4-6 impact statements at the top of your résumé",
  },
  experience: {
    title: "Professional Experience",
    description: "Review and enhance bullets for each role",
  },
  skills: {
    title: "Skills & Keywords",
    description: "Ensure ATS-critical keywords are covered",
  },
  review: {
    title: "Review & Export",
    description: "Preview your résumé and download",
  },
};

// ============================================================================
// PROGRESS LABELS
// ============================================================================

export const PROGRESS_LABELS = {
  step: (current: number, total: number) => `Step ${current} of ${total}`,
  bulletsAccepted: (count: number) => `${count} accepted`,
  bulletsPending: (count: number) => `${count} pending`,
  bulletsTarget: (current: number, min: number, max: number) => `${current}/${min}-${max}`,
  rolesRemaining: (count: number) => `${count} role${count === 1 ? '' : 's'} remaining`,
  gapsResolved: (resolved: number, total: number) => `${resolved}/${total} gaps resolved`,
  scoreImprovement: (before: number, after: number) => `${before} → ${after} (+${after - before})`,
};

// ============================================================================
// TOOLTIP TEXT
// ============================================================================

export const TOOLTIPS = {
  confidence: {
    high: "This suggestion is based on verified data from your Career Vault.",
    medium: "This suggestion may need some adjustment to match your exact experience.",
    low: "This is an inferred suggestion—please verify the details carefully.",
  },
  supports: "This bullet addresses these job requirements.",
  interviewQuestions: "If you include this bullet, be ready to discuss these topics.",
  atsKeywords: "Including these terms improves your chances of passing ATS screening.",
  score: "This score indicates how well your résumé matches this specific job.",
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  rescoreFailed: "We couldn't re-score your résumé right now. Your work is saved—please try again in a few minutes.",
  exportFailed: "Export failed. Please try again or copy your content manually.",
  saveFailed: "Changes couldn't be saved. Please check your connection and try again.",
  loadFailed: "Couldn't load your résumé data. Please refresh and try again.",
};

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  bulletAdded: "Bullet added to your résumé",
  bulletRemoved: "Bullet removed",
  sectionComplete: "Section complete!",
  exportComplete: "Your résumé has been downloaded",
  copied: "Copied to clipboard",
  saved: "Progress saved",
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Get all copy for a section to pass to components
 */
export function getSectionCopy(section: keyof typeof SECTION_LABELS) {
  return {
    ...SECTION_LABELS[section],
    disclaimer: DISCLAIMERS.sectionLevel,
    buttons: BUTTON_LABELS,
    progress: PROGRESS_LABELS,
  };
}
