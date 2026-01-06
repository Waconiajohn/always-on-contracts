import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  OptimizerState, 
  OptimizerStep, 
  CareerProfile, 
  GapAnalysisResult, 
  CustomizationSettings, 
  ResumeVersion,
  VersionHistoryEntry,
  createInitialState
} from '@/components/resume-optimizer/types';

interface OptimizerStore extends OptimizerState {
  sessionId: string | null;
  lastSaved: number | null;
  
  // Actions
  setInput: (resumeText: string, jobDescription: string, jobTitle?: string, company?: string) => void;
  setStep: (step: OptimizerStep) => void;
  setCareerProfile: (profile: CareerProfile) => void;
  setGapAnalysis: (analysis: GapAnalysisResult) => void;
  addSelectedAnswer: (questionId: string, answer: string) => void;
  setCustomization: (customization: CustomizationSettings) => void;
  setResumeVersions: (versions: ResumeVersion[]) => void;
  selectVersion: (versionId: string) => void;
  selectTemplate: (template: { id: string; name: string }) => void;
  updateSection: (versionId: string, sectionId: string, content: string[]) => void;
  setProcessing: (isProcessing: boolean, message?: string) => void;
  addVersionHistory: (entry: Omit<VersionHistoryEntry, 'id' | 'timestamp'>) => void;
  restoreVersion: (historyId: string) => void;
  
  // Session management
  hasActiveSession: () => boolean;
  clearSession: () => void;
  getSessionAge: () => string | null;
}

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

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
        const state = get();
        // Add to version history when moving to a new step
        if (state.selectedVersionId && state.resumeVersions.length > 0) {
          const currentVersion = state.resumeVersions.find(v => v.id === state.selectedVersionId);
          if (currentVersion) {
            const historyEntry: VersionHistoryEntry = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              stepCompleted: state.currentStep,
              versionSnapshot: JSON.parse(JSON.stringify(currentVersion)),
              changeDescription: `Completed ${state.currentStep} step`
            };
            set({ 
              currentStep: step, 
              lastSaved: Date.now(),
              versionHistory: [...state.versionHistory.slice(-9), historyEntry]
            });
            return;
          }
        }
        set({ currentStep: step, lastSaved: Date.now() });
      },
      
      setCareerProfile: (profile) => set({ careerProfile: profile, lastSaved: Date.now() }),
      
      setGapAnalysis: (analysis) => set({ gapAnalysis: analysis, lastSaved: Date.now() }),
      
      addSelectedAnswer: (questionId, answer) => set(state => ({
        selectedAnswers: { ...state.selectedAnswers, [questionId]: answer },
        lastSaved: Date.now()
      })),
      
      setCustomization: (customization) => set({ customization, lastSaved: Date.now() }),
      
      setResumeVersions: (versions) => set({ 
        resumeVersions: versions, 
        selectedVersionId: versions[0]?.id,
        lastSaved: Date.now() 
      }),
      
      selectVersion: (versionId) => set({ selectedVersionId: versionId, lastSaved: Date.now() }),
      
      selectTemplate: (template) => set({ selectedTemplate: template, lastSaved: Date.now() }),
      
      updateSection: (versionId, sectionId, content) => set(state => ({
        resumeVersions: state.resumeVersions.map(v => 
          v.id === versionId 
            ? {
                ...v,
                sections: v.sections.map(s => 
                  s.id === sectionId ? { ...s, content } : s
                )
              }
            : v
        ),
        lastSaved: Date.now()
      })),
      
      setProcessing: (isProcessing, message) => set({ 
        isProcessing, 
        processingMessage: message || '' 
      }),
      
      addVersionHistory: (entry) => set(state => ({
        versionHistory: [
          ...state.versionHistory.slice(-9),
          {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: Date.now()
          }
        ],
        lastSaved: Date.now()
      })),
      
      restoreVersion: (historyId) => {
        const state = get();
        const historyEntry = state.versionHistory.find(h => h.id === historyId);
        if (!historyEntry) return;
        
        const restoredVersion: ResumeVersion = {
          ...historyEntry.versionSnapshot,
          id: crypto.randomUUID(),
          name: `${historyEntry.versionSnapshot.name} (Restored)`
        };
        
        set({
          resumeVersions: [...state.resumeVersions, restoredVersion],
          selectedVersionId: restoredVersion.id,
          lastSaved: Date.now()
        });
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
    }),
    {
      name: 'resume-optimizer-session',
      partialize: (state) => ({
        resumeText: state.resumeText,
        jobDescription: state.jobDescription,
        jobTitle: state.jobTitle,
        company: state.company,
        careerProfile: state.careerProfile,
        gapAnalysis: state.gapAnalysis,
        selectedAnswers: state.selectedAnswers,
        customization: state.customization,
        resumeVersions: state.resumeVersions,
        selectedVersionId: state.selectedVersionId,
        selectedTemplate: state.selectedTemplate,
        versionHistory: state.versionHistory,
        currentStep: state.currentStep,
        sessionId: state.sessionId,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
