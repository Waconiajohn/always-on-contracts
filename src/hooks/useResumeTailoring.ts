import { useState, useCallback, useRef, useEffect } from 'react';
import { useAnalyzeBenchmark } from './useAnalyzeBenchmark';
import { useScoreVsBenchmark } from './useScoreVsBenchmark';
import { useGapChecklist } from './useGapChecklist';
import type {
  BenchmarkCandidate,
  MatchScoreBreakdown,
  GapChecklist
} from '@/lib/types/benchmark';

type LoadingState = 'idle' | 'analyzing' | 'scoring' | 'generating-gaps';

export interface UseResumeTailoringState {
  benchmark: BenchmarkCandidate | null;
  scoreBreakdown: MatchScoreBreakdown | null;
  gapChecklist: GapChecklist | null;
  resume: string;
  jobDescription: string;
  loading: LoadingState;
  error: string | null;
}

interface UseResumeTailoringResult {
  state: UseResumeTailoringState;
  analyzeJob: (resumeText: string, jobDescription: string) => Promise<void>;
  updateResume: (resumeText: string) => void;
  applyGapAction: (gapId: string) => Promise<void>;
  exportResume: () => void;
  reset: () => void;
}

// Debounce delay for re-scoring after resume edits (ms)
const RESCORE_DEBOUNCE_MS = 2000;

/**
 * Orchestration hook for the V2 resume tailoring flow.
 *
 * Combines the analyze-benchmark, score-vs-benchmark, and generate-gap-checklist
 * flows into a single, easy-to-use hook for the V2Page component.
 *
 * Features:
 * - Full analysis flow: analyze benchmark -> score resume -> generate gaps
 * - Debounced re-scoring when user edits resume (2 second delay)
 * - Gap action application with actual resume modifications
 * - Export to text file
 *
 * @example
 * ```tsx
 * const { state, analyzeJob, updateResume } = useResumeTailoring();
 *
 * // Initial analysis
 * await analyzeJob(resumeText, jobDescription);
 *
 * // After user edits resume (debounced re-scoring)
 * updateResume(newResumeText);
 * ```
 */
