// =====================================================
// RESUME BUILDER V3 - ZUSTAND STORE
// =====================================================
// Simple state management for the 4-step resume builder flow
// =====================================================

import { create } from "zustand";

// Types matching the edge function schemas
export interface FitAnalysisResult {
  fit_score: number;
  executive_summary: string;
  strengths: Array<{
    requirement: string;
    evidence: string;
    strength_level: "strong" | "moderate";
  }>;
  gaps: Array<{
    requirement: string;
    severity: "critical" | "moderate" | "minor";
    suggestion: string;
  }>;
  keywords_found: string[];
  keywords_missing: string[];
}

export interface StandardsResult {
  industry: string;
  profession: string;
  seniority_level: "entry" | "mid" | "senior" | "lead" | "executive";
  benchmarks: Array<{
    benchmark: string;
    candidate_status: "exceeds" | "meets" | "below";
    evidence: string;
    recommendation?: string;
  }>;
  industry_keywords: string[];
  power_phrases: string[];
  metrics_suggestions: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  purpose: string;
  gap_addressed: string;
  example_answer?: string;
  priority: "high" | "medium" | "low";
}

export interface QuestionsResult {
  questions: InterviewQuestion[];
  total_questions: number;
}

export interface OptimizedResume {
  header: {
    name: string;
    title: string;
    contact?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    dates: string;
    bullets: string[];
  }>;
  skills: string[];
  education?: Array<{
    institution: string;
    degree: string;
    year?: string;
  }>;
  certifications?: string[];
  ats_score: number;
  improvements_made: string[];
}

export type Step = 1 | 2 | 3 | 4;

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
};

export const useResumeBuilderV3Store = create<ResumeBuilderV3State>((set) => ({
  ...initialState,
  
  setResumeText: (text) => set({ resumeText: text }),
  setJobDescription: (text) => set({ jobDescription: text }),
  setStep: (step) => set({ step }),
  setFitAnalysis: (result) => set({ fitAnalysis: result }),
  setStandards: (result) => set({ standards: result }),
  setQuestions: (result) => set({ questions: result }),
  setInterviewAnswer: (questionId, answer) =>
    set((state) => ({
      interviewAnswers: { ...state.interviewAnswers, [questionId]: answer },
    })),
  setFinalResume: (resume) => set({ finalResume: resume }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
