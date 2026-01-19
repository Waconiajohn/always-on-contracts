import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  BenchmarkCandidate,
  MatchScoreBreakdown,
  ScoreVsBenchmarkRequest,
  ScoreVsBenchmarkResponse
} from '@/lib/types/benchmark';

interface UseScoreVsBenchmarkResult {
  score: MatchScoreBreakdown | null;
  isLoading: boolean;
  error: string | null;
  metrics: ScoreVsBenchmarkResponse['metrics'] | null;
  scoreResume: (request: ScoreVsBenchmarkRequest) => Promise<MatchScoreBreakdown | null>;
  reset: () => void;
}

/**
 * Hook for scoring a resume against a benchmark candidate profile.
 *
 * This calls the score-vs-benchmark edge function which analyzes:
 * - Keyword/skill matches (40% weight)
 * - Experience level alignment (25% weight)
 * - Accomplishments with metrics (20% weight)
 * - ATS compliance (15% weight)
 *
 * @example
 * ```tsx
 * const { score, isLoading, error, scoreResume } = useScoreVsBenchmark();
 *
 * const handleScore = async () => {
 *   const result = await scoreResume({
 *     resumeText: "John Doe\nSenior Software Engineer...",
 *     benchmark: benchmarkCandidate // from useAnalyzeBenchmark
 *   });
 *
 *   if (result) {
 *     console.log('Overall score:', result.overallScore);
 *     console.log('Missing skills:', result.categories.keywords.missing);
 *   }
 * };
 * ```
 */
export function useScoreVsBenchmark(): UseScoreVsBenchmarkResult {
  const [score, setScore] = useState<MatchScoreBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ScoreVsBenchmarkResponse['metrics'] | null>(null);

  const scoreResume = useCallback(async (
    request: ScoreVsBenchmarkRequest
  ): Promise<MatchScoreBreakdown | null> => {
    setIsLoading(true);
    setError(null);
    setScore(null);
    setMetrics(null);

    try {
      // Validate input
      if (!request.resumeText || request.resumeText.trim().length < 100) {
        throw new Error('Resume text must be at least 100 characters');
      }
      if (!request.benchmark || !request.benchmark.coreSkills) {
        throw new Error('Valid benchmark candidate is required');
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to score your resume');
      }

      // Call the edge function
      const { data, error: fnError } = await supabase.functions.invoke<ScoreVsBenchmarkResponse>(
        'score-vs-benchmark',
        {
          body: {
            resumeText: request.resumeText,
            benchmark: request.benchmark,
            jobDescription: request.jobDescription
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Failed to score resume');
      }

      if (!data?.success || !data.score) {
        throw new Error(data?.error || 'Failed to generate score');
      }

      setScore(data.score);
      setMetrics(data.metrics || null);

      return data.score;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('[useScoreVsBenchmark] Error:', errorMessage);
      return null;

    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setScore(null);
    setError(null);
    setMetrics(null);
    setIsLoading(false);
  }, []);

  return {
    score,
    isLoading,
    error,
    metrics,
    scoreResume,
    reset
  };
}

/**
 * Get a color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get a background color class based on score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

/**
 * Get a label for the score
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent Match';
  if (score >= 80) return 'Strong Match';
  if (score >= 70) return 'Good Match';
  if (score >= 60) return 'Moderate Match';
  if (score >= 50) return 'Fair Match';
  return 'Needs Improvement';
}

/**
 * Format a category score with label
 */
export function formatCategoryScore(category: string, score: number): string {
  const labels: Record<string, string> = {
    keywords: 'Skills',
    experience: 'Experience',
    accomplishments: 'Impact',
    atsCompliance: 'ATS'
  };
  return `${labels[category] || category}: ${score}%`;
}
