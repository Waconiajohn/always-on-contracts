/**
 * @deprecated This context is deprecated. Use useOptimizerStore from '@/stores/optimizerStore' instead.
 * This file is kept for backward compatibility during migration.
 */

import { createContext, useContext, ReactNode } from 'react';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { 
  OptimizerState, 
  OptimizerStep, 
  CustomizationSettings,
  ResumeVersion,
  HiringManagerReview
} from '../types';

// Legacy action types for compatibility
type OptimizerAction =
  | { type: 'SET_INPUT'; resumeText: string; jobDescription: string; jobTitle?: string; company?: string }
  | { type: 'SET_STEP'; step: OptimizerStep }
  | { type: 'SET_CAREER_PROFILE'; profile: any }
  | { type: 'CONFIRM_PROFILE' }
  | { type: 'SET_GAP_ANALYSIS'; analysis: any }
  | { type: 'SELECT_ANSWER'; requirementId: string; answer: string }
  | { type: 'SET_CUSTOMIZATION'; settings: CustomizationSettings }
  | { type: 'SET_RESUME_VERSIONS'; versions: ResumeVersion[] }
  | { type: 'SELECT_VERSION'; versionId: string }
  | { type: 'SELECT_TEMPLATE'; templateId: string; templateName: string }
  | { type: 'SET_HM_REVIEW'; review: HiringManagerReview }
  | { type: 'SET_PROCESSING'; isProcessing: boolean; message?: string }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

// Context interface wrapping Zustand store
interface OptimizerContextValue {
  state: OptimizerState;
  dispatch: (action: OptimizerAction) => void;
  goToStep: (step: OptimizerStep) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
}

const OptimizerContext = createContext<OptimizerContextValue | null>(null);

/**
 * @deprecated Use useOptimizerStore directly instead
 */
export function OptimizerProvider({ children }: { children: ReactNode }) {
  const store = useOptimizerStore();
  
  // Build state object from store - all fields from OptimizerState
  const state: OptimizerState = {
    resumeText: store.resumeText,
    jobDescription: store.jobDescription,
    jobTitle: store.jobTitle,
    company: store.company,
    fitBlueprint: store.fitBlueprint,
    missingBulletResponses: store.missingBulletResponses,
    customization: store.customization,
    benchmarkResume: store.benchmarkResume,
    selectedTemplate: store.selectedTemplate,
    hiringManagerReview: store.hiringManagerReview,
    versionHistory: store.versionHistory,
    currentStep: store.currentStep,
    isProcessing: store.isProcessing,
    processingMessage: store.processingMessage,
    error: store.error,
    // Legacy fields
    resumeVersions: store.resumeVersions,
    selectedVersionId: store.selectedVersionId,
    gapAnalysis: store.gapAnalysis,
    careerProfile: store.careerProfile,
    isProfileConfirmed: store.isProfileConfirmed,
    selectedAnswers: store.selectedAnswers,
  };
  
  // Dispatch adapter that maps legacy actions to Zustand store methods
  const dispatch = (action: OptimizerAction) => {
    switch (action.type) {
      case 'SET_INPUT':
        store.setInput(action.resumeText, action.jobDescription, action.jobTitle, action.company);
        break;
      case 'SET_STEP':
        store.setStep(action.step);
        break;
      case 'SET_CAREER_PROFILE':
        store.setCareerProfile(action.profile);
        break;
      case 'CONFIRM_PROFILE':
        store.confirmProfile();
        break;
      case 'SET_GAP_ANALYSIS':
        store.setGapAnalysis(action.analysis);
        break;
      case 'SELECT_ANSWER':
        store.addSelectedAnswer(action.requirementId, action.answer);
        break;
      case 'SET_CUSTOMIZATION':
        store.setCustomization(action.settings);
        break;
      case 'SET_RESUME_VERSIONS':
        store.setResumeVersions(action.versions);
        break;
      case 'SELECT_VERSION':
        store.selectVersion(action.versionId);
        break;
      case 'SELECT_TEMPLATE':
        store.selectTemplate({ id: action.templateId, name: action.templateName });
        break;
      case 'SET_HM_REVIEW':
        store.setHMReview(action.review);
        break;
      case 'SET_PROCESSING':
        store.setProcessing(action.isProcessing, action.message);
        break;
      case 'SET_ERROR':
        store.setError(action.error);
        break;
      case 'RESET':
        store.reset();
        break;
    }
  };
  
  return (
    <OptimizerContext.Provider value={{ 
      state, 
      dispatch, 
      goToStep: store.goToStep,
      goToNextStep: store.goToNextStep, 
      goToPrevStep: store.goToPrevStep 
    }}>
      {children}
    </OptimizerContext.Provider>
  );
}

/**
 * @deprecated Use useOptimizerStore directly instead
 */
export function useOptimizer() {
  const context = useContext(OptimizerContext);
  if (!context) {
    throw new Error('useOptimizer must be used within an OptimizerProvider');
  }
  return context;
}
