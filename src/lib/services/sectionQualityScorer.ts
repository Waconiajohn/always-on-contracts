/**
 * Section Quality Scorer - AI-Powered
 * Uses AI to analyze resume section quality instead of hardcoded rules
 */

import { supabase } from '@/integrations/supabase/client';

interface QualityScoreResult {
  overallScore: number; // 0-100
  atsMatchPercentage: number; // 0-100
  requirementsCoverage: number; // 0-100
  competitiveStrength: number; // 1-5 stars
  strengths: string[];
  weaknesses: string[];
  keywords: {
    matched: string[];
    missing: string[];
  };
}

interface ScoringInput {
  content: string;
  jobAnalysis: any;
  vaultMatches?: any[];
  atsKeywords?: {
    critical: string[];
    important: string[];
    nice_to_have: string[];
  };
  requirements?: string[];
}

// Cache for AI quality scores (cache until user updates section)
const qualityScoreCache = new Map<string, QualityScoreResult>();

function getCacheKey(input: ScoringInput): string {
  // Create hash from content + keywords
  return JSON.stringify({
    contentHash: input.content.substring(0, 200),
    criticalKW: input.atsKeywords?.critical || [],
    reqCount: input.requirements?.length || 0
  });
}

/**
 * Calculate comprehensive quality score using AI analysis
 */
export async function calculateSectionQuality(input: ScoringInput): Promise<QualityScoreResult> {
  const {
    content,
    jobAnalysis,
    atsKeywords = { critical: [], important: [], nice_to_have: [] },
    requirements = []
  } = input;

  // Check cache first (cache until user updates the section)
  const cacheKey = getCacheKey(input);
  const cached = qualityScoreCache.get(cacheKey);
  if (cached) {
    console.log('[Quality Scorer] Returning cached AI result');
    return cached;
  }

  try {
    // Call AI-powered quality analysis edge function
    const { data, error } = await supabase.functions.invoke('analyze-section-quality', {
      body: {
        content,
        requirements,
        atsKeywords,
        seniority: jobAnalysis?.seniority || 'mid-level',
        industry: jobAnalysis?.industry || 'General',
        jobTitle: jobAnalysis?.title || ''
      }
    });

    if (error) {
      console.error('[Quality Scorer] AI analysis failed:', error);
      throw error;
    }

    // Transform AI response to match our interface
    const result: QualityScoreResult = {
      overallScore: data.overallScore,
      atsMatchPercentage: data.atsMatchPercentage,
      requirementsCoverage: data.requirementsCoverage,
      competitiveStrength: data.competitiveStrength,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      keywords: {
        matched: data.keywordsMatched || [],
        missing: data.keywordsMissing || []
      }
    };

    // Cache the result
    qualityScoreCache.set(cacheKey, result);

    console.log(`[Quality Scorer] AI analysis complete - Score: ${result.overallScore}/100`);
    return result;

  } catch (error) {
    console.error('[Quality Scorer] Error calling AI:', error);
    
    // Fallback to basic validation (NOT for quality judgment)
    return fallbackValidation(input);
  }
}

/**
 * Clear cache when user updates a section
 */
export function clearQualityCache() {
  qualityScoreCache.clear();
}

/**
 * Fallback validation - basic checks only (used if AI fails)
 * This is NOT for quality judgment - just ensures content isn't empty
 */
function fallbackValidation(input: ScoringInput): QualityScoreResult {
  const { content, atsKeywords = { critical: [], important: [], nice_to_have: [] } } = input;
  const contentLower = content.toLowerCase();

  // Very basic validation only - check if content exists
  const hasContent = content.trim().length > 20;
  
  const criticalMatched = atsKeywords.critical.filter(kw =>
    contentLower.includes(kw.toLowerCase())
  );

  return {
    overallScore: hasContent ? 70 : 30, // Neutral score
    atsMatchPercentage: criticalMatched.length > 0 ? 60 : 40,
    requirementsCoverage: 60,
    competitiveStrength: 3,
    strengths: hasContent ? ['Content provided'] : [],
    weaknesses: ['AI analysis unavailable - scores are estimated', 'Please try again or check your connection'],
    keywords: {
      matched: criticalMatched,
      missing: []
    }
  };
}

/**
 * Compare two versions and return recommendation
 */
export function compareVersions(
  idealScore: QualityScoreResult,
  personalizedScore: QualityScoreResult,
  vaultStrength: number
): {
  recommendation: 'ideal' | 'personalized' | 'blend';
  reason: string;
  scoreDifference: number;
} {
  const scoreDiff = personalizedScore.overallScore - idealScore.overallScore;

  // If vault is too weak, recommend ideal
  if (vaultStrength < 40) {
    return {
      recommendation: 'ideal',
      reason: 'Career Vault needs more data for strong personalization',
      scoreDifference: scoreDiff
    };
  }

  // If personalized is significantly better (>10 points)
  if (scoreDiff > 10) {
    return {
      recommendation: 'personalized',
      reason: 'Your vault data creates a stronger, more competitive section',
      scoreDifference: scoreDiff
    };
  }

  // If ideal is significantly better (>10 points)
  if (scoreDiff < -10) {
    return {
      recommendation: 'ideal',
      reason: 'Industry standard version has better ATS optimization',
      scoreDifference: scoreDiff
    };
  }

  // If they're close, recommend blending
  return {
    recommendation: 'blend',
    reason: 'Both versions have strengths - consider combining the best elements',
    scoreDifference: scoreDiff
  };
}
