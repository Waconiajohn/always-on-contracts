/**
 * useResumeBuilderState - Central state management for V8 Resume Builder
 * Handles all state transitions, API calls, and persistence
 */

import { useReducer, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useToast } from '@/hooks/use-toast';
import {
  V8_STEPS,
  createInitialState,
  type V8BuilderState,
  type V8Action,
  type V8Step,
  type SectionType,
  type EvidenceMatrixResult,
  type JobRequirement
} from '../types';

// ============================================================================
// REDUCER
// ============================================================================

function reducer(state: V8BuilderState, action: V8Action): V8BuilderState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };

    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: new Set([...state.completedSteps, action.step])
      };

    case 'SET_EVIDENCE_MATRIX':
      return { 
        ...state, 
        evidenceMatrix: action.result,
        isDirty: true
      };

    case 'TOGGLE_EVIDENCE_SELECTION':
      if (!state.evidenceMatrix) return state;
      return {
        ...state,
        evidenceMatrix: {
          ...state.evidenceMatrix,
          matches: state.evidenceMatrix.matches.map(m =>
            m.milestoneId === action.matchId
              ? { ...m, isSelected: !m.isSelected }
              : m
          )
        },
        isDirty: true
      };

    case 'UPDATE_SECTION_CONTENT': {
      const section = state.sections[action.sectionId];
      const wordCount = action.content.trim().split(/\s+/).filter(Boolean).length;
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.sectionId]: {
            ...section,
            content: action.content,
            wordCount,
            isModified: action.content !== section.originalContent
          }
        },
        isDirty: true
      };
    }

    case 'MARK_SECTION_COMPLETE':
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.sectionId]: {
            ...state.sections[action.sectionId],
            isComplete: true
          }
        }
      };

    case 'UPDATE_SCORE':
      return {
        ...state,
        previousScore: state.currentScore,
        currentScore: action.score,
        scoreBreakdown: action.breakdown || state.scoreBreakdown
      };

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.isProcessing,
        processingMessage: action.message || ''
      };

    case 'SET_HUMANIZATION_RESULT':
      return { ...state, humanizationResult: action.result };

    case 'SET_ATS_AUDIT_RESULT':
      return { ...state, atsAuditResult: action.result };

    case 'SET_HM_REVIEW_RESULT':
      return { ...state, hmReviewResult: action.result };

    case 'MARK_DIRTY':
      return { ...state, isDirty: true };

    case 'MARK_SAVED':
      return { ...state, isDirty: false, lastSavedAt: new Date().toISOString() };

    case 'PREFILL_SECTIONS_FROM_EVIDENCE': {
      if (!state.evidenceMatrix) return state;
      
      // Group selected evidence by section type
      const selectedMatches = state.evidenceMatrix.matches.filter(m => m.isSelected);
      
      // Build experience section from selected evidence
      const experienceBullets = selectedMatches
        .map(m => m.enhancedBullet || m.originalBullet)
        .filter(Boolean)
        .join('\n• ');
      
      const experienceContent = experienceBullets ? `• ${experienceBullets}` : '';
      
      // Build skills from ATS keywords
      const skills = [...new Set(
        selectedMatches.flatMap(m => m.atsKeywords || [])
      )].join(', ');

      return {
        ...state,
        sections: {
          ...state.sections,
          experience: {
            ...state.sections.experience,
            content: state.sections.experience.content || experienceContent,
            originalContent: experienceContent
          },
          skills: {
            ...state.sections.skills,
            content: state.sections.skills.content || skills,
            originalContent: skills
          }
        }
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// HOOK
// ============================================================================

interface UseResumeBuilderStateOptions {
  initialData?: {
    resumeText: string;
    jobDescription: string;
    scoreResult?: any;
  };
}

export function useResumeBuilderState(options: UseResumeBuilderStateOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize state from options
  const initialState = createInitialState({
    resumeText: options.initialData?.resumeText || '',
    jobDescription: options.initialData?.jobDescription || '',
    initialScore: options.initialData?.scoreResult?.overallScore || 0,
    currentScore: options.initialData?.scoreResult?.overallScore || 0,
    scoreBreakdown: options.initialData?.scoreResult?.scores || undefined,
    tier: options.initialData?.scoreResult?.tier || undefined,
    gapAnalysis: options.initialData?.scoreResult?.gapAnalysis || null,
    detected: options.initialData?.scoreResult?.detected || { role: 'Professional', industry: 'General', level: 'Mid-Level' }
  });

  const [state, dispatch] = useReducer(reducer, initialState);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const goToStep = useCallback((step: V8Step) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

  const goToNextStep = useCallback(() => {
    const currentIndex = V8_STEPS.indexOf(state.currentStep);
    if (currentIndex < V8_STEPS.length - 1) {
      // When leaving evidence-matrix step, pre-fill sections from selected evidence
      if (state.currentStep === 'evidence-matrix' && state.evidenceMatrix) {
        dispatch({ type: 'PREFILL_SECTIONS_FROM_EVIDENCE' });
      }
      dispatch({ type: 'COMPLETE_STEP', step: state.currentStep });
      dispatch({ type: 'SET_STEP', step: V8_STEPS[currentIndex + 1] });
    }
  }, [state.currentStep, state.evidenceMatrix]);

  const goToPrevStep = useCallback(() => {
    const currentIndex = V8_STEPS.indexOf(state.currentStep);
    if (currentIndex > 0) {
      dispatch({ type: 'SET_STEP', step: V8_STEPS[currentIndex - 1] });
    }
  }, [state.currentStep]);

  // ============================================================================
  // API CALLS - EVIDENCE MATRIX
  // ============================================================================

  const fetchEvidenceMatrix = useCallback(async () => {
    if (!user?.id || !state.gapAnalysis) {
      console.warn('[V8] Cannot fetch evidence matrix: missing user or gap analysis');
      return;
    }

    dispatch({ type: 'SET_PROCESSING', isProcessing: true, message: 'Matching your experience to job requirements...' });

    try {
      // Extract requirements from gap analysis
      const jobRequirements: JobRequirement[] = [
        ...state.gapAnalysis.fullMatches.map((m, i) => ({ 
          id: `full-${i}`, 
          text: m.requirement, 
          priority: 'critical' as const,
          category: 'experience' as const
        })),
        ...state.gapAnalysis.partialMatches.map((m, i) => ({ 
          id: `partial-${i}`, 
          text: m.requirement, 
          priority: 'important' as const,
          category: 'skill' as const
        })),
        ...state.gapAnalysis.missingRequirements.map((m, i) => ({ 
          id: `missing-${i}`, 
          text: m.requirement, 
          priority: 'nice-to-have' as const,
          category: 'skill' as const
        }))
      ];

      const { data, error } = await invokeEdgeFunction('match-requirements-to-bullets', {
        userId: user.id,
        jobRequirements,
        atsKeywords: {
          critical: [], // Could extract from gap analysis
          important: []
        },
        // Fallback: Pass resume text for parsing if Career Vault is empty
        resumeText: state.resumeText
      });

      if (error) throw new Error(error.message);

      // Transform response to our format
      const result: EvidenceMatrixResult = {
        matches: (data?.evidenceMatrix || []).map((m: any) => ({
          ...m,
          isSelected: m.matchScore >= 60 // Auto-select strong matches
        })),
        unmatchedRequirements: jobRequirements.filter(
          req => !data?.evidenceMatrix?.some((m: any) => m.requirementId === req.id)
        ),
        stats: data?.stats || { totalRequirements: 0, matchedRequirements: 0, coverageScore: 0 }
      };

      dispatch({ type: 'SET_EVIDENCE_MATRIX', result });

      toast({
        title: 'Evidence matched!',
        description: `Found ${result.stats.matchedRequirements} matches from your Career Vault`
      });

    } catch (error: any) {
      console.error('[V8] Evidence matrix error:', error);
      toast({
        title: 'Matching failed',
        description: error.message || 'Could not match evidence',
        variant: 'destructive'
      });
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [user?.id, state.gapAnalysis, toast]);

  // ============================================================================
  // API CALLS - SECTION ENHANCEMENT
  // ============================================================================

  const enhanceSection = useCallback(async (
    sectionId: SectionType,
    enhancementType: 'expand' | 'ats-boost' | 'quantify' | 'benchmark'
  ): Promise<string | null> => {
    const section = state.sections[sectionId];
    
    dispatch({ type: 'SET_PROCESSING', isProcessing: true, message: `Enhancing ${section.title}...` });

    // Section-specific guidance tips
    const SECTION_GUIDANCE: Record<SectionType, string[]> = {
      summary: ['Lead with strongest achievement', 'Keep to 3-4 sentences', 'Include key skills from JD'],
      experience: ['Start with action verbs', 'Quantify achievements', 'Focus on impact and results'],
      skills: ['Include JD keywords', 'Group by category if needed', 'List certifications'],
      education: ['Most recent first', 'Include honors', 'Add relevant coursework'],
      certifications: ['Include dates', 'Show active status', 'Prioritize job-relevant ones']
    };

    try {
      // Get selected evidence for this section
      const selectedEvidence = state.evidenceMatrix?.matches.filter(m => m.isSelected) || [];
      
      // Build requirements list from gap analysis
      const requirements = [
        ...(state.gapAnalysis?.fullMatches?.map(m => m.requirement) || []),
        ...(state.gapAnalysis?.partialMatches?.map(m => m.requirement) || []),
        ...(state.gapAnalysis?.missingRequirements?.map(m => m.requirement) || [])
      ];

      const { data, error } = await invokeEdgeFunction('generate-dual-resume-section', {
        // Correct snake_case parameter names
        section_type: sectionId,
        section_guidance: SECTION_GUIDANCE[sectionId]?.join('. ') || '',
        job_analysis_research: state.jobDescription,
        
        // User context
        user_id: user?.id,
        
        // Role detection
        job_title: state.detected.role,
        industry: state.detected.industry,
        seniority: state.detected.level,
        
        // Enhancement type
        enhancement_type: enhancementType,
        
        // Content - use section content or fall back to original resume
        existing_resume: section.content || state.resumeText,
        
        // Evidence matrix (if available)
        evidenceMatrix: selectedEvidence.map(e => ({
          requirementId: e.requirementId,
          requirementText: e.requirementText,
          originalBullet: e.originalBullet,
          enhancedBullet: e.enhancedBullet,
          matchScore: e.matchScore
        })),
        
        // ATS keywords from gap analysis
        ats_keywords: {
          critical: state.gapAnalysis?.fullMatches?.map(m => m.requirement) || [],
          important: state.gapAnalysis?.partialMatches?.map(m => m.requirement) || [],
          nice_to_have: []
        },
        
        // Requirements
        requirements
      });

      if (error) throw new Error(error.message);

      // Handle response format - edge function returns idealVersion, personalizedVersion, blendVersion
      const enhancedContent = 
        data?.personalizedVersion?.content || 
        data?.blendVersion?.content || 
        data?.idealVersion?.content || 
        data?.enhancedContent ||
        null;

      return enhancedContent;

    } catch (error: any) {
      console.error('[V8] Enhancement error:', error);
      toast({
        title: 'Enhancement failed',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [user?.id, state.sections, state.jobDescription, state.detected, state.evidenceMatrix, state.gapAnalysis, state.resumeText, toast]);

  // ============================================================================
  // API CALLS - FINE-TUNE
  // ============================================================================

  const runHumanization = useCallback(async () => {
    const fullContent = Object.values(state.sections).map(s => s.content).join('\n\n');
    
    dispatch({ type: 'SET_PROCESSING', isProcessing: true, message: 'Humanizing content...' });

    try {
      const { data, error } = await invokeEdgeFunction('humanize-content', {
        content: fullContent
      });

      if (error) throw new Error(error.message);

      dispatch({ type: 'SET_HUMANIZATION_RESULT', result: data });

      return data;

    } catch (error: any) {
      console.error('[V8] Humanization error:', error);
      toast({
        title: 'Humanization failed',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.sections, toast]);

  const runATSAudit = useCallback(async () => {
    const fullContent = Object.values(state.sections).map(s => s.content).join('\n\n');
    
    dispatch({ type: 'SET_PROCESSING', isProcessing: true, message: 'Running ATS audit...' });

    try {
      const { data, error } = await invokeEdgeFunction('analyze-ats-score', {
        resumeContent: fullContent,
        jobDescription: state.jobDescription
      });

      if (error) throw new Error(error.message);

      dispatch({ type: 'SET_ATS_AUDIT_RESULT', result: data });

      return data;

    } catch (error: any) {
      console.error('[V8] ATS audit error:', error);
      toast({
        title: 'ATS audit failed',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.sections, state.jobDescription, toast]);

  const runHMReview = useCallback(async () => {
    const fullContent = Object.values(state.sections).map(s => s.content).join('\n\n');
    
    dispatch({ type: 'SET_PROCESSING', isProcessing: true, message: 'Simulating hiring manager review...' });

    try {
      const { data, error } = await invokeEdgeFunction('hiring-manager-final-polish', {
        resumeContent: fullContent,
        jobDescription: state.jobDescription,
        targetRole: state.detected.role
      });

      if (error) throw new Error(error.message);

      dispatch({ type: 'SET_HM_REVIEW_RESULT', result: data });

      return data;

    } catch (error: any) {
      console.error('[V8] HM review error:', error);
      toast({
        title: 'Review failed',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  }, [state.sections, state.jobDescription, state.detected.role, toast]);

  // ============================================================================
  // API CALLS - REAL-TIME SCORE
  // ============================================================================

  const recalculateScore = useCallback(async () => {
    const fullContent = Object.values(state.sections).map(s => s.content).join('\n\n');
    
    if (!fullContent.trim()) return;

    try {
      const { data, error } = await invokeEdgeFunction('instant-resume-score', {
        resumeText: fullContent,
        jobDescription: state.jobDescription
      });

      if (!error && data?.success) {
        dispatch({ 
          type: 'UPDATE_SCORE', 
          score: data.overallScore,
          breakdown: data.scores
        });
      }
    } catch (error) {
      console.error('[V8] Score recalculation error:', error);
      // Don't show toast for score updates - too noisy
    }
  }, [state.sections, state.jobDescription]);

  // Debounced score recalculation on content change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.isDirty && state.currentStep === 'build') {
        recalculateScore();
      }
    }, 2000); // Wait 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [state.isDirty, state.currentStep, recalculateScore]);

  // ============================================================================
  // CONTENT UPDATES
  // ============================================================================

  const updateSectionContent = useCallback((sectionId: SectionType, content: string) => {
    dispatch({ type: 'UPDATE_SECTION_CONTENT', sectionId, content });
  }, []);

  const markSectionComplete = useCallback((sectionId: SectionType) => {
    dispatch({ type: 'MARK_SECTION_COMPLETE', sectionId });
  }, []);

  const toggleEvidenceSelection = useCallback((matchId: string) => {
    dispatch({ type: 'TOGGLE_EVIDENCE_SELECTION', matchId });
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const getFullResumeContent = useCallback(() => {
    return Object.values(state.sections).map(s => s.content).join('\n\n');
  }, [state.sections]);

  const getCompletedSectionsCount = useCallback(() => {
    return Object.values(state.sections).filter(s => s.isComplete).length;
  }, [state.sections]);

  const canProceedFromStep = useCallback((step: V8Step): boolean => {
    switch (step) {
      case 'evidence-matrix':
        return state.evidenceMatrix !== null && state.evidenceMatrix.matches.some(m => m.isSelected);
      case 'build':
        return Object.values(state.sections).every(s => s.content.trim().length > 0);
      case 'fine-tune':
        return true; // Always can proceed
      case 'export':
        return true;
      default:
        return false;
    }
  }, [state.evidenceMatrix, state.sections]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    state,
    dispatch,

    // Navigation
    goToStep,
    goToNextStep,
    goToPrevStep,

    // API calls
    fetchEvidenceMatrix,
    enhanceSection,
    runHumanization,
    runATSAudit,
    runHMReview,
    recalculateScore,

    // Content updates
    updateSectionContent,
    markSectionComplete,
    toggleEvidenceSelection,

    // Computed
    getFullResumeContent,
    getCompletedSectionsCount,
    canProceedFromStep
  };
}
