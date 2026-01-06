/**
 * SmartGapAnalysis - Gap analysis with AI-powered suggestions wired up
 */

import { useState, useCallback } from 'react';
import { GapAnalysisDisplayV2, type GapAnalysisData, type GapAnalysisItem } from './GapAnalysisDisplayV2';
import { useSmartAnswers } from '@/hooks/useSmartAnswers';

interface SmartGapAnalysisProps {
  gapAnalysis: GapAnalysisData;
  jobContext?: {
    title?: string;
    company?: string;
  };
  onSuggestionSelected?: (category: string, index: number, answer: string) => void;
  className?: string;
}

export function SmartGapAnalysis({
  gapAnalysis,
  jobContext,
  onSuggestionSelected,
  className
}: SmartGapAnalysisProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, Set<number>>>({});
  const [editedLanguage, setEditedLanguage] = useState<Record<string, Record<number, string>>>({});

  const {
    suggestions,
    loadingSuggestions,
    loadingAlternatives,
    generateSuggestion,
    generateMoreAlternatives,
    selectAnswer,
    provideFeedback
  } = useSmartAnswers({ jobContext });

  // Get the requirement item from gap analysis
  const getRequirementItem = useCallback((
    category: 'highlyQualified' | 'partiallyQualified' | 'experienceGaps',
    index: number
  ): GapAnalysisItem | undefined => {
    return gapAnalysis[category]?.[index];
  }, [gapAnalysis]);

  // Handle requesting AI suggestions
  const handleRequestAISuggestions = useCallback((category: string, index: number) => {
    const requirementKey = `${category}-${index}`;
    const categoryKey = category as 'highlyQualified' | 'partiallyQualified' | 'experienceGaps';
    const item = getRequirementItem(categoryKey, index);
    
    if (!item) return;

    generateSuggestion(
      requirementKey,
      item.requirement,
      categoryKey,
      item.explanation || item.gap,
      // Could pass vault matches here if available
      undefined
    );
  }, [getRequirementItem, generateSuggestion]);

  // Handle selecting an AI answer
  const handleSelectAIAnswer = useCallback((suggestionId: string, answer: string) => {
    selectAnswer(suggestionId, answer);
    
    // Parse the suggestionId to get category and index
    const [category, indexStr] = suggestionId.split('-');
    const index = parseInt(indexStr, 10);
    
    if (category && !isNaN(index)) {
      onSuggestionSelected?.(category, index, answer);
    }
  }, [selectAnswer, onSuggestionSelected]);

  // Handle requesting more alternatives
  const handleRequestAlternatives = useCallback((suggestionId: string) => {
    generateMoreAlternatives(suggestionId);
  }, [generateMoreAlternatives]);

  // Handle feedback
  const handleProvideFeedback = useCallback((suggestionId: string, feedbackType: string) => {
    provideFeedback(
      suggestionId,
      feedbackType as 'helpful' | 'not_helpful'
    );
  }, [provideFeedback]);

  // Handle manual editing
  const handleEditSuggestion = useCallback((category: string, index: number, newLanguage: string) => {
    setEditedLanguage(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [index]: newLanguage
      }
    }));
  }, []);

  // Handle manual selection
  const handleSelectSuggestion = useCallback((category: string, index: number, selected: boolean) => {
    setSelectedSuggestions(prev => {
      const categorySet = new Set(prev[category] || []);
      if (selected) {
        categorySet.add(index);
      } else {
        categorySet.delete(index);
      }
      return {
        ...prev,
        [category]: categorySet
      };
    });
  }, []);

  // Merge edited language into gap analysis
  const mergedGapAnalysis: GapAnalysisData = {
    highlyQualified: gapAnalysis.highlyQualified.map((item, idx) => ({
      ...item,
      suggestedLanguage: editedLanguage['highlyQualified']?.[idx] ?? item.suggestedLanguage
    })),
    partiallyQualified: gapAnalysis.partiallyQualified.map((item, idx) => ({
      ...item,
      suggestedLanguage: editedLanguage['partiallyQualified']?.[idx] ?? item.suggestedLanguage
    })),
    experienceGaps: gapAnalysis.experienceGaps.map((item, idx) => ({
      ...item,
      suggestedLanguage: editedLanguage['experienceGaps']?.[idx] ?? item.suggestedLanguage
    }))
  };

  return (
    <GapAnalysisDisplayV2
      gapAnalysis={mergedGapAnalysis}
      aiSuggestions={suggestions}
      onEditSuggestion={handleEditSuggestion}
      onSelectSuggestion={handleSelectSuggestion}
      selectedSuggestions={selectedSuggestions}
      onRequestAISuggestions={handleRequestAISuggestions}
      onSelectAIAnswer={handleSelectAIAnswer}
      onRequestAlternatives={handleRequestAlternatives}
      onProvideFeedback={handleProvideFeedback}
      loadingAISuggestions={loadingSuggestions}
      loadingAlternatives={loadingAlternatives}
      className={className}
    />
  );
}

export default SmartGapAnalysis;
