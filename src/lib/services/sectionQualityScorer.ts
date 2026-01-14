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

// Cache with TTL support
interface CacheEntry {
  data: QualityScoreResult;
  expiresAt: number;
}

const qualityScoreCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCacheKey(input: ScoringInput): string {
  // Create a strong hash of the entire input for accurate cache matching
  const cacheData = {
    content: input.content,
    atsKeywords: input.atsKeywords,
    requirements: input.requirements,
    jobAnalysis: input.jobAnalysis
  };
  
  // Simple but effective hash for cache key
  const str = JSON.stringify(cacheData);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `quality_${hash.toString(36)}`;
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

  // Check cache first with TTL validation
  const cacheKey = getCacheKey(input);
  const cached = qualityScoreCache.get(cacheKey);
  if (cached) {
    if (Date.now() < cached.expiresAt) {
      console.log('[Quality Scorer] Cache hit');
      return cached.data;
    } else {
      // Expired entry - remove it
      qualityScoreCache.delete(cacheKey);
    }
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

    // Cache the result with TTL
    qualityScoreCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    console.log(`[Quality Scorer] AI analysis complete - Score: ${result.overallScore}/100`);
    return result;

  } catch (error) {
    console.error('[Quality Scorer] Error calling AI:', error);
    
    // Fallback to basic validation with error context
    return fallbackValidation(input, error instanceof Error ? error : undefined);
  }
}

/**
 * Clear cache when user updates a section
 */
export function clearQualityCache() {
  qualityScoreCache.clear();
}

/**
 * Fallback validation when AI service is unavailable
 * CRITICAL: Returns 0 scores to avoid false confidence
 */
function fallbackValidation(_input: ScoringInput, error?: Error): QualityScoreResult {
  // Log the actual error for debugging
  console.error('[Quality Scorer] AI service unavailable:', error?.message || 'Unknown error');
  
  // Check if it's a specific error type
  const errorMsg = error?.message || '';
  const isTimeout = errorMsg.includes('timeout');
  const isRateLimit = errorMsg.includes('429') || errorMsg.includes('rate limit');
  const isPaymentRequired = errorMsg.includes('402') || errorMsg.includes('payment required');
  
  // Determine error message
  let errorReason = 'Service unavailable';
  if (isTimeout) errorReason = 'Service timeout';
  else if (isRateLimit) errorReason = 'Rate limit exceeded';
  else if (isPaymentRequired) errorReason = 'Credits required';
  
  // CRITICAL: Don't give false confidence - return 0 scores
  return {
    overallScore: 0,
    atsMatchPercentage: 0,
    requirementsCoverage: 0,
    competitiveStrength: 1,
    strengths: [],
    weaknesses: [
      `❌ AI analysis failed: ${errorReason}`,
      '🔄 Please try again in a moment',
      '💡 If this persists, contact support'
    ],
    keywords: { matched: [], missing: [] }
  };
}

/**
 * Compare two versions and return recommendation
 */
export function compareVersions(
  idealScore: QualityScoreResult,
  personalizedScore: QualityScoreResult,
  resumeStrength: number
): {
  recommendation: 'ideal' | 'personalized' | 'blend';
  reason: string;
  scoreDifference: number;
} {
  const scoreDiff = personalizedScore.overallScore - idealScore.overallScore;

  // If resume data is too weak, recommend ideal
  if (resumeStrength < 40) {
    return {
      recommendation: 'ideal',
      reason: 'Master Resume needs more data for strong personalization',
      scoreDifference: scoreDiff
    };
  }

  // If personalized is significantly better (>10 points)
  if (scoreDiff > 10) {
    return {
      recommendation: 'personalized',
      reason: 'Your resume data creates a stronger, more competitive section',
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
