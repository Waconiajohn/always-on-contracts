/**
 * useResumeGapAnalysis - Hook for comprehensive resume gap analysis
 * Calls analyze-resume-gaps edge function for deep gap identification
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HardSkillGap {
  skill: string;
  severity: 'critical' | 'high' | 'medium';
  mentionCount: number;
  bridgingStrategy: string;
  suggestedBullet: string;
  evidenceToGather: string;
}

export interface SoftSkillGap {
  skill: string;
  severity: 'critical' | 'high' | 'medium';
  bridgingStrategy: string;
  suggestedBullet: string;
  evidenceToGather: string;
}

export interface ExperienceGap {
  area: string;
  severity: 'critical' | 'high' | 'medium';
  bridgingStrategy: string;
  suggestedBullet: string;
  evidenceToGather: string;
}

export interface KeywordGap {
  keyword: string;
  frequency: number;
  category: string;
  suggestedPlacement: string;
  naturalPhrasing: string;
}

export interface StrengthToLeverage {
  strength: string;
  recommendation: string;
}

export interface PrioritizedAction {
  priority: number;
  action: string;
  impact: string;
  timeEstimate: string;
}

export interface GapAnalysisResult {
  overallFitScore: number;
  gapSummary: string;
  hardSkillGaps: HardSkillGap[];
  softSkillGaps: SoftSkillGap[];
  experienceGaps: ExperienceGap[];
  keywordGaps: KeywordGap[];
  strengthsToLeverage: StrengthToLeverage[];
  prioritizedActions: PrioritizedAction[];
}

interface AnalyzeGapsParams {
  resumeText: string;
  jobDescription: string;
  currentSkills?: string[];
  currentBullets?: string[];
}

export function useResumeGapAnalysis() {
  const [analysis, setAnalysis] = useState<GapAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeGaps = useCallback(async (params: AnalyzeGapsParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-resume-gaps', {
        body: params,
      });

      if (fnError) throw fnError;

      if (data?.success && data?.analysis) {
        setAnalysis(data.analysis as GapAnalysisResult);
        return data.analysis as GapAnalysisResult;
      } else {
        throw new Error(data?.error || 'No analysis returned');
      }
    } catch (err) {
      console.error('Failed to analyze resume gaps:', err);
      const message = err instanceof Error ? err.message : 'Failed to analyze gaps';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  // Helper to get gaps by severity
  const getCriticalGaps = useCallback(() => {
    if (!analysis) return [];
    return [
      ...analysis.hardSkillGaps.filter(g => g.severity === 'critical'),
      ...analysis.softSkillGaps.filter(g => g.severity === 'critical'),
      ...analysis.experienceGaps.filter(g => g.severity === 'critical'),
    ];
  }, [analysis]);

  const getHighPriorityGaps = useCallback(() => {
    if (!analysis) return [];
    return [
      ...analysis.hardSkillGaps.filter(g => g.severity === 'high'),
      ...analysis.softSkillGaps.filter(g => g.severity === 'high'),
      ...analysis.experienceGaps.filter(g => g.severity === 'high'),
    ];
  }, [analysis]);

  const getTotalGapCount = useCallback(() => {
    if (!analysis) return 0;
    return (
      analysis.hardSkillGaps.length +
      analysis.softSkillGaps.length +
      analysis.experienceGaps.length +
      analysis.keywordGaps.length
    );
  }, [analysis]);

  return {
    analysis,
    isLoading,
    error,
    analyzeGaps,
    clearAnalysis,
    getCriticalGaps,
    getHighPriorityGaps,
    getTotalGapCount,
  };
}
