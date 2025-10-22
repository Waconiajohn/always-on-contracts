import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface RequirementResponse {
  requirement: {
    id: string;
    text: string;
    source: string;
    priority: string;
    atsKeywords: string[];
  };
  answers: Record<string, any>;
  voiceContext?: string;
  selectedOption: number;
  editedContent: string;
  options: any[];
  timestamp: Date;
}

interface CategorizedRequirements {
  autoHandled: any[];
  needsInput: any[];
  optionalEnhancement: any[];
}

interface ResumeBuilderState {
  // Wizard state
  currentStep: 'job-input' | 'gap-analysis' | 'format-selection' | 'requirement-filter' | 'requirement-builder' | 'section-wizard' | 'generation' | 'final-review';
  currentRequirementIndex: number;
  currentSectionIndex: number;
  generationMode: 'full' | 'section-by-section' | null;
  
  // Job data
  jobAnalysis: any | null;
  displayJobText: string;
  
  // Vault data
  vaultMatches: any | null;
  resumeMilestones: any[];
  
  // Requirements
  categorizedRequirements: CategorizedRequirements;
  requirementResponses: RequirementResponse[];
  
  // Resume data
  selectedFormat: string | null;
  resumeSections: any[];
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
  setVaultMatches: (matches: any) => void;
  setResumeMilestones: (milestones: any[]) => void;
  setCategorizedRequirements: (reqs: CategorizedRequirements) => void;
  addRequirementResponse: (response: RequirementResponse) => void;
  setSelectedFormat: (format: string) => void;
  setResumeSections: (sections: any[]) => void;
  updateSection: (sectionId: string, content: any) => void;
  setContactInfo: (info: any) => void;
  setResumeMode: (mode: 'edit' | 'preview') => void;
  setShowPreviewModal: (show: boolean) => void;
  setResumeId: (id: string | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setMatching: (matching: boolean) => void;
  setGeneratingSection: (section: string | null) => void;
  
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
      vaultMatches: null,
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
      generatingSection: null,
      
      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),
      setCurrentRequirementIndex: (index) => set({ currentRequirementIndex: index }),
      setCurrentSectionIndex: (index) => set({ currentSectionIndex: index }),
      setGenerationMode: (mode) => set({ generationMode: mode }),
      setJobAnalysis: (analysis) => set({ jobAnalysis: analysis }),
      setDisplayJobText: (text) => set({ displayJobText: text }),
      setVaultMatches: (matches) => set({ vaultMatches: matches }),
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
      
      // Save resume to database
      saveResume: async () => {
        const state = get();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No user found');
          return;
        }
        
        const resumeData = {
          user_id: user.id,
          job_title: state.jobAnalysis?.roleProfile?.title || 'Untitled Resume',
          job_company: state.jobAnalysis?.roleProfile?.company || null,
          job_description: state.displayJobText,
          job_analysis: state.jobAnalysis,
          selected_format: state.selectedFormat || 'executive',
          coverage_score: state.jobAnalysis?.coverageScore || null,
          ats_score: state.jobAnalysis?.atsScore || null,
          contact_info: state.contactInfo,
          sections: state.resumeSections,
          vault_matches: state.vaultMatches,
          gap_analysis: state.categorizedRequirements,
          requirement_responses: state.requirementResponses,
          updated_at: new Date().toISOString()
        };
        
        try {
          if (state.resumeId) {
            // Update existing resume
            const { error } = await supabase
              .from('saved_resumes' as any)
              .update(resumeData)
              .eq('id', state.resumeId);
            
            if (error) throw error;
          } else {
            // Insert new resume
            const { data, error } = await supabase
              .from('saved_resumes' as any)
              .insert(resumeData)
              .select()
              .single();
            
            if (error) throw error;
            if (data) {
              set({ resumeId: (data as any).id });
            }
          }
          
          console.log('Resume saved successfully');
        } catch (error) {
          console.error('Error saving resume:', error);
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
            vaultMatches: resumeData.vault_matches,
            categorizedRequirements: resumeData.gap_analysis || {
              autoHandled: [],
              needsInput: [],
              optionalEnhancement: []
            },
            requirementResponses: resumeData.requirement_responses || []
          });
          
          console.log('Resume loaded successfully');
        } catch (error) {
          console.error('Error loading resume:', error);
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
        vaultMatches: null,
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
      })
    }
  )
);
