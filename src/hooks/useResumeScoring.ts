/**
 * useResumeScoring - AI-powered sophisticated scoring for resume sections
 */

import { useState, useCallback } from 'react';
import { calculateSectionQuality } from '@/lib/services/sectionQualityScorer';

// Match the structure returned by sectionQualityScorer
interface QualityScoreResult {
  overallScore: number;
  atsMatchPercentage: number;
  requirementsCoverage: number;
  competitiveStrength: number;
  strengths: string[];
  weaknesses: string[];
  keywords: {
    matched: string[];
    missing: string[];
  };
}

export interface ScoreBreakdown {
  overall: number;
  ats: number;
  requirements: number;
  competitive: number;
  humanVoice: number;
}

export interface ScoringInput {
  content: string;
  sectionType: string;
  jobDescription: string;
  targetRole: string;
  targetIndustry: string;
  level: string;
  atsKeywords?: string[];
}

export interface ScoringResult {
  breakdown: ScoreBreakdown;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  improvementTips: string[];
}

// Weights for overall score calculation
const SCORE_WEIGHTS = {
  ats: 0.35,
  requirements: 0.35,
  competitive: 0.20,
  humanVoice: 0.10
};

// Simple human voice scoring (AI detection risk)
function calculateHumanVoiceScore(content: string): number {
  if (!content || content.length < 50) return 50;

  let score = 100;
  
  // Penalize common AI patterns
  const aiPatterns = [
    /leverag(e|ing)/gi,
    /spearhead(ed|ing)/gi,
    /synerg(y|ies|ize)/gi,
    /holistic/gi,
    /cutting-edge/gi,
    /best-in-class/gi,
    /world-class/gi,
    /robust/gi,
    /seamless(ly)?/gi,
    /comprehensive/gi
  ];

  aiPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      score -= matches.length * 5;
    }
  });

  // Reward specific details, numbers, and concrete language
  const specificPatterns = [
    /\$[\d,]+/g, // Dollar amounts
    /\d+%/g, // Percentages
    /\d+ (team|people|members|reports)/gi, // Team sizes
    /increased|decreased|reduced|improved by/gi // Action + result
  ];

  specificPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      score += matches.length * 3;
    }
  });

  return Math.max(0, Math.min(100, score));
}

export function useResumeScoring() {
  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScoringResult | null>(null);

  const calculateScore = useCallback(async (input: ScoringInput): Promise<ScoringResult> => {
    setIsScoring(true);
    setScoringError(null);

    try {
      // Transform simple keyword array to expected structure
      const atsKeywordsFormatted = input.atsKeywords ? {
        critical: input.atsKeywords.slice(0, 5),
        important: input.atsKeywords.slice(5, 10),
        nice_to_have: input.atsKeywords.slice(10)
      } : undefined;

      // Call the AI-powered section quality scorer
      const aiResult: QualityScoreResult = await calculateSectionQuality({
        content: input.content,
        jobAnalysis: {
          targetRole: input.targetRole,
          industry: input.targetIndustry,
          seniorityLevel: input.level
        },
        atsKeywords: atsKeywordsFormatted,
        requirements: [input.jobDescription.slice(0, 500)] // First 500 chars as context
      });

      // Calculate human voice score locally
      const humanVoiceScore = calculateHumanVoiceScore(input.content);

      // Map AI result to our scoring structure
      const breakdown: ScoreBreakdown = {
        ats: aiResult.atsMatchPercentage,
        requirements: aiResult.overallScore, // Use overall as requirements proxy
        competitive: Math.min(100, aiResult.overallScore * 1.1), // Slight boost for competitive
        humanVoice: humanVoiceScore,
        overall: 0 // Calculate below
      };

      // Calculate weighted overall score
      breakdown.overall = Math.round(
        breakdown.ats * SCORE_WEIGHTS.ats +
        breakdown.requirements * SCORE_WEIGHTS.requirements +
        breakdown.competitive * SCORE_WEIGHTS.competitive +
        breakdown.humanVoice * SCORE_WEIGHTS.humanVoice
      );

      const result: ScoringResult = {
        breakdown,
        strengths: aiResult.strengths || [],
        weaknesses: aiResult.weaknesses || [],
        missingKeywords: aiResult.keywords?.missing || [],
        improvementTips: [
          ...(aiResult.weaknesses || []).slice(0, 2),
          humanVoiceScore < 70 ? 'Consider using more specific, concrete language to sound more authentic' : ''
        ].filter(Boolean)
      };

      setLastResult(result);
      return result;
    } catch (err) {
      console.error('Scoring error:', err);
      setScoringError('Failed to calculate score. Using estimated values.');
      
      // Return fallback scores
      const fallbackResult: ScoringResult = {
        breakdown: {
          overall: 65,
          ats: 60,
          requirements: 70,
          competitive: 65,
          humanVoice: 75
        },
        strengths: ['Content added to section'],
        weaknesses: ['Unable to analyze - please try again'],
        missingKeywords: [],
        improvementTips: ['Add more specific achievements with metrics']
      };
      
      setLastResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsScoring(false);
    }
  }, []);

  const quickScore = useCallback((content: string): number => {
    // Fast local scoring without AI call
    if (!content || content.length < 20) return 0;
    
    let score = 50;
    
    // Length bonus
    if (content.length > 100) score += 10;
    if (content.length > 300) score += 10;
    
    // Metrics bonus
    if (/\d+%/.test(content)) score += 10;
    if (/\$[\d,]+/.test(content)) score += 10;
    
    // Action verbs bonus
    const actionVerbs = /^(Led|Managed|Developed|Created|Implemented|Increased|Reduced|Delivered|Achieved)/gmi;
    const actionCount = (content.match(actionVerbs) || []).length;
    score += Math.min(actionCount * 3, 15);

    return Math.min(100, score);
  }, []);

  return {
    calculateScore,
    quickScore,
    isScoring,
    scoringError,
    lastResult
  };
}
