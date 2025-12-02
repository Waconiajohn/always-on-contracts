import { useState } from 'react';
import { invokeEdgeFunction } from '@/lib/edgeFunction';

interface KeywordSuggestion {
  keyword: string;
  relevance: string;
  reason: string;
  suggestedPlacement: string;
  naturalPhrasing: string;
}

interface LikeKindSuggestion {
  candidateHas: string;
  jobRequires: string;
  suggestion: string;
  reasoning: string;
}

interface AlternativeVersions {
  conservative: string;
  moderate: string;
  aggressive: string;
}

export interface RefinementSuggestions {
  keywordsToAdd: KeywordSuggestion[];
  likeKindSuggestions: LikeKindSuggestion[];
  alternativeVersions: AlternativeVersions;
  comparison?: {
    original: string;
    enhanced: string;
    differences: string[];
  };
  gapFillingGuidance?: string;
  metricsToAdd?: string[];
}

interface UseRefinementSuggestionsProps {
  bulletText: string;
  originalText?: string;
  jobDescription?: string;
  requirement?: string;
  userExperience?: any;
}

export function useRefinementSuggestions({
  bulletText,
  originalText,
  jobDescription,
  requirement,
  userExperience
}: UseRefinementSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<RefinementSuggestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = async () => {
    if (!bulletText || !jobDescription) return;

    setIsLoading(true);
    try {
      const { data, error } = await invokeEdgeFunction<{ suggestions: RefinementSuggestions }>(
        'get-refinement-suggestions',
        {
          bulletText,
          originalText,
          jobDescription,
          requirement,
          userExperience
        }
      );

      if (error || !data) {
        throw new Error('Failed to fetch suggestions');
      }

      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error fetching refinement suggestions:', error);
      setSuggestions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions(null);
  };

  return {
    suggestions,
    isLoading,
    fetchSuggestions,
    clearSuggestions
  };
}
