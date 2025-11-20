/**
 * Career Calculations - Factual Career Metrics
 * 
 * CRITICAL: These functions calculate actual career metrics from work_positions data.
 * NO GUESSING. NO INFERENCE. Facts only.
 */

export interface WorkPosition {
  company_name: string;
  job_title: string;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean | null;
  description?: string | null;
  team_size?: number | null;
}

export interface Education {
  institution_name: string;
  degree_type: string;
  field_of_study?: string | null;
  graduation_year?: number | null;
}

/**
 * Calculate actual years of experience from work positions
 * FACT-BASED: Uses actual start/end dates from work history
 */
export function calculateYearsOfExperience(workPositions: WorkPosition[]): number {
  if (!workPositions || workPositions.length === 0) return 0;

  let totalDays = 0;
  const now = new Date();

  for (const position of workPositions) {
    if (!position.start_date) continue;

    const startDate = new Date(position.start_date);
    const endDate = position.is_current || !position.end_date 
      ? now 
      : new Date(position.end_date);

    const daysInPosition = Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    totalDays += daysInPosition;
  }

  const years = Math.floor(totalDays / 365);
  console.log(`[CAREER-CALC] Calculated ${years} years of experience from ${workPositions.length} positions`);
  
  return years;
}

/**
 * Infer seniority level from job titles
 * FACT-BASED: Analyzes actual job titles from work history
 */
export function inferSeniorityLevel(workPositions: WorkPosition[]): {
  seniority: 'Junior IC' | 'Mid-Level IC' | 'Senior IC' | 'Staff/Principal IC' | 'Team Lead' | 'Manager' | 'Senior Manager' | 'Director' | 'VP' | 'C-Level';
  confidence: number;
  reasoning: string;
} {
  if (!workPositions || workPositions.length === 0) {
    return {
      seniority: 'Mid-Level IC',
      confidence: 10,
      reasoning: 'No work history available'
    };
  }

  // Get most recent position (highest seniority indicator)
  const sortedPositions = [...workPositions].sort((a, b) => {
    const aDate = a.start_date || '1900-01-01';
    const bDate = b.start_date || '1900-01-01';
    return bDate.localeCompare(aDate);
  });

  const mostRecentTitle = sortedPositions[0].job_title.toLowerCase();

  // C-Level patterns
  if (/\b(ceo|cfo|cto|coo|cpo|cmo|chief)\b/i.test(mostRecentTitle)) {
    return { seniority: 'C-Level', confidence: 95, reasoning: `Title contains C-suite indicator: ${sortedPositions[0].job_title}` };
  }

  // VP patterns
  if (/\bv[.\s]?p\.?|vice president\b/i.test(mostRecentTitle)) {
    return { seniority: 'VP', confidence: 95, reasoning: `VP title: ${sortedPositions[0].job_title}` };
  }

  // Director patterns
  if (/\bdirector\b/i.test(mostRecentTitle)) {
    return { seniority: 'Director', confidence: 90, reasoning: `Director title: ${sortedPositions[0].job_title}` };
  }

  // Senior Manager patterns
  if (/\bsenior\s+manager|sr\s+manager/i.test(mostRecentTitle)) {
    return { seniority: 'Senior Manager', confidence: 90, reasoning: `Senior Manager title: ${sortedPositions[0].job_title}` };
  }

  // Manager patterns
  if (/\bmanager|supervisor|lead|head\s+of\b/i.test(mostRecentTitle)) {
    return { seniority: 'Manager', confidence: 85, reasoning: `Management title: ${sortedPositions[0].job_title}` };
  }

  // Staff/Principal IC patterns
  if (/\bstaff|principal|distinguished|fellow\b/i.test(mostRecentTitle)) {
    return { seniority: 'Staff/Principal IC', confidence: 90, reasoning: `Staff-level IC title: ${sortedPositions[0].job_title}` };
  }

  // Senior IC patterns
  if (/\bsenior|sr\b/i.test(mostRecentTitle)) {
    return { seniority: 'Senior IC', confidence: 85, reasoning: `Senior IC title: ${sortedPositions[0].job_title}` };
  }

  // Junior patterns
  if (/\bjunior|jr|associate|entry/i.test(mostRecentTitle)) {
    return { seniority: 'Junior IC', confidence: 85, reasoning: `Junior IC title: ${sortedPositions[0].job_title}` };
  }

  // Default to mid-level based on years
  const years = calculateYearsOfExperience(workPositions);
  if (years < 2) {
    return { seniority: 'Junior IC', confidence: 60, reasoning: `${years} years of experience, no clear seniority indicator` };
  } else if (years < 5) {
    return { seniority: 'Mid-Level IC', confidence: 65, reasoning: `${years} years of experience, no clear seniority indicator` };
  } else if (years < 10) {
    return { seniority: 'Senior IC', confidence: 70, reasoning: `${years} years of experience, no clear seniority indicator` };
  } else {
    return { seniority: 'Staff/Principal IC', confidence: 65, reasoning: `${years} years of experience, no clear seniority indicator` };
  }
}

