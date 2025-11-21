import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { ResumeMilestone } from '@/types/vault';
import { showContextualError, showContextualSuccess } from '@/lib/utils/contextualErrors';
import { logger } from '@/lib/logger';
import {
  createEmptyVaultOverlay,
  addSuggestedOverlayItem,
  markOverlayItemUsedInResume,
  markOverlayItemForPromotion,
  rejectOverlayItem,
  VaultOverlayState,
} from '@/lib/resumeVaultOverlay';
import { invokeEdgeFunction, AddVaultItemSchema, safeValidateInput } from '@/lib/edgeFunction';

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
  vaultItemsUsed: string[];
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
  currentStep: 'job-input' | 'gap-analysis' | 'format-selection' | 'requirement-filter' | 'requirement-builder' | 'section-wizard' | 'generation' | 'final-review';
  currentRequirementIndex: number;
  currentSectionIndex: number;
  generationMode: 'full' | 'section-by-section' | null;
  
  // Job data
  jobAnalysis: any | null;
  displayJobText: string;
  
  // Vault data
  vaultMatches: any | null;
  resumeMilestones: ResumeMilestone[];
  
  // Vault overlay (sandbox layer)
  vaultOverlay: VaultOverlayState;
  
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
  setVaultMatches: (matches: any) => void;
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
  
  // Vault overlay actions
  addGapSuggestion: (payload: any, meta?: any) => void;
  useSuggestionInResumeOnly: (itemId: string) => void;
  promoteSuggestionToVault: (itemId: string) => void;
  rejectSuggestion: (itemId: string) => void;
  commitVaultPromotions: () => Promise<void>;
  
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
      vaultOverlay: createEmptyVaultOverlay(),
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
      
      // ATS scoring actions
      setAtsScoreData: (data) => set({ atsScoreData: data }),
      setAnalyzingATS: (analyzing) => set({ analyzingATS: analyzing }),
      
      // Vault overlay actions
      addGapSuggestion: (payload, meta) =>
        set((state) => ({
          vaultOverlay: addSuggestedOverlayItem(state.vaultOverlay, payload, meta),
        })),

      useSuggestionInResumeOnly: (itemId) =>
        set((state) => ({
          vaultOverlay: markOverlayItemUsedInResume(state.vaultOverlay, itemId),
        })),

      promoteSuggestionToVault: (itemId) =>
        set((state) => ({
          vaultOverlay: markOverlayItemForPromotion(state.vaultOverlay, itemId),
        })),

      rejectSuggestion: (itemId) =>
        set((state) => ({
          vaultOverlay: rejectOverlayItem(state.vaultOverlay, itemId),
        })),

      // Commit queued promotions into Career Vault
      commitVaultPromotions: async () => {
        const state = get();
        const pending = state.vaultOverlay.pendingVaultPromotions || [];

        if (!pending.length) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          logger.error("No user found when committing vault promotions");
          throw new Error("Not signed in");
        }

        // Fetch or derive vault id
        const { data: vault, error: vaultError } = await supabase
          .from("career_vault")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (vaultError || !vault) {
          logger.error("No career vault found for user", { error: vaultError });
          throw new Error("No Career Vault found");
        }

        for (const item of pending) {
          const payload: any = item.payload || {};
          const type = payload.type || "impact_statement";
          const text = payload.text || "";
          const requirement = payload.requirementId || item.requirementId;

          // Decide target category and payload shape
          const category =
            type === "transferable_skill"
              ? "transferable_skills"
              : type === "education"
              ? "education"
              : "power_phrases";

          const itemData: any = {
            quality_tier: payload.quality_tier || "bronze",
            source: "gap_analysis",
            satisfies_requirement: requirement,
            confidence_score:
              payload.quality_tier === "silver" ? 85 : 70,
          };

          if (category === "power_phrases") {
            itemData.power_phrase = text;
          } else if (category === "transferable_skills") {
            itemData.stated_skill = text;
          } else if (category === "education") {
            itemData.content = text;
          }

          const edgePayload = {
            vaultId: vault.id,
            category,
            itemData,
          };

          const validation = safeValidateInput(AddVaultItemSchema, edgePayload);
          if (!validation.success) {
            logger.warn("Invalid vault promotion payload", { error: validation.error });
            continue;
          }

          const { error } = await invokeEdgeFunction(
            "add-vault-item",
            edgePayload
          );

          if (error) {
            logger.error("Failed to commit vault item", { error });
            // keep going; we don't want one failure to block everything
          }
        }

        // Clear pending promotions once processed
        set((state) => ({
          vaultOverlay: {
            ...state.vaultOverlay,
            pendingVaultPromotions: [],
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
            vault_matches: state.vaultMatches,
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
            vaultMatches: resumeData.vault_matches,
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
      }),
      onRehydrateStorage: () => (state) => {
        // Sanitize rehydrated state to prevent spread syntax errors
        if (state) {
          // Ensure atsKeywords is always a proper object
          if (state.jobAnalysis && !state.jobAnalysis.atsKeywords) {
            state.jobAnalysis.atsKeywords = { critical: [], important: [], nice_to_have: [] };
          }
          // Ensure vaultMatches has proper structure
          if (state.vaultMatches && !Array.isArray(state.vaultMatches.matchedItems)) {
            state.vaultMatches.matchedItems = [];
          }
          if (state.vaultMatches && !Array.isArray(state.vaultMatches.unmatchedRequirements)) {
            state.vaultMatches.unmatchedRequirements = [];
          }
        }
      }
    }
  )
);
