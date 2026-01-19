import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  GapAction,
  GapChecklist,
  GenerateGapChecklistRequest,
  GenerateGapChecklistResponse
} from '@/lib/types/benchmark';

interface UseGapChecklistResult {
  checklist: GapChecklist | null;
  isLoading: boolean;
  error: string | null;
  totalGaps: number;
  highPriorityCount: number;
  generateChecklist: (request: GenerateGapChecklistRequest) => Promise<GapChecklist | null>;
  reset: () => void;
}

/**
 * Hook for generating an actionable gap checklist from a score breakdown.
 *
 * This takes the output of useScoreVsBenchmark and creates a prioritized
 * list of specific actions the user can take to improve their resume.
 *
 * @example
 * ```tsx
 * const { checklist, isLoading, error, generateChecklist } = useGapChecklist();
 *
 * // After scoring a resume
 * const gaps = await generateChecklist({
 *   scoreBreakdown: score,
 *   benchmark: benchmark,
 *   resumeText: resumeText // optional
 * });
 *
 * // Display prioritized gaps
 * gaps?.forEach(gap => {
 *   console.log(`[${gap.severity.toUpperCase()}] ${gap.issue}`);
 *   console.log(`  Action: ${gap.actionDescription}`);
 *   console.log(`  Impact: ${gap.impact}`);
 * });
 * ```
 */
export function useGapChecklist(): UseGapChecklistResult {
  const [checklist, setChecklist] = useState<GapChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalGaps, setTotalGaps] = useState(0);
  const [highPriorityCount, setHighPriorityCount] = useState(0);

  const generateChecklist = useCallback(async (
    request: GenerateGapChecklistRequest
  ): Promise<GapChecklist | null> => {
    setIsLoading(true);
    setError(null);
    setChecklist(null);
    setTotalGaps(0);
    setHighPriorityCount(0);

    try {
      // Validate input
      if (!request.scoreBreakdown || !request.scoreBreakdown.categories) {
        throw new Error('Valid score breakdown is required');
      }
      if (!request.benchmark) {
        throw new Error('Benchmark candidate is required');
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to generate gap checklist');
      }

      // Call the edge function
      const { data, error: fnError } = await supabase.functions.invoke<GenerateGapChecklistResponse>(
        'generate-gap-checklist',
        {
          body: {
            scoreBreakdown: request.scoreBreakdown,
            benchmark: request.benchmark,
            resumeText: request.resumeText
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate gap checklist');
      }

      if (!data?.success || !data.checklist) {
        throw new Error(data?.error || 'Failed to generate gap checklist');
      }

      setChecklist(data.checklist);
      setTotalGaps(data.totalGaps);
      setHighPriorityCount(data.highPriorityCount);

      return data.checklist;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('[useGapChecklist] Error:', errorMessage);
      return null;

    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setChecklist(null);
    setError(null);
    setTotalGaps(0);
    setHighPriorityCount(0);
    setIsLoading(false);
  }, []);

  return {
    checklist,
    isLoading,
    error,
    totalGaps,
    highPriorityCount,
    generateChecklist,
    reset
  };
}

/**
 * Get severity badge color classes
 */
export function getSeverityColor(severity: GapAction['severity']): string {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get gap type icon name (for use with lucide-react)
 */
export function getGapTypeIcon(gapType: GapAction['gapType']): string {
  switch (gapType) {
    case 'keyword':
      return 'tag';
    case 'accomplishment':
      return 'trophy';
    case 'experience':
      return 'briefcase';
    case 'format':
      return 'layout';
    default:
      return 'circle';
  }
}

/**
 * Get action type label for display
 */
export function getActionLabel(action: GapAction['action']): string {
  switch (action) {
    case 'add':
      return 'Add';
    case 'strengthen':
      return 'Improve';
    case 'reorganize':
      return 'Reorganize';
    case 'remove':
      return 'Remove';
    case 'add-new-bullet':
      return 'Add Bullet';
    default:
      return 'Update';
  }
}

/**
 * Get severity label for display
 */
export function getSeverityLabel(severity: GapAction['severity']): string {
  switch (severity) {
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium Priority';
    case 'low':
      return 'Low Priority';
    default:
      return 'Priority';
  }
}

/**
 * Group gaps by type for sectioned display
 */
export function groupGapsByType(checklist: GapChecklist): Record<GapAction['gapType'], GapAction[]> {
  return checklist.reduce((acc, gap) => {
    if (!acc[gap.gapType]) {
      acc[gap.gapType] = [];
    }
    acc[gap.gapType].push(gap);
    return acc;
  }, {} as Record<GapAction['gapType'], GapAction[]>);
}

/**
 * Filter gaps by severity
 */
export function filterGapsBySeverity(
  checklist: GapChecklist,
  severity: GapAction['severity']
): GapChecklist {
  return checklist.filter(gap => gap.severity === severity);
}
