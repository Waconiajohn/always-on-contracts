import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  BenchmarkCandidate,
  AnalyzeBenchmarkRequest,
  AnalyzeBenchmarkResponse
} from '@/lib/types/benchmark';

interface UseAnalyzeBenchmarkResult {
  benchmark: BenchmarkCandidate | null;
  isLoading: boolean;
  error: string | null;
  metrics: AnalyzeBenchmarkResponse['metrics'] | null;
  analyzeBenchmark: (request: AnalyzeBenchmarkRequest) => Promise<BenchmarkCandidate | null>;
  reset: () => void;
}

/**
 * Hook for analyzing job descriptions and generating benchmark candidate profiles.
 *
 * This calls the analyze-benchmark edge function which uses AI to synthesize
 * what a strong, realistic candidate looks like for a given role - going beyond
 * simple JD parsing to account for poorly-written job descriptions.
 *
 * @example
 * ```tsx
 * const { benchmark, isLoading, error, analyzeBenchmark } = useAnalyzeBenchmark();
 *
 * const handleAnalyze = async () => {
 *   const result = await analyzeBenchmark({
 *     jobDescription: "We are looking for a Senior Software Engineer...",
 *     jobTitle: "Senior Software Engineer",
 *     companyName: "Acme Corp",
 *     industry: "Technology"
 *   });
 *
 *   if (result) {
 *     console.log('Benchmark skills:', result.coreSkills);
 *   }
 * };
 * ```
 */
export function useAnalyzeBenchmark(): UseAnalyzeBenchmarkResult {
  const [benchmark, setBenchmark] = useState<BenchmarkCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyzeBenchmarkResponse['metrics'] | null>(null);

  const analyzeBenchmark = useCallback(async (
    request: AnalyzeBenchmarkRequest
  ): Promise<BenchmarkCandidate | null> => {
    setIsLoading(true);
    setError(null);
    setBenchmark(null);
    setMetrics(null);

    try {
      // Validate input
      if (!request.jobDescription || request.jobDescription.trim().length < 50) {
        throw new Error('Job description must be at least 50 characters');
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to analyze benchmarks');
      }

      // Call the edge function
      const { data, error: fnError } = await supabase.functions.invoke<AnalyzeBenchmarkResponse>(
        'analyze-benchmark',
        {
          body: {
            jobDescription: request.jobDescription,
            jobTitle: request.jobTitle,
            companyName: request.companyName,
            industry: request.industry,
            benchmarkType: request.benchmarkType || 'realistic'
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Failed to analyze benchmark');
      }

      if (!data?.success || !data.benchmark) {
        throw new Error(data?.error || 'Failed to generate benchmark');
      }

      setBenchmark(data.benchmark);
      setMetrics(data.metrics || null);

      return data.benchmark;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('[useAnalyzeBenchmark] Error:', errorMessage);
      return null;

    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setBenchmark(null);
    setError(null);
    setMetrics(null);
    setIsLoading(false);
  }, []);

  return {
    benchmark,
    isLoading,
    error,
    metrics,
    analyzeBenchmark,
    reset
  };
}

/**
 * Get the priority score for a skill based on criticality
 */
export function getSkillPriority(criticality: BenchmarkCandidate['coreSkills'][0]['criticality']): number {
  switch (criticality) {
    case 'must-have': return 3;
    case 'nice-to-have': return 2;
    case 'bonus': return 1;
    default: return 0;
  }
}

/**
 * Sort benchmark skills by priority (must-have first)
 */
export function sortSkillsByPriority(skills: BenchmarkCandidate['coreSkills']): BenchmarkCandidate['coreSkills'] {
  return [...skills].sort((a, b) => getSkillPriority(b.criticality) - getSkillPriority(a.criticality));
}
