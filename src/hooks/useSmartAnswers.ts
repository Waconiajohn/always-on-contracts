import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import type { Alternative } from '@/components/resume-builder/SmartAnswerCard';

export interface SmartAnswer {
  id: string;
  suggestedAnswer: string;
  reasoning: string;
  confidenceScore: number;
  resumeEvidence: string[];
  alternatives: Alternative[];
}

interface UseSmartAnswersOptions {
  jobContext?: {
    title?: string;
    company?: string;
  };
}

export function useSmartAnswers(options: UseSmartAnswersOptions = {}) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Record<string, SmartAnswer>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set());
  const [loadingAlternatives, setLoadingAlternatives] = useState<Set<string>>(new Set());

  const generateSuggestion = useCallback(async (
    requirementKey: string,
    requirement: string,
    category: 'highlyQualified' | 'partiallyQualified' | 'experienceGaps',
    explanation?: string,
    vaultMatches?: any[]
  ) => {
    if (loadingSuggestions.has(requirementKey)) return;

    setLoadingSuggestions(prev => new Set(prev).add(requirementKey));

    try {
      const { data, error } = await invokeEdgeFunction('generate-smart-answer', {
        requirement,
        category,
        explanation,
        vaultMatches,
        jobContext: options.jobContext,
        generateAlternatives: true
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate suggestion');
      }

      if (data) {
        const smartAnswer: SmartAnswer = {
          id: requirementKey,
          suggestedAnswer: data.suggestedAnswer,
          reasoning: data.reasoning,
          confidenceScore: data.confidenceScore,
          resumeEvidence: data.resumeEvidence || [],
          alternatives: data.alternatives || []
        };

        setSuggestions(prev => ({
          ...prev,
          [requirementKey]: smartAnswer
        }));

        toast({
          title: 'AI Suggestion Ready',
          description: 'Generated a tailored answer based on your experience.'
        });
      }
    } catch (error: any) {
      console.error('[useSmartAnswers] Generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Could not generate suggestion',
        variant: 'destructive'
      });
    } finally {
      setLoadingSuggestions(prev => {
        const next = new Set(prev);
        next.delete(requirementKey);
        return next;
      });
    }
  }, [loadingSuggestions, options.jobContext, toast]);

  const generateMoreAlternatives = useCallback(async (requirementKey: string) => {
    const existing = suggestions[requirementKey];
    if (!existing || loadingAlternatives.has(requirementKey)) return;

    setLoadingAlternatives(prev => new Set(prev).add(requirementKey));

    try {
      const { data, error } = await invokeEdgeFunction('generate-smart-answer', {
        requirement: existing.suggestedAnswer,
        category: 'partiallyQualified',
        explanation: 'Generate additional alternative phrasings',
        jobContext: options.jobContext,
        generateAlternatives: true
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate alternatives');
      }

      if (data?.alternatives) {
        setSuggestions(prev => ({
          ...prev,
          [requirementKey]: {
            ...prev[requirementKey],
            alternatives: [
              ...prev[requirementKey].alternatives,
              ...data.alternatives
            ].slice(0, 6) // Keep max 6 alternatives
          }
        }));

        toast({
          title: 'New Alternatives Added',
          description: `Generated ${data.alternatives.length} more options.`
        });
      }
    } catch (error: any) {
      console.error('[useSmartAnswers] Alternatives failed:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Could not generate alternatives',
        variant: 'destructive'
      });
    } finally {
      setLoadingAlternatives(prev => {
        const next = new Set(prev);
        next.delete(requirementKey);
        return next;
      });
    }
  }, [suggestions, loadingAlternatives, options.jobContext, toast]);

  const selectAnswer = useCallback((requirementKey: string, answer: string) => {
    setSuggestions(prev => {
      if (!prev[requirementKey]) return prev;
      return {
        ...prev,
        [requirementKey]: {
          ...prev[requirementKey],
          suggestedAnswer: answer
        }
      };
    });
  }, []);

  const provideFeedback = useCallback(async (
    requirementKey: string,
    feedbackType: 'helpful' | 'not_helpful',
    notes?: string
  ) => {
    // Log feedback for future model improvements
    console.log('[useSmartAnswers] Feedback:', { requirementKey, feedbackType, notes });
    
    // Could send to analytics or store in DB
    toast({
      title: 'Thanks for your feedback!',
      description: 'This helps us improve suggestions.'
    });
  }, [toast]);

  const clearSuggestion = useCallback((requirementKey: string) => {
    setSuggestions(prev => {
      const next = { ...prev };
      delete next[requirementKey];
      return next;
    });
  }, []);

  return {
    suggestions,
    loadingSuggestions,
    loadingAlternatives,
    generateSuggestion,
    generateMoreAlternatives,
    selectAnswer,
    provideFeedback,
    clearSuggestion
  };
}
