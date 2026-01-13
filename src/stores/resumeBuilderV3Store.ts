// =====================================================
// RESUME BUILDER V3 - ZUSTAND STORE
// =====================================================
// Simple state management for the 4-step resume builder flow
// With session persistence to prevent data loss
// =====================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Import types from single source of truth
import type {
  FitAnalysisResult,
  StandardsResult,
  QuestionsResult,
  OptimizedResume,
  Step,
} from "@/types/resume-builder-v3";

// Re-export types for backward compatibility
export type {
  FitAnalysisResult,
  StandardsResult,
  QuestionsResult,
  OptimizedResume,
  Step,
} from "@/types/resume-builder-v3";

// Re-export InterviewQuestion separately (it's used in other places)
export type { InterviewQuestion } from "@/types/resume-builder-v3";

interface ResumeBuilderV3State {
  // Current step
  step: Step;
  
  // Inputs
  resumeText: string;
  jobDescription: string;
  
  // Results from each step
  fitAnalysis: FitAnalysisResult | null;
  standards: StandardsResult | null;
  questions: QuestionsResult | null;
  interviewAnswers: Record<string, string>;
  finalResume: OptimizedResume | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Session tracking
  lastUpdated: number | null;
  
  // Actions
  setResumeText: (text: string) => void;
  setJobDescription: (text: string) => void;
  setStep: (step: Step) => void;
  setFitAnalysis: (result: FitAnalysisResult) => void;
  setStandards: (result: StandardsResult) => void;
  setQuestions: (result: QuestionsResult) => void;
  setInterviewAnswer: (questionId: string, answer: string) => void;
  setFinalResume: (resume: OptimizedResume) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  hasActiveSession: () => boolean;
  getSessionAge: () => string;
}

const initialState = {
  step: 1 as Step,
  resumeText: "",
  jobDescription: "",
  fitAnalysis: null,
  standards: null,
  questions: null,
  interviewAnswers: {},
  finalResume: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const useResumeBuilderV3Store = create<ResumeBuilderV3State>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setResumeText: (text) => set({ resumeText: text, lastUpdated: Date.now() }),
      setJobDescription: (text) => set({ jobDescription: text, lastUpdated: Date.now() }),
      setStep: (step) => set({ step, lastUpdated: Date.now() }),
      setFitAnalysis: (result) => set({ fitAnalysis: result, lastUpdated: Date.now() }),
      setStandards: (result) => set({ standards: result, lastUpdated: Date.now() }),
      setQuestions: (result) => set({ questions: result, lastUpdated: Date.now() }),
      setInterviewAnswer: (questionId, answer) =>
        set((state) => ({
          interviewAnswers: { ...state.interviewAnswers, [questionId]: answer },
          lastUpdated: Date.now(),
        })),
      setFinalResume: (resume) => set({ finalResume: resume, lastUpdated: Date.now() }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
      
      hasActiveSession: () => {
        const state = get();
        return !!(state.resumeText || state.jobDescription || state.fitAnalysis);
      },
      
      getSessionAge: () => {
        const state = get();
        if (!state.lastUpdated) return "Unknown";
        
        const now = Date.now();
        const diff = now - state.lastUpdated;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return "Just now";
      },
    }),
    {
      name: 'resume-builder-v3',
      partialize: (state) => ({
        step: state.step,
        resumeText: state.resumeText,
        jobDescription: state.jobDescription,
        fitAnalysis: state.fitAnalysis,
        standards: state.standards,
        questions: state.questions,
        interviewAnswers: state.interviewAnswers,
        finalResume: state.finalResume, // Persist final resume to prevent loss on refresh
        lastUpdated: state.lastUpdated,
        // Don't persist: isLoading, error (transient states)
      }),
      // Handle storage errors gracefully (e.g., quota exceeded)
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Failed to rehydrate resume-builder-v3 store:', error);
          // Clear corrupted data to prevent persistent failures
          try {
            localStorage.removeItem('resume-builder-v3');
          } catch {
            // Ignore if we can't clear
          }
        }
      },
    }
  )
);
