import { useMemo } from 'react';

type DashboardState = 
  | 'onboarding'      // No resume uploaded yet
  | 'extracting'      // Resume uploaded, AI processing
  | 'benchmark-setup' // AI defining personalized benchmarks
  | 'building'        // < 60% of benchmark
  | 'optimizing'      // 60-85% of benchmark
  | 'ready';          // > 85% of benchmark

interface BenchmarkStateResult {
  state: DashboardState;
  message: string;
  nextAction: string;
}

export const useBenchmarkState = (
  vault: any,
  stats: any
): BenchmarkStateResult => {
  return useMemo(() => {
    // No vault or no resume → Onboarding
    if (!vault || !vault.resume_raw_text) {
      return {
        state: 'onboarding',
        message: 'Get started by uploading your resume',
        nextAction: 'Upload Resume'
      };
    }

    // Check if extraction is in progress
    if (vault.extraction_timestamp) {
      const extractionTime = new Date(vault.extraction_timestamp).getTime();
      const now = Date.now();
      const minutesSinceExtraction = (now - extractionTime) / (1000 * 60);
      
      // If extraction was within last 5 minutes and no items, likely still processing
      if (minutesSinceExtraction < 5 && (vault.extraction_item_count || 0) === 0) {
        return {
          state: 'extracting',
          message: 'AI is extracting insights from your resume',
          nextAction: 'Wait for extraction to complete'
        };
      }
    }

    // No benchmark generated yet
    if (!vault.benchmark_standard || !vault.benchmark_generated_at) {
      return {
        state: 'benchmark-setup',
        message: 'Setting up your personalized benchmark',
        nextAction: 'Generate Benchmark'
      };
    }

    // Calculate completion percentage based on benchmark
    const benchmark = vault.benchmark_standard;
    const completion = (benchmark.overall_current / benchmark.overall_target) * 100;

    if (completion < 60) {
      return {
        state: 'building',
        message: 'Building your career vault',
        nextAction: 'Complete foundational items'
      };
    }

    if (completion < 85) {
      return {
        state: 'optimizing',
        message: 'Optimizing your career vault',
        nextAction: 'Add strategic impact'
      };
    }

    return {
      state: 'ready',
      message: 'Your vault is market ready!',
      nextAction: 'Start applying to jobs'
    };
  }, [vault, stats]);
};

// Helper to determine primary goal based on benchmark gaps
export const determinePrimaryGoal = (benchmark: any) => {
  if (!benchmark) return null;

  const gaps = benchmark.gap_analysis?.critical_gaps || [];
  const quickWins = benchmark.gap_analysis?.quick_wins || [];

  if (quickWins.length > 0) {
    // Prefer quick wins first
    return {
      goal: quickWins[0],
      impact: 'Quick win - high impact, low effort',
      scoreGain: 5,
      estimatedTime: '< 30 minutes'
    };
  }

  if (gaps.length > 0) {
    // Fall back to critical gaps
    return {
      goal: gaps[0],
      impact: 'Critical gap - necessary for market readiness',
      scoreGain: 10,
      estimatedTime: '1-2 hours'
    };
  }

  return null;
};