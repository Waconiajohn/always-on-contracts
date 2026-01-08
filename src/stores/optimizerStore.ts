import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  OptimizerState, 
  OptimizerStep, 
  FitBlueprint,
  BenchmarkResume,
  CustomizationSettings, 
  ResumeVersion,
  HiringManagerReview,
  VersionHistoryEntry,
  StagedBullet,
  createInitialState,
  STEP_ORDER
} from '@/components/resume-optimizer/types';

interface OptimizerStore extends OptimizerState {
  sessionId: string | null;
  lastSaved: number | null;
  
  // Actions
  setInput: (resumeText: string, jobDescription: string, jobTitle?: string, company?: string) => void;
  setStep: (step: OptimizerStep) => void;
  
  // Pass 1: Fit Blueprint
  setFitBlueprint: (blueprint: FitBlueprint) => void;
  
  // Step 2: Missing Bullet Responses
  addMissingBulletResponse: (bulletId: string, response: string) => void;
  clearMissingBulletResponses: () => void;
  
  // Step 2: Staged Bullets
  addStagedBullet: (bullet: StagedBullet) => void;
  removeStagedBullet: (index: number) => void;
  clearStagedBullets: () => void;
  
  // Step 3: Customization
  setCustomization: (customization: CustomizationSettings) => void;
  
  // Pass 2: Benchmark Resume
  setBenchmarkResume: (resume: BenchmarkResume) => void;
  updateBenchmarkSection: (sectionId: string, content: string[]) => void;
  selectTemplate: (template: { id: string; name: string }) => void;
  
  // Step 5: Hiring Manager Review
  setHMReview: (review: HiringManagerReview) => void;
  
