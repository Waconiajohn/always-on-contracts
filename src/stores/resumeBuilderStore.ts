import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { showContextualError, showContextualSuccess } from '@/lib/utils/contextualErrors';
import { logger } from '@/lib/logger';

// Resume milestone type for master resume integration
export interface ResumeMilestone {
  id: string;
  master_resume_id: string;
  milestone_text: string;
  milestone_type: string;
  work_position_id?: string | null;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}

// Resume overlay types for tracking resume-only items
export interface ResumeOverlayState {
  resumeOnlyItems: any[];
  pendingPromotions: any[];
}

const createEmptyResumeOverlay = (): ResumeOverlayState => ({
  resumeOnlyItems: [],
  pendingPromotions: [],
});

// Edge function imports removed - Master Resume uses direct database access

export interface ResumeSection {
  id: string;
  title: string;
  content: any;
  type: string;
  order: number;
}

export interface GeneratedOption {
  id: string;
  content: string;
  resumeItemsUsed: string[];
  atsScore: number;
}

export interface Requirement {
  id: string;
  text: string;
  source: string;
  priority: 'critical' | 'important' | 'nice_to_have';
  atsKeywords: string[];
}

export interface RequirementResponse {
  requirement: Requirement;
  answers: Record<string, any>;
  voiceContext?: string;
  selectedOption: number;
  editedContent: string;
  options: GeneratedOption[];
  timestamp: Date;
}

interface CategorizedRequirements {
  autoHandled: Requirement[];
  needsInput: Requirement[];
  optionalEnhancement: Requirement[];
}

interface ResumeBuilderState {
  // Wizard state
  currentStep: 'job-input' | 'gap-analysis' | 'format-selection' | 'requirement-filter' | 'requirement-builder' | 'section-wizard' | 'generation' | 'hiring-manager-review' | 'ats-score-report' | 'final-review';
  currentRequirementIndex: number;
  currentSectionIndex: number;
  generationMode: 'full' | 'section-by-section' | null;
  
  // Job data
  jobAnalysis: any | null;
  displayJobText: string;
  
  // Resume data from master resume
  resumeMatches: any | null;
  resumeMilestones: ResumeMilestone[];
  
  // Resume overlay (sandbox layer)
  resumeOverlay: ResumeOverlayState;
  
  // ATS scoring
  atsScoreData?: any;
  analyzingATS: boolean;
  
  // Requirements
  categorizedRequirements: CategorizedRequirements;
  requirementResponses: RequirementResponse[];
  
  // Resume data
  selectedFormat: string | null;
  resumeSections: ResumeSection[];
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  
  // UI state
  resumeMode: 'edit' | 'preview';
  showPreviewModal: boolean;
  resumeId: string | null;
  
  // Loading states
  analyzing: boolean;
  matching: boolean;
  generatingSection: string | null;
  
