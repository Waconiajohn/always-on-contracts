/**
 * Score Recalculation Utility
 * Recalculates resume scores based on current content
 */

import { supabase } from '@/integrations/supabase/client';
import type { ScoreBreakdown, SectionContent, SectionType } from '../types';

interface RecalculateParams {
  sections: Record<SectionType, SectionContent>;
  jobDescription: string;
  targetRole: string;
}

interface RecalculateResult {
  overallScore: number;
  scores: ScoreBreakdown;
}

/**
 * Recalculate scores by calling the scoring edge function
 */
export async function recalculateScore(params: RecalculateParams): Promise<RecalculateResult> {
  const { sections, jobDescription } = params;
  
  // Combine all section content into resume text
  const resumeText = Object.values(sections)
    .map(s => s.content)
    .filter(c => c.trim())
    .join('\n\n');

  if (!resumeText.trim()) {
    return {
      overallScore: 0,
      scores: { ats: 0, requirements: 0, competitive: 0 }
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('quick-score-resume', {
      body: { resumeText, jobDescription }
    });

    if (error) {
      console.error('Score recalculation error:', error);
      return estimateScore(resumeText, jobDescription);
    }

    return {
      overallScore: data?.overallScore || 0,
      scores: data?.scores || { ats: 0, requirements: 0, competitive: 0 }
    };
  } catch (error) {
    console.error('Score recalculation failed:', error);
    return estimateScore(resumeText, jobDescription);
  }
}

/**
 * Quick local estimate when API fails
 */
function estimateScore(resumeText: string, jobDescription: string): RecalculateResult {
  const resumeWords = resumeText.toLowerCase().split(/\s+/);
  const jobWords = jobDescription.toLowerCase().split(/\s+/);
  
  // Simple keyword overlap calculation
  const jobKeywords = new Set(jobWords.filter(w => w.length > 4));
  const matchingKeywords = resumeWords.filter(w => jobKeywords.has(w));
  
  const keywordMatchRate = Math.min(100, (matchingKeywords.length / jobKeywords.size) * 100 * 1.5);
  
  // Estimate based on content length and keyword matches
  const lengthScore = Math.min(100, resumeText.length / 20);
  const ats = Math.round(Math.min(100, lengthScore * 0.3 + keywordMatchRate * 0.7));
  const requirements = Math.round(keywordMatchRate);
  const competitive = Math.round((ats + requirements) / 2 * 0.9);
  
  const overallScore = Math.round((ats * 0.35) + (requirements * 0.4) + (competitive * 0.25));

  return {
    overallScore,
    scores: { ats, requirements, competitive }
  };
}

/**
 * Debounced score update - call this from components
 */
let recalculateTimeout: NodeJS.Timeout | null = null;

export function debouncedRecalculateScore(
  params: RecalculateParams,
  onResult: (result: RecalculateResult) => void,
  delay: number = 1500
): void {
  if (recalculateTimeout) {
    clearTimeout(recalculateTimeout);
  }
  
  recalculateTimeout = setTimeout(async () => {
    const result = await recalculateScore(params);
    onResult(result);
  }, delay);
}
