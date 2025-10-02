import { supabase } from "@/integrations/supabase/client";

export interface GapAnalysisResult {
  overallFit: number;
  strengths: Array<{
    category: string;
    description: string;
    evidence: string[];
  }>;
  gaps: Array<{
    category: string;
    severity: 'critical' | 'moderate' | 'minor';
    description: string;
    recommendations: string[];
  }>;
  keywordAnalysis: {
    matched: string[];
    missing: string[];
    coverage: number;
  };
  recommendations: string[];
}

/**
 * Performs a comprehensive gap analysis between a resume and job description
 * @param resumeText - The candidate's resume text
 * @param jobDescription - The target job description
 * @returns Promise<GapAnalysisResult> - Detailed analysis of strengths, gaps, and recommendations
 */
export async function performGapAnalysis(
  resumeText: string,
  jobDescription: string
): Promise<GapAnalysisResult> {
  
  if (!resumeText || !jobDescription) {
    throw new Error('Resume text and job description are required');
  }

  try {
    const { data, error } = await supabase.functions.invoke('gap-analysis', {
      body: {
        resumeText,
        jobDescription
      }
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('No response from gap analysis service');
    }

    return data as GapAnalysisResult;

  } catch (error) {
    console.error('Gap analysis error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to perform gap analysis'
    );
  }
}

/**
 * Helper function to categorize gaps by severity
 */
export function categorizeGapsBySeverity(gaps: GapAnalysisResult['gaps']) {
  return {
    critical: gaps.filter(g => g.severity === 'critical'),
    moderate: gaps.filter(g => g.severity === 'moderate'),
    minor: gaps.filter(g => g.severity === 'minor')
  };
}

/**
 * Helper function to get a summary of the analysis
 */
export function getAnalysisSummary(result: GapAnalysisResult) {
  const gapsByType = categorizeGapsBySeverity(result.gaps);
  
  return {
    overallFit: result.overallFit,
    fitLevel: result.overallFit >= 80 ? 'excellent' : 
              result.overallFit >= 60 ? 'good' : 
              result.overallFit >= 40 ? 'fair' : 'poor',
    totalStrengths: result.strengths.length,
    totalGaps: result.gaps.length,
    criticalGaps: gapsByType.critical.length,
    moderateGaps: gapsByType.moderate.length,
    minorGaps: gapsByType.minor.length,
    keywordCoverage: result.keywordAnalysis.coverage,
    topRecommendations: result.recommendations.slice(0, 3)
  };
}