  // Actions
  setCurrentStep: (step: ResumeBuilderState['currentStep']) => void;
  setCurrentRequirementIndex: (index: number) => void;
  setCurrentSectionIndex: (index: number) => void;
  setGenerationMode: (mode: 'full' | 'section-by-section' | null) => void;
  setJobAnalysis: (analysis: any) => void;
  setDisplayJobText: (text: string) => void;
  setResumeMatches: (matches: any) => void;
  setResumeMilestones: (milestones: ResumeMilestone[]) => void;
  setCategorizedRequirements: (reqs: CategorizedRequirements) => void;
  addRequirementResponse: (response: RequirementResponse) => void;
  setSelectedFormat: (format: string) => void;
  setResumeSections: (sections: ResumeSection[]) => void;
  updateSection: (sectionId: string, content: any) => void;
  setContactInfo: (info: any) => void;
  setResumeMode: (mode: 'edit' | 'preview') => void;
  setShowPreviewModal: (show: boolean) => void;
  setResumeId: (id: string | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setMatching: (matching: boolean) => void;
  setGeneratingSection: (section: string | null) => void;
  
  // ATS scoring actions
  setAtsScoreData: (data: any) => void;
  setAnalyzingATS: (analyzing: boolean) => void;
  
  // Resume overlay actions
  addGapSuggestion: (payload: any, meta?: any) => void;
  useSuggestionInResumeOnly: (itemId: string) => void;
  promoteToMasterResume: (itemId: string) => void;
  rejectSuggestion: (itemId: string) => void;
  commitPromotions: () => Promise<void>;
  
  // Persistence
  saveResume: () => Promise<void>;
  loadResume: (resumeId: string) => Promise<void>;
  resetBuilder: () => void;
}

export const useResumeBuilderStore = create<ResumeBuilderState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 'job-input',
      currentRequirementIndex: 0,
      currentSectionIndex: 0,
      generationMode: null,
      jobAnalysis: null,
      displayJobText: '',
      resumeMatches: null,
      resumeMilestones: [],
      resumeOverlay: createEmptyResumeOverlay(),
      categorizedRequirements: {
        autoHandled: [],
        needsInput: [],
        optionalEnhancement: []
      },
      requirementResponses: [],
      selectedFormat: null,
      resumeSections: [],
      contactInfo: {
        name: '',
        email: '',
        phone: '',
        location: ''
      },
      resumeMode: 'edit',
      showPreviewModal: false,
      resumeId: null,
      analyzing: false,
      matching: false,
      generatingSection: null,
      atsScoreData: undefined,
      analyzingATS: false,
      
      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),
      setCurrentRequirementIndex: (index) => set({ currentRequirementIndex: index }),
      setCurrentSectionIndex: (index) => set({ currentSectionIndex: index }),
      setGenerationMode: (mode) => set({ generationMode: mode }),
      setJobAnalysis: (analysis) => set({ jobAnalysis: analysis }),
      setDisplayJobText: (text) => set({ displayJobText: text }),
      setResumeMatches: (matches: any) => set({ resumeMatches: matches }),
      setResumeMilestones: (milestones) => set({ resumeMilestones: milestones }),
      setCategorizedRequirements: (reqs) => set({ categorizedRequirements: reqs }),
      addRequirementResponse: (response) => set((state) => ({
        requirementResponses: [...state.requirementResponses, response]
      })),
      setSelectedFormat: (format) => set({ selectedFormat: format }),
      setResumeSections: (sections) => set({ resumeSections: sections }),
      updateSection: (sectionId, content) => set((state) => ({
        resumeSections: state.resumeSections.map(section =>
          section.id === sectionId ? { ...section, content } : section
        )
      })),
      setContactInfo: (info) => set({ contactInfo: info }),
      setResumeMode: (mode) => set({ resumeMode: mode }),
      setShowPreviewModal: (show) => set({ showPreviewModal: show }),
      setResumeId: (id) => set({ resumeId: id }),
      setAnalyzing: (analyzing) => set({ analyzing }),
      setMatching: (matching) => set({ matching }),
      setGeneratingSection: (section) => set({ generatingSection: section }),
      
      // ATS scoring actions
      setAtsScoreData: (data) => set({ atsScoreData: data }),
      setAnalyzingATS: (analyzing) => set({ analyzingATS: analyzing }),
      
      // Resume overlay actions (simplified - Master Resume direct editing)
      addGapSuggestion: (_payload: any, _meta?: any) =>
        set((state) => ({
          resumeOverlay: state.resumeOverlay,
        })),

      useSuggestionInResumeOnly: (_itemId: string) =>
        set((state) => ({
          resumeOverlay: state.resumeOverlay,
        })),

      promoteToMasterResume: (_itemId: string) =>
        set((state) => ({
          resumeOverlay: state.resumeOverlay,
        })),

      rejectSuggestion: (_itemId: string) =>
        set((state) => ({
          resumeOverlay: state.resumeOverlay,
        })),

      // Commit queued updates to Master Resume (simplified - no-op for now)
      commitPromotions: async () => {
        const state = get();
        const pending = state.resumeOverlay.pendingPromotions || [];

        if (!pending.length) return;

        // Clear pending promotions
        set((state) => ({
          resumeOverlay: {
            ...state.resumeOverlay,
            pendingPromotions: [],
          },
        }));
      },
      
      // Save resume to database
      saveResume: async () => {
        const state = get();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          logger.error('No user found when saving resume');
          return;
        }
        
        const resumeData = {
          user_id: user.id,
          version_name: state.jobAnalysis?.roleProfile?.title || 'Untitled Resume',
          job_project_id: null, // Could be linked to job_projects if needed
          template_id: null, // Could be linked to resume_templates if needed
          content: {
            job_title: state.jobAnalysis?.roleProfile?.title,
            job_company: state.jobAnalysis?.roleProfile?.company,
            job_description: state.displayJobText,
            contact_info: state.contactInfo,
            sections: state.resumeSections
          } as any,
          customizations: {
            job_analysis: state.jobAnalysis,
            selected_format: state.selectedFormat || 'executive',
            resume_matches: state.resumeMatches,
            gap_analysis: state.categorizedRequirements,
            requirement_responses: state.requirementResponses
          } as any,
          match_score: state.jobAnalysis?.coverageScore || null,
          updated_at: new Date().toISOString()
        };
        
        try {
          if (state.resumeId) {
            // Update existing resume
            const { error } = await supabase
              .from('resume_versions')
              .update(resumeData)
              .eq('id', state.resumeId);
            
            if (error) throw error;
          } else {
            // Insert new resume
            const { data, error } = await supabase
              .from('resume_versions')
              .insert(resumeData)
              .select()
              .single();
            
            if (error) throw error;
            if (data) {
              set({ resumeId: (data as any).id });
            }
          }
          
          logger.info('Resume saved successfully');
          showContextualSuccess('resume_save');
        } catch (error) {
          logger.error('Error saving resume', error instanceof Error ? error : undefined);
          showContextualError('resume_save', error instanceof Error ? error : undefined);
          throw error;
        }
      },
      
      // Load resume from database
      loadResume: async (resumeId: string) => {
        try {
          const { data, error } = await supabase
            .from('saved_resumes' as any)
            .select('*')
            .eq('id', resumeId)
            .single();
          
          if (error) throw error;
          if (!data) throw new Error('Resume not found');
          
          // Cast to any to work around type limitations until Supabase types regenerate
          const resumeData = data as any;
          
          // Restore state from database
          set({
            resumeId: resumeData.id,
            jobAnalysis: resumeData.job_analysis,
            displayJobText: resumeData.job_description,
            selectedFormat: resumeData.selected_format,
            contactInfo: resumeData.contact_info || {
              name: '',
              email: '',
              phone: '',
              location: ''
            },
            resumeSections: resumeData.sections || [],
            resumeMatches: resumeData.resume_matches,
            categorizedRequirements: resumeData.gap_analysis || {
              autoHandled: [],
              needsInput: [],
              optionalEnhancement: []
            },
            requirementResponses: resumeData.requirement_responses || []
          });
          
          logger.info('Resume loaded successfully');
        } catch (error) {
          logger.error('Error loading resume', error instanceof Error ? error : undefined);
          showContextualError('resume_save', error instanceof Error ? error : undefined);
          throw error;
        }
      },
      
      // Reset all state
      resetBuilder: () => set({
        currentStep: 'job-input',
        currentRequirementIndex: 0,
        currentSectionIndex: 0,
        generationMode: null,
        jobAnalysis: null,
        displayJobText: '',
        resumeMatches: null,
        resumeMilestones: [],
        categorizedRequirements: {
          autoHandled: [],
          needsInput: [],
          optionalEnhancement: []
        },
        requirementResponses: [],
        selectedFormat: null,
        resumeSections: [],
        contactInfo: {
          name: '',
          email: '',
          phone: '',
          location: ''
        },
        resumeMode: 'edit',
        showPreviewModal: false,
        resumeId: null,
        analyzing: false,
        matching: false,
        generatingSection: null
      })
    }),
    {
      name: 'resume-builder-storage',
      partialize: (state) => ({
        // Only persist minimal state to localStorage
        displayJobText: state.displayJobText,
        selectedFormat: state.selectedFormat,
        contactInfo: state.contactInfo,
        resumeId: state.resumeId
      }),
      onRehydrateStorage: () => (state) => {
        // Sanitize rehydrated state to prevent spread syntax errors
        if (state) {
          // Ensure atsKeywords is always a proper object
          if (state.jobAnalysis && !state.jobAnalysis.atsKeywords) {
            state.jobAnalysis.atsKeywords = { critical: [], important: [], nice_to_have: [] };
          }
          // Ensure resumeMatches has proper structure
          if (state.resumeMatches && !Array.isArray(state.resumeMatches.matchedItems)) {
            state.resumeMatches.matchedItems = [];
          }
          if (state.resumeMatches && !Array.isArray(state.resumeMatches.unmatchedRequirements)) {
            state.resumeMatches.unmatchedRequirements = [];
          }
        }
      }
    }
  )
);