export function useResumeTailoring(): UseResumeTailoringResult {
  const [state, setState] = useState<UseResumeTailoringState>({
    benchmark: null,
    scoreBreakdown: null,
    gapChecklist: null,
    resume: '',
    jobDescription: '',
    loading: 'idle',
    error: null
  });

  // Refs for debounced re-scoring
  const rescoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestResumeRef = useRef<string>('');

  const { analyzeBenchmark } = useAnalyzeBenchmark();
  const { scoreResume } = useScoreVsBenchmark();
  const { generateChecklist } = useGapChecklist();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (rescoreTimeoutRef.current) {
        clearTimeout(rescoreTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Internal function to re-score and regenerate gaps
   */
  const rescoreResume = useCallback(async (
    resumeText: string,
    benchmark: BenchmarkCandidate,
    jobDescription: string
  ) => {
    try {
      // Re-score with updated resume
      const scoreBreakdown = await scoreResume({
        resumeText,
        benchmark,
        jobDescription
      });

      if (!scoreBreakdown) {
        throw new Error('Failed to re-score resume');
      }

      // Re-generate gap checklist
      const gapChecklist = await generateChecklist({
        scoreBreakdown,
        benchmark,
        resumeText
      });

      setState(prev => ({
        ...prev,
        scoreBreakdown,
        gapChecklist: gapChecklist || [],
        loading: 'idle'
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('[useResumeTailoring] Re-score error:', errorMessage);
      setState(prev => ({
        ...prev,
        loading: 'idle',
        error: errorMessage
      }));
    }
  }, [scoreResume, generateChecklist]);

  /**
   * Full analysis flow: analyze benchmark -> score resume -> generate gaps
   */
  const analyzeJob = useCallback(async (resumeText: string, jobDescription: string) => {
    setState(prev => ({
      ...prev,
      resume: resumeText,
      jobDescription,
      loading: 'analyzing',
      error: null,
      benchmark: null,
      scoreBreakdown: null,
      gapChecklist: null
    }));
    latestResumeRef.current = resumeText;

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
   * Update resume text with debounced re-scoring.
   * Updates state immediately, but waits 2 seconds before re-scoring
   * to avoid excessive API calls while user is typing.
   */
  const updateResume = useCallback((newResumeText: string) => {
    // Update state immediately
    setState(prev => ({
      ...prev,
      resume: newResumeText
    }));
    latestResumeRef.current = newResumeText;

    // Clear any pending re-score
    if (rescoreTimeoutRef.current) {
      clearTimeout(rescoreTimeoutRef.current);
    }

    // Don't re-score if no benchmark yet
    if (!state.benchmark) {
      return;
    }

    // Schedule debounced re-score
    rescoreTimeoutRef.current = setTimeout(async () => {
      // Use ref to get latest resume text (in case of rapid updates)
      const currentResume = latestResumeRef.current;

      setState(prev => ({ ...prev, loading: 'scoring' }));

      await rescoreResume(
        currentResume,
        state.benchmark!,
        state.jobDescription
      );
    }, RESCORE_DEBOUNCE_MS);
  }, [state.benchmark, state.jobDescription, rescoreResume]);

  /**
   * Apply a gap action by modifying the resume based on gap type.
   * After modification, triggers re-scoring.
   */
  const applyGapAction = useCallback(async (gapId: string) => {
    if (!state.gapChecklist || !state.benchmark) {
      console.warn('[useResumeTailoring] Cannot apply gap action without checklist/benchmark');
      return;
    }

    const gap = state.gapChecklist.find(g => g.id === gapId);
    if (!gap) {
      console.warn('[useResumeTailoring] Gap not found:', gapId);
      return;
    }

    console.log('[useResumeTailoring] Applying gap action:', gap.action, gap.id);

    let updatedResume = state.resume;

    try {
      switch (gap.action) {
        case 'add':
          // Add suggested keyword to the appropriate section
          if (gap.suggestedKeyword) {
            if (gap.section === 'skills') {
              // Find skills section and append keyword
              const skillsMatch = updatedResume.match(/(skills|technical skills|core competencies)[:\s]*\n/i);
              if (skillsMatch && skillsMatch.index !== undefined) {
                const insertPos = skillsMatch.index + skillsMatch[0].length;
                updatedResume =
                  updatedResume.slice(0, insertPos) +
                  `• ${gap.suggestedKeyword}\n` +
                  updatedResume.slice(insertPos);
              } else {
                // Append to end if no skills section found
                updatedResume = updatedResume + `\n\nSkills:\n• ${gap.suggestedKeyword}`;
              }
            } else {
              // For experience section, append as a context note
              updatedResume = updatedResume + `\n\n[Note: Add ${gap.suggestedKeyword} to relevant experience bullet]`;
            }
          }
          break;

        case 'strengthen':
          // If there's a suggested improvement, add a note
          if (gap.improvementType === 'add-metrics') {
            updatedResume = updatedResume +
              '\n\n[Action: Review bullets and add quantified metrics - numbers, percentages, dollar amounts]';
          } else if (gap.actionDescription) {
            updatedResume = updatedResume + `\n\n[Action: ${gap.actionDescription}]`;
          }
          break;

        case 'add-new-bullet':
          // Add the suggested bullet to experience section
          if (gap.suggestedBullet) {
            const expMatch = updatedResume.match(/(experience|work history|professional experience)[:\s]*\n/i);
            if (expMatch && expMatch.index !== undefined) {
              // Find first bullet point in experience section
              const afterExp = updatedResume.slice(expMatch.index + expMatch[0].length);
              const bulletMatch = afterExp.match(/^[•\-\*]/m);
              if (bulletMatch && bulletMatch.index !== undefined) {
                const insertPos = expMatch.index + expMatch[0].length + bulletMatch.index;
                updatedResume =
                  updatedResume.slice(0, insertPos) +
                  `• ${gap.suggestedBullet}\n` +
                  updatedResume.slice(insertPos);
              } else {
                updatedResume = updatedResume + `\n• ${gap.suggestedBullet}`;
              }
            } else {
              updatedResume = updatedResume + `\n\n• ${gap.suggestedBullet}`;
            }
          }
          break;

        case 'reorganize':
          // Add reorganization note
          updatedResume = updatedResume +
            `\n\n[Reorganize: ${gap.actionDescription || 'Consider restructuring this section for better impact'}]`;
          break;

        case 'remove':
          // Add removal note (don't auto-remove content)
          updatedResume = updatedResume +
            `\n\n[Remove: ${gap.issue}]`;
          break;

        default:
          console.log('[useResumeTailoring] Unknown gap action:', gap.action);
      }

      // Update state with modified resume
      setState(prev => ({
        ...prev,
        resume: updatedResume
      }));
      latestResumeRef.current = updatedResume;

      // Trigger re-scoring after modification
      setState(prev => ({ ...prev, loading: 'scoring' }));
      await rescoreResume(updatedResume, state.benchmark!, state.jobDescription);

    } catch (err) {
      console.error('[useResumeTailoring] Error applying gap action:', err);
    }
  }, [state.resume, state.gapChecklist, state.benchmark, state.jobDescription, rescoreResume]);

  /**
   * Export the tailored resume as a text file
   */
  const exportResume = useCallback(() => {
    const element = document.createElement('a');
    const file = new Blob([state.resume], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const roleSlug = state.benchmark?.roleTitle?.toLowerCase().replace(/\s+/g, '-') || 'resume';
    element.download = `tailored-${roleSlug}-${timestamp}.txt`;

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [state.resume, state.benchmark]);

  /**
   * Reset all state to initial values
   */
  const reset = useCallback(() => {
    // Clear any pending re-score
    if (rescoreTimeoutRef.current) {
      clearTimeout(rescoreTimeoutRef.current);
    }

    setState({
      benchmark: null,
      scoreBreakdown: null,
      gapChecklist: null,
      resume: '',
      jobDescription: '',
      loading: 'idle',
      error: null
    });
    latestResumeRef.current = '';
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
