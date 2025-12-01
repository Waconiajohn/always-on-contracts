/**
 * Empty State Definitions
 * 
 * Handles edge cases when there's limited data:
 * - No original bullets for a role
 * - Sparse Career Vault
 * - Few suggestions from AI
 * - All gaps already covered
 */

// ============================================================================
// EMPTY STATE TYPES
// ============================================================================

export interface EmptyStateConfig {
  title: string;
  message: string;
  icon?: 'info' | 'warning' | 'success' | 'neutral';
  action?: {
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  badge?: string;
}

// ============================================================================
// HIGHLIGHTS EMPTY STATES
// ============================================================================

export const HIGHLIGHTS_EMPTY_STATES = {
  noSuggestions: {
    title: "Not Enough Data for Suggestions",
    message: "We couldn't generate strong highlight suggestions. Add more details to your Career Vault, or write your own highlights.",
    icon: 'info' as const,
    action: {
      label: "Add to Career Vault",
      variant: 'primary' as const,
    },
    secondaryAction: {
      label: "Write My Own",
      variant: 'secondary' as const,
    },
  },
  fewSuggestions: {
    title: "Limited Suggestions Available",
    message: "We found fewer suggestions than recommended. Consider adding more career data, or continue with what's available.",
    icon: 'info' as const,
    action: {
      label: "Continue with Available",
      variant: 'primary' as const,
    },
  },
  allSkipped: {
    title: "All Suggestions Skipped",
    message: "You've skipped all suggestions. You can write your own highlights or go back and reconsider some options.",
    icon: 'warning' as const,
    action: {
      label: "Write My Own",
      variant: 'primary' as const,
    },
    secondaryAction: {
      label: "Review Skipped",
      variant: 'ghost' as const,
    },
  },
};

// ============================================================================
// EXPERIENCE EMPTY STATES
// ============================================================================

export const EXPERIENCE_EMPTY_STATES = {
  /**
   * Role has no original bullets from user's resume
   */
  noOriginalBullets: {
    title: "No Original Bullets Found",
    message: "All suggestions for this role are AI-generated based on your job title. Please verify each bullet matches your actual experience.",
    icon: 'warning' as const,
    badge: "All AI Draft",
    action: {
      label: "I Understand",
      variant: 'secondary' as const,
    },
  },

  /**
   * Role has very few suggestions (1-2)
   */
  fewSuggestions: {
    title: "Limited Suggestions for This Role",
    message: "We found only a few relevant suggestions. Consider keeping this section brief and focusing on your stronger roles.",
    icon: 'info' as const,
    action: {
      label: "Review Suggestions",
      variant: 'primary' as const,
    },
    secondaryAction: {
      label: "Skip This Role",
      variant: 'ghost' as const,
    },
  },

  /**
   * Role is not relevant to target job
   */
  lowRelevance: {
    title: "Low Relevance to Target Job",
    message: "This role doesn't closely match the target position. You may want to keep it minimal or focus on transferable skills.",
    icon: 'neutral' as const,
    action: {
      label: "View Anyway",
      variant: 'secondary' as const,
    },
    secondaryAction: {
      label: "Skip to Next Role",
      variant: 'ghost' as const,
    },
  },

  /**
   * No roles found at all
   */
  noRoles: {
    title: "No Work Experience Found",
    message: "We couldn't find any work history. Add your experience to your Career Vault to generate suggestions.",
    icon: 'warning' as const,
    action: {
      label: "Add Work Experience",
      variant: 'primary' as const,
    },
  },

  /**
   * All roles completed
   */
  allRolesComplete: {
    title: "All Roles Reviewed!",
    message: "You've reviewed all your work experience. Continue to Skills to fine-tune your résumé.",
    icon: 'success' as const,
    action: {
      label: "Continue to Skills",
      variant: 'primary' as const,
    },
  },
};

// ============================================================================
// SKILLS EMPTY STATES
// ============================================================================

export const SKILLS_EMPTY_STATES = {
  /**
   * All skills already covered
   */
  allCovered: {
    title: "All Key Skills Already Present",
    message: "Your current skills align well with this job's requirements. This step is optional—you can proceed to review.",
    icon: 'success' as const,
    action: {
      label: "Continue to Review",
      variant: 'primary' as const,
    },
    secondaryAction: {
      label: "Browse All Skills",
      variant: 'ghost' as const,
    },
  },

  /**
   * No skills found in resume/vault
   */
  noExistingSkills: {
    title: "No Skills Found",
    message: "We couldn't find skills in your résumé or Career Vault. Add the skills recommended for this job, or skip to review.",
    icon: 'info' as const,
    action: {
      label: "Add Recommended Skills",
      variant: 'primary' as const,
    },
  },

  /**
   * No additional skills recommended
   */
  noRecommendations: {
    title: "No Additional Skills Recommended",
    message: "The job description doesn't highlight specific skills you're missing. Your current skill set appears adequate.",
    icon: 'neutral' as const,
    action: {
      label: "Continue to Review",
      variant: 'primary' as const,
    },
  },
};

// ============================================================================
// GAP ANALYSIS EMPTY STATES
// ============================================================================

export const GAP_EMPTY_STATES = {
  /**
   * No critical gaps
   */
  noCriticalGaps: {
    title: "No Critical Gaps!",
    message: "Great news—you don't have any critical gaps that would cause automatic rejection. Focus on polish and strengthening your impact statements.",
    icon: 'success' as const,
  },

  /**
   * No gaps at all
   */
  noGaps: {
    title: "Excellent Match!",
    message: "Your résumé already covers all the key requirements for this job. Use the builder to polish your language and maximize impact.",
    icon: 'success' as const,
  },

  /**
   * All gaps addressed
   */
  allGapsAddressed: {
    title: "All Gaps Addressed!",
    message: "You've addressed all identified gaps. Your résumé is now well-aligned with this job's requirements.",
    icon: 'success' as const,
  },
};

// ============================================================================
// REVIEW EMPTY STATES
// ============================================================================

export const REVIEW_EMPTY_STATES = {
  /**
   * Resume is empty (edge case)
   */
  emptyResume: {
    title: "Nothing to Review",
    message: "You haven't accepted any content yet. Go back and select the bullets you want to include.",
    icon: 'warning' as const,
    action: {
      label: "Go to Highlights",
      variant: 'primary' as const,
    },
  },

  /**
   * Very thin resume
   */
  thinResume: {
    title: "Very Brief Résumé",
    message: "Your résumé has minimal content. Consider going back to add more impact statements for a stronger impression.",
    icon: 'warning' as const,
    action: {
      label: "Add More Content",
      variant: 'secondary' as const,
    },
    secondaryAction: {
      label: "Export Anyway",
      variant: 'ghost' as const,
    },
  },
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Get the appropriate empty state based on context
 */
export function getEmptyState(
  section: 'highlights' | 'experience' | 'skills' | 'gaps' | 'review',
  condition: string
): EmptyStateConfig | null {
  const stateMap: Record<string, Record<string, EmptyStateConfig>> = {
    highlights: HIGHLIGHTS_EMPTY_STATES,
    experience: EXPERIENCE_EMPTY_STATES,
    skills: SKILLS_EMPTY_STATES,
    gaps: GAP_EMPTY_STATES,
    review: REVIEW_EMPTY_STATES,
  };

  return stateMap[section]?.[condition] || null;
}
