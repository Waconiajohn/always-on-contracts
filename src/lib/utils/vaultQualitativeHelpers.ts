/**
 * Qualitative helper functions for V3 Career Vault UI
 * Converts raw metrics into calm, contextual guidance
 */

export interface StrengthLevel {
  level: 'Developing' | 'Competitive' | 'Exceptional';
  description: string;
  color: string;
  textColor: string;
}

/**
 * Convert percentage to qualitative strength level
 */
export function getStrengthLevel(percentage: number): StrengthLevel {
  if (percentage >= 85) {
    return {
      level: 'Exceptional',
      description: 'Your vault exceeds typical market expectations',
      color: 'bg-emerald-500/10',
      textColor: 'text-emerald-700 dark:text-emerald-400'
    };
  } else if (percentage >= 60) {
    return {
      level: 'Competitive',
      description: 'Your vault meets market standards for your target role',
      color: 'bg-blue-500/10',
      textColor: 'text-blue-700 dark:text-blue-400'
    };
  } else {
    return {
      level: 'Developing',
      description: 'Building your vault to meet market benchmarks',
      color: 'bg-amber-500/10',
      textColor: 'text-amber-700 dark:text-amber-400'
    };
  }
}

/**
 * Get contextual guidance for each section based on completion state
 */
export function getSectionGuidance(
  sectionKey: string,
  percentage: number,
  isLocked: boolean,
  itemCount: number,
  targetCount: number
): string {
  if (isLocked) {
    return 'Complete Layer 1 sections to 60% to unlock';
  }
  
  if (percentage >= 100) {
    return 'Section complete - Well documented';
  }
  
  const itemsNeeded = Math.max(1, Math.ceil((targetCount - itemCount)));
  
  // Section-specific guidance
  switch (sectionKey) {
    case 'work_experience':
      return itemsNeeded === 1 
        ? 'Add 1 more quantified achievement'
        : `Add ${itemsNeeded} more quantified achievements`;
    case 'skills':
      return itemsNeeded === 1
        ? 'Add 1 more transferable skill'
        : `Add ${itemsNeeded} more transferable skills`;
    case 'leadership':
      return 'Add leadership examples and management approach';
    case 'strategic_impact':
      return 'Document business results and strategic initiatives';
    case 'professional_resources':
      return 'Add executive presence and professional development';
    default:
      return `${itemsNeeded} more items needed`;
  }
}

/**
 * Get quality status text from quality distribution
 */
export function getQualityStatusText(
  goldCount: number,
  silverCount: number,
  bronzeCount: number,
  assumedCount: number
): string {
  const total = goldCount + silverCount + bronzeCount + assumedCount;
  if (total === 0) return 'No items yet';
  
  if (goldCount > total * 0.7) return 'Mostly verified';
  if (silverCount > total * 0.5) return 'Partially verified';
  if (assumedCount > total * 0.5) return 'Needs review';
  
  return `${goldCount + silverCount} verified, ${assumedCount} assumed`;
}

/**
 * Get benchmark match context text
 */
export function getBenchmarkMatchContext(
  percentage: number,
  targetRole: string,
  seniorityLevel: string = 'mid-level'
): string {
  const roleText = targetRole ? `${seniorityLevel} ${targetRole}` : `${seniorityLevel} roles`;
  
  if (percentage >= 85) {
    return `Exceptional alignment with ${roleText} - exceeds typical benchmarks`;
  } else if (percentage >= 75) {
    return `Strong match to ${roleText} - approaching exceptional threshold`;
  } else if (percentage >= 60) {
    return `Competitive match to ${roleText} - meets market standards`;
  } else if (percentage >= 40) {
    return `Developing match to ${roleText} - approaching competitive threshold`;
  } else {
    return `Building alignment with ${roleText} - early development stage`;
  }
}

/**
 * Get next action prompt based on current state
 */
export function getNextActionPrompt(
  overallPercentage: number,
  sections: Array<{ key: string; percentage: number; layer: number }>
): string {
  // Find first incomplete Layer 1 section
  const incompleteLayer1 = sections.find(s => s.layer === 1 && s.percentage < 100);
  if (incompleteLayer1) {
    const sectionName = incompleteLayer1.key.replace(/_/g, ' ');
    return `Complete ${sectionName} to unlock executive intelligence sections`;
  }
  
  // Layer 1 complete, suggest Layer 2
  if (overallPercentage >= 60) {
    const incompleteLayer2 = sections.find(s => s.layer === 2 && s.percentage < 100);
    if (incompleteLayer2) {
      const sectionName = incompleteLayer2.key.replace(/_/g, ' ');
      return `Add ${sectionName} details to strengthen your executive profile`;
    }
  }
  
  // All sections complete
  if (overallPercentage >= 85) {
    return 'Your vault is exceptional - ready for senior opportunities';
  }
  
  return 'Continue building your vault to strengthen market positioning';
}
