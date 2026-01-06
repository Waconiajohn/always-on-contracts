import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  OptimizerState, 
  OptimizerStep, 
  CareerProfile, 
  GapAnalysisResult,
  CustomizationSettings,
  ResumeVersion,
  HiringManagerReview,
  createInitialState 
} from '../types';

// Actions
type OptimizerAction =
  | { type: 'SET_INPUT'; resumeText: string; jobDescription: string; jobTitle?: string; company?: string }
  | { type: 'SET_STEP'; step: OptimizerStep }
  | { type: 'SET_CAREER_PROFILE'; profile: CareerProfile }
  | { type: 'CONFIRM_PROFILE' }
  | { type: 'SET_GAP_ANALYSIS'; analysis: GapAnalysisResult }
  | { type: 'SELECT_ANSWER'; requirementId: string; answer: string }
  | { type: 'SET_CUSTOMIZATION'; settings: CustomizationSettings }
  | { type: 'SET_RESUME_VERSIONS'; versions: ResumeVersion[] }
  | { type: 'SELECT_VERSION'; versionId: string }
  | { type: 'SELECT_TEMPLATE'; templateId: string; templateName: string }
  | { type: 'SET_HM_REVIEW'; review: HiringManagerReview }
  | { type: 'SET_PROCESSING'; isProcessing: boolean; message?: string }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

function optimizerReducer(state: OptimizerState, action: OptimizerAction): OptimizerState {
  switch (action.type) {
    case 'SET_INPUT':
      return {
        ...state,
        resumeText: action.resumeText,
        jobDescription: action.jobDescription,
        jobTitle: action.jobTitle,
        company: action.company
      };
    
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    
    case 'SET_CAREER_PROFILE':
      return { ...state, careerProfile: action.profile };
    
    case 'CONFIRM_PROFILE':
      return { ...state, isProfileConfirmed: true };
    
    case 'SET_GAP_ANALYSIS':
      return { ...state, gapAnalysis: action.analysis };
    
    case 'SELECT_ANSWER':
      return {
        ...state,
        selectedAnswers: {
          ...state.selectedAnswers,
          [action.requirementId]: action.answer
        }
      };
    
    case 'SET_CUSTOMIZATION':
      return { ...state, customization: action.settings };
    
    case 'SET_RESUME_VERSIONS':
      return { ...state, resumeVersions: action.versions };
    
    case 'SELECT_VERSION':
      return { ...state, selectedVersionId: action.versionId };
    
    case 'SELECT_TEMPLATE':
      return { 
        ...state, 
        selectedTemplate: { id: action.templateId, name: action.templateName } 
      };
    
    case 'SET_HM_REVIEW':
      return { ...state, hiringManagerReview: action.review };
    
    case 'SET_PROCESSING':
      return { 
        ...state, 
        isProcessing: action.isProcessing, 
        processingMessage: action.message || '' 
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.error };
    
    case 'RESET':
      return createInitialState();
    
    default:
      return state;
  }
}

// Context
interface OptimizerContextValue {
  state: OptimizerState;
  dispatch: React.Dispatch<OptimizerAction>;
  
  // Convenience methods
  goToStep: (step: OptimizerStep) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
}

const OptimizerContext = createContext<OptimizerContextValue | null>(null);

const STEP_ORDER: OptimizerStep[] = [
  'career-profile',
  'gap-analysis',
  'answer-assistant',
  'customization',
  'strategic-versions',
  'hiring-manager'
];

export function OptimizerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(optimizerReducer, createInitialState());
  
  const goToStep = (step: OptimizerStep) => {
    dispatch({ type: 'SET_STEP', step });
  };
  
  const goToNextStep = () => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      dispatch({ type: 'SET_STEP', step: STEP_ORDER[currentIndex + 1] });
    }
  };
  
  const goToPrevStep = () => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    if (currentIndex > 0) {
      dispatch({ type: 'SET_STEP', step: STEP_ORDER[currentIndex - 1] });
    }
  };
  
  return (
    <OptimizerContext.Provider value={{ state, dispatch, goToStep, goToNextStep, goToPrevStep }}>
      {children}
    </OptimizerContext.Provider>
  );
}

export function useOptimizer() {
  const context = useContext(OptimizerContext);
  if (!context) {
    throw new Error('useOptimizer must be used within an OptimizerProvider');
  }
  return context;
}
