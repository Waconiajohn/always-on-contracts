import { useState, useCallback } from 'react';
import { useAnalyzeBenchmark } from './useAnalyzeBenchmark';
import { useScoreVsBenchmark } from './useScoreVsBenchmark';
import { useGapChecklist } from './useGapChecklist';
import type {
  BenchmarkCandidate,
  MatchScoreBreakdown,
  GapChecklist
} from '@/lib/types/benchmark';

type LoadingState = 'idle' | 'analyzing-benchmark' | 'scoring' | 'generating-gaps';

interface ResumeTailoringState {
  benchmark: BenchmarkCandidate | null;
  scoreBreakdown: MatchScoreBreakdown | null;
  gapChecklist: GapChecklist | null;
  resume: string;
  jobDescription: string;
  loading: LoadingState;
  error: string | null;
}

interface UseResumeTailoringResult {
  state: ResumeTailoringState;
  analyzeJob: (resumeText: string, jobDescription: string) => Promise<void>;
  updateResume: (resumeText: string) => Promise<void>;
  applyGapAction: (gapId: string) => void;
  exportResume: () => void;
  reset: () => void;
}

/**
 * Orchestration hook for the V2 resume tailoring flow.
 *
 * Combines the analyze-benchmark, score-vs-benchmark, and generate-gap-checklist
 * flows into a single, easy-to-use hook for the V2Page component.
 *
 * @example
 * ```tsx
 * const { state, analyzeJob, updateResume } = useResumeTailoring();
 *
 * // Initial analysis
 * await analyzeJob(resumeText, jobDescription);
 *
 * // After user edits resume
 * await updateResume(newResumeText);
 * ```
 */
export function useResumeTailoring(): UseResumeTailoringResult {
  const [state, setState] = useState<ResumeTailoringState>({
    benchmark: null,
    scoreBreakdown: null,
    gapChecklist: null,
    resume: '',
    jobDescription: '',
    loading: 'idle',
    error: null
  });

  const { analyzeBenchmark } = useAnalyzeBenchmark();
  const { scoreResume } = useScoreVsBenchmark();
  const { generateChecklist } = useGapChecklist();

  /**
   * Full analysis flow: analyze benchmark -> score resume -> generate gaps
   */
  const analyzeJob = useCallback(async (resumeText: string, jobDescription: string) => {
    setState(prev => ({
      ...prev,
      resume: resumeText,
      jobDescription,
      loading: 'analyzing-benchmark',
      error: null
    }));

    try {
      // Step 1: Analyze the job description to create a benchmark
      const benchmark = await analyzeBenchmark({ jobDescription });

      if (!benchmark) {
        throw new Error('Failed to analyze job description');
      }

      setState(prev => ({
        ...prev,
        benchmark,
        loading: 'scoring'
      }));

      // Step 2: Score the resume against the benchmark
      const scoreBreakdown = await scoreResume({
        resumeText,
        benchmark,
        jobDescription
      });

      if (!scoreBreakdown) {
        throw new Error('Failed to score resume');
      }

      setState(prev => ({
        ...prev,
        scoreBreakdown,
        loading: 'generating-gaps'
      }));

      // Step 3: Generate the gap checklist
      const gapChecklist = await generateChecklist({
        scoreBreakdown,
        benchmark,
        resumeText
      });

      setState(prev => ({
        ...prev,
        gapChecklist: gapChecklist || [],
        loading: 'idle'
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState(prev => ({
        ...prev,
        loading: 'idle',
        error: errorMessage
      }));
      console.error('[useResumeTailoring] Error:', errorMessage);
    }
  }, [analyzeBenchmark, scoreResume, generateChecklist]);

  /**
   * Re-score the resume after user edits
   */
  const updateResume = useCallback(async (resumeText: string) => {
    if (!state.benchmark) {
      console.warn('[useResumeTailoring] Cannot update resume without benchmark');
      return;
    }

    setState(prev => ({
      ...prev,
      resume: resumeText,
      loading: 'scoring',
      error: null
    }));

    try {
      // Re-score with updated resume
      const scoreBreakdown = await scoreResume({
        resumeText,
        benchmark: state.benchmark,
        jobDescription: state.jobDescription
      });

      if (!scoreBreakdown) {
        throw new Error('Failed to re-score resume');
      }

      setState(prev => ({
        ...prev,
        scoreBreakdown,
        loading: 'generating-gaps'
      }));

      // Re-generate gap checklist
      const gapChecklist = await generateChecklist({
        scoreBreakdown,
        benchmark: state.benchmark!,
        resumeText
      });

      setState(prev => ({
        ...prev,
        gapChecklist: gapChecklist || [],
        loading: 'idle'
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState(prev => ({
        ...prev,
        loading: 'idle',
        error: errorMessage
      }));
    }
  }, [state.benchmark, state.jobDescription, scoreResume, generateChecklist]);

  /**
   * Apply a gap action (placeholder - to be implemented with AI assistance)
   */
  const applyGapAction = useCallback((gapId: string) => {
    const gap = state.gapChecklist?.find(g => g.id === gapId);
    if (!gap) {
      console.warn('[useResumeTailoring] Gap not found:', gapId);
      return;
    }

    // For now, just log the action - future implementation will use AI to
    // generate specific improvements based on the gap type
    console.log('[useResumeTailoring] Applying gap action:', gap);

    // If there's a suggested bullet, we could append it to the resume
    if (gap.suggestedBullet) {
      const updatedResume = state.resume + '\n\n' + gap.suggestedBullet;
      setState(prev => ({
        ...prev,
        resume: updatedResume
      }));
    }

    // If there's a suggested keyword, highlight where to add it
    if (gap.suggestedKeyword) {
      console.log(`[useResumeTailoring] Suggested keyword: ${gap.suggestedKeyword}`);
      console.log(`[useResumeTailoring] Add to section: ${gap.section}`);
    }
  }, [state.gapChecklist, state.resume]);

  /**
   * Export the tailored resume
   */
  const exportResume = useCallback(() => {
    const element = document.createElement('a');
    const file = new Blob([state.resume], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'tailored-resume.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [state.resume]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setState({
      benchmark: null,
      scoreBreakdown: null,
      gapChecklist: null,
      resume: '',
      jobDescription: '',
      loading: 'idle',
      error: null
    });
  }, []);

  return {
    state,
    analyzeJob,
    updateResume,
    applyGapAction,
    exportResume,
    reset
  };
}
