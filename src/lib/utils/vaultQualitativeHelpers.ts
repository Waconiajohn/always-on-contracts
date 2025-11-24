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
  // Calculate Layer 1 average
  const layer1Sections = sections.filter(s => s.layer === 1);
  const layer1Avg = layer1Sections.length > 0
    ? layer1Sections.reduce((sum, s) => sum + s.percentage, 0) / layer1Sections.length
    : 0;
  
  // If Layer 1 not at 60% average, that's the priority
  if (layer1Avg < 60) {
    const totalItemsNeeded = layer1Sections.reduce((sum, s) => {
      const gap = Math.max(0, 60 - s.percentage);
      return sum + Math.ceil(gap / 4); // Rough estimate: 4% per item
    }, 0);
    
    if (totalItemsNeeded > 0) {
      return `Add ${totalItemsNeeded} more items to foundation sections (currently ${Math.round(layer1Avg)}% complete)`;
    }
  }
  
  // Layer 1 done, focus on Layer 2
  if (overallPercentage < 85) {
    const layer2Incomplete = sections.filter(s => s.layer === 2 && s.percentage < 100);
    if (layer2Incomplete.length > 0) {
      return 'Add leadership and strategic impact details to reach exceptional status (85%+)';
    }
  }
  
  // Everything done
  if (overallPercentage >= 85) {
    return 'Vault complete! Generate your resume or start interview prep →';
  }
  
  return 'Continue building your vault to unlock advanced features';
}