/**
 * Check if candidate has management experience
 * FACT-BASED: Checks actual job titles and descriptions
 */
export function hasManagementExperience(workPositions: WorkPosition[], milestones: any[]): {
  hasManagement: boolean;
  teamSizes: number[];
  details: string;
} {
  if (!workPositions || workPositions.length === 0) {
    return { hasManagement: false, teamSizes: [], details: 'No work history available' };
  }

  const managementTitles = workPositions.filter(wp => 
    /\bmanager|supervisor|director|lead|head\s+of|vp|chief\b/i.test(wp.job_title)
  );

  const teamSizes: number[] = [];
  const details: string[] = [];

  // Extract team sizes from descriptions
  for (const position of workPositions) {
    if (position.team_size) {
      teamSizes.push(position.team_size);
    }

    const description = position.description || '';
    const teamSizeMatch = description.match(/(?:team|group|crew|staff)\s+of\s+(\d+)/i);
    if (teamSizeMatch) {
      teamSizes.push(parseInt(teamSizeMatch[1]));
    }
  }

  // Extract from milestones
  for (const milestone of milestones || []) {
    const desc = milestone.description || milestone.metric_value || '';
    const teamMatch = desc.match(/(\d+)\s+(?:people|employees|team members|staff)/i);
    if (teamMatch) {
      teamSizes.push(parseInt(teamMatch[1]));
    }
  }

  if (managementTitles.length > 0) {
    details.push(`Management titles: ${managementTitles.map(p => p.job_title).join(', ')}`);
  }
  if (teamSizes.length > 0) {
    details.push(`Team sizes: ${teamSizes.join(', ')}`);
  }

  return {
    hasManagement: managementTitles.length > 0 || teamSizes.length > 0,
    teamSizes,
    details: details.join('. ') || 'No clear management indicators'
  };
}

/**
 * Extract budget ownership from milestones
 * FACT-BASED: Finds dollar amounts in achievements
 */
export function extractBudgetOwnership(milestones: any[]): {
  hasBudget: boolean;
  budgetSizes: number[];
  details: string;
} {
  if (!milestones || milestones.length === 0) {
    return { hasBudget: false, budgetSizes: [], details: 'No milestones available' };
  }

  const budgetSizes: number[] = [];
  const details: string[] = [];

  for (const milestone of milestones) {
    const text = `${milestone.description || ''} ${milestone.metric_value || ''} ${milestone.context || ''}`;
    
    // Match dollar amounts: $350M, $2.5B, $50MM, $1.2 million
    const moneyMatches = text.match(/\$\s*(\d+(?:\.\d+)?)\s*(B|M{1,2}|million|billion|thousand|K)/gi);
    
    if (moneyMatches) {
      for (const match of moneyMatches) {
        const amountMatch = match.match(/\$\s*(\d+(?:\.\d+)?)\s*(B|M{1,2}|million|billion|thousand|K)/i);
        if (amountMatch) {
          const value = parseFloat(amountMatch[1]);
          const unit = amountMatch[2].toUpperCase();
          
          let dollars = 0;
          if (/^B/i.test(unit)) dollars = value * 1_000_000_000;
          else if (/^M/i.test(unit)) dollars = value * 1_000_000;
          else if (/THOUSAND|^K/i.test(unit)) dollars = value * 1_000;
          else dollars = value;
          
          budgetSizes.push(dollars);
          details.push(`${match} budget from: ${milestone.milestone_title || milestone.description?.substring(0, 50)}`);
        }
      }
    }
  }

  return {
    hasBudget: budgetSizes.length > 0,
    budgetSizes,
    details: details.join('; ') || 'No budget indicators found'
  };
}

/**
 * Infer company sizes from work positions
 */
export function inferCompanySizes(workPositions: WorkPosition[]): ('startup' | 'midmarket' | 'enterprise')[] {
  if (!workPositions || workPositions.length === 0) return [];

  const sizes: ('startup' | 'midmarket' | 'enterprise')[] = [];

  for (const position of workPositions) {
    const desc = (position.description || '').toLowerCase();
    const company = position.company_name.toLowerCase();

    // Enterprise indicators
    if (/fortune\s*\d{3}|global|international|enterprise|corporation/i.test(company) ||
        /\b(thousands?|hundreds?)\s+(?:of\s+)?(?:employees|staff)/i.test(desc)) {
      sizes.push('enterprise');
    }
    // Startup indicators
    else if (/startup|seed|series\s+[a-d]|venture|early-stage/i.test(company) ||
             /\b(?:10|20|30|40|50)\s+(?:person|employee)/i.test(desc)) {
      sizes.push('startup');
    }
    // Default to midmarket
    else {
      sizes.push('midmarket');
    }
  }

  return sizes;
}