  // UI State
  setProcessing: (isProcessing: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  
  // Version History
  addVersionHistory: (entry: Omit<VersionHistoryEntry, 'id' | 'timestamp'>) => void;
  
  // Reset
  reset: () => void;
  
  // Navigation
  goToStep: (step: OptimizerStep) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  
  // Session management
  hasActiveSession: () => boolean;
  clearSession: () => void;
  getSessionAge: () => string | null;
  
  // Legacy actions (for backwards compatibility)
  setCareerProfile: (profile: any) => void;
  confirmProfile: () => void;
  setGapAnalysis: (analysis: any) => void;
  addSelectedAnswer: (questionId: string, answer: string) => void;
  setResumeVersions: (versions: ResumeVersion[]) => void;
  selectVersion: (versionId: string) => void;
  updateSection: (versionId: string, sectionId: string, content: string[]) => void;
  restoreVersion: (historyId: string) => void;
}

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_VERSION_HISTORY = 20;

export const useOptimizerStore = create<OptimizerStore>()(
  persist(
    (set, get) => ({
      // Initial state from types
      ...createInitialState(),
      sessionId: null,
      lastSaved: null,
      
      // Actions
      setInput: (resumeText, jobDescription, jobTitle, company) => {
        const sessionId = get().sessionId || crypto.randomUUID();
        set({ 
          resumeText, 
          jobDescription, 
          jobTitle, 
          company,
          sessionId,
          lastSaved: Date.now() 
        });
      },
      
      setStep: (step) => {
        set({ currentStep: step, lastSaved: Date.now() });
      },
      
      // Pass 1: Fit Blueprint
      setFitBlueprint: (blueprint) => set({ 
        fitBlueprint: blueprint, 
        lastSaved: Date.now() 
      }),
      
      // Step 2: Missing Bullet Responses
      addMissingBulletResponse: (bulletId, response) => set(state => ({
        missingBulletResponses: { ...state.missingBulletResponses, [bulletId]: response },
        lastSaved: Date.now()
      })),
      
      clearMissingBulletResponses: () => set({ 
        missingBulletResponses: {}, 
        lastSaved: Date.now() 
      }),
      
      // Step 2: Staged Bullets
      addStagedBullet: (bullet) => set(state => ({
        stagedBullets: [...state.stagedBullets, bullet],
        lastSaved: Date.now()
      })),
      
      removeStagedBullet: (index) => set(state => ({
        stagedBullets: state.stagedBullets.filter((_, i) => i !== index),
        lastSaved: Date.now()
      })),
      
      clearStagedBullets: () => set({ 
        stagedBullets: [], 
        lastSaved: Date.now() 
      }),
      
      // Step 3: Customization
      setCustomization: (customization) => set({ 
        customization, 
        lastSaved: Date.now() 
      }),
      
      // Pass 2: Benchmark Resume
      setBenchmarkResume: (resume) => set({ 
        benchmarkResume: resume, 
        lastSaved: Date.now() 
      }),
      
      updateBenchmarkSection: (sectionId, content) => set(state => {
        if (!state.benchmarkResume) return state;
        return {
          benchmarkResume: {
            ...state.benchmarkResume,
            sections: state.benchmarkResume.sections.map(s => 
              s.id === sectionId ? { ...s, content, isEdited: true } : s
            )
          },
          lastSaved: Date.now()
        };
      }),
      
      selectTemplate: (template) => set({ 
        selectedTemplate: template, 
        lastSaved: Date.now() 
      }),
      
      // Step 5: Hiring Manager Review
      setHMReview: (review) => set({ 
        hiringManagerReview: review, 
        lastSaved: Date.now() 
      }),
      
      // UI State
      setProcessing: (isProcessing, message) => set({ 
        isProcessing, 
        processingMessage: message || '' 
      }),
      
      setError: (error) => set({ error }),
      
      // Version History
      addVersionHistory: (entry) => set(state => {
        const newEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        };
        const trimmedHistory = state.versionHistory.length >= MAX_VERSION_HISTORY
          ? [state.versionHistory[0], ...state.versionHistory.slice(-(MAX_VERSION_HISTORY - 2)), newEntry]
          : [...state.versionHistory, newEntry];
        
        return {
          versionHistory: trimmedHistory,
          lastSaved: Date.now()
        };
      }),
      
      reset: () => set({
        ...createInitialState(),
        sessionId: null,
        lastSaved: null,
      }),
      
      // Navigation helpers
      goToStep: (step) => {
        get().setStep(step);
      },
      
      goToNextStep: () => {
        const { currentStep } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex < STEP_ORDER.length - 1) {
          get().setStep(STEP_ORDER[currentIndex + 1]);
        }
      },
      
      goToPrevStep: () => {
        const { currentStep } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex > 0) {
          get().setStep(STEP_ORDER[currentIndex - 1]);
        }
      },
      
      // Session management
      hasActiveSession: () => {
        const { lastSaved, resumeText, jobDescription } = get();
        if (!lastSaved || !resumeText || !jobDescription) return false;
        const age = Date.now() - lastSaved;
        return age < SESSION_EXPIRY_MS;
      },
      
      clearSession: () => set({
        ...createInitialState(),
        sessionId: null,
        lastSaved: null,
      }),
      
      getSessionAge: () => {
        const { lastSaved } = get();
        if (!lastSaved) return null;
        const age = Date.now() - lastSaved;
        const hours = Math.floor(age / (1000 * 60 * 60));
        const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m ago`;
        return `${minutes}m ago`;
      },
      
      // Legacy actions (for backwards compatibility)
      setCareerProfile: (profile) => set({ careerProfile: profile, lastSaved: Date.now() }),
      confirmProfile: () => set({ isProfileConfirmed: true, lastSaved: Date.now() }),
      setGapAnalysis: (analysis) => set({ gapAnalysis: analysis, lastSaved: Date.now() }),
      addSelectedAnswer: (questionId, answer) => set(state => ({
        selectedAnswers: { ...state.selectedAnswers, [questionId]: answer },
        lastSaved: Date.now()
      })),
      setResumeVersions: (versions) => set({ 
        resumeVersions: versions, 
        selectedVersionId: versions[0]?.id,
        lastSaved: Date.now() 
      }),
      selectVersion: (versionId) => set({ selectedVersionId: versionId, lastSaved: Date.now() }),
      updateSection: (versionId, sectionId, content) => set(state => ({
        resumeVersions: state.resumeVersions.map(v => 
          v.id === versionId 
            ? {
                ...v,
                sections: v.sections.map(s => 
                  s.id === sectionId ? { ...s, content, isEdited: true } : s
                )
              }
            : v
        ),
        lastSaved: Date.now()
      })),
      restoreVersion: (historyId) => {
        const state = get();
        const historyEntry = state.versionHistory.find(h => h.id === historyId);
        if (!historyEntry) return;
        
        // Restore the state from the history entry
        set({
          currentStep: historyEntry.stepCompleted,
          fitBlueprint: historyEntry.fitBlueprint || state.fitBlueprint,
          benchmarkResume: historyEntry.benchmarkResume || state.benchmarkResume,
          lastSaved: Date.now()
        });
      },
    }),
    {
      name: 'resume-optimizer-session',
      partialize: (state) => ({
        resumeText: state.resumeText,
        jobDescription: state.jobDescription,
        jobTitle: state.jobTitle,
        company: state.company,
        fitBlueprint: state.fitBlueprint,
        missingBulletResponses: state.missingBulletResponses,
        stagedBullets: state.stagedBullets,
        customization: state.customization,
        benchmarkResume: state.benchmarkResume,
        selectedTemplate: state.selectedTemplate,
        hiringManagerReview: state.hiringManagerReview,
        versionHistory: state.versionHistory,
        currentStep: state.currentStep,
        sessionId: state.sessionId,
        lastSaved: state.lastSaved,
        // Note: Legacy state no longer persisted to reduce localStorage bloat
      }),
    }
  )
);
