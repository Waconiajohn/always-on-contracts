import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  RBEvidence, 
  EvidenceCategory, 
  EvidenceSource, 
  EvidenceConfidence,
  SpanLocation 
} from '@/types/resume-builder';
import { mapUISectionToAPIType } from '@/lib/resume-section-utils';

export type GenerationStage = 
  | 'idle'
  | 'researching'
  | 'generating_ideal'
  | 'ready_for_personalization'
  | 'personalizing'
  | 'comparing'
  | 'complete';

// Matches IndustryResearchSchema from rb-schemas.ts
interface IndustryResearch {
  role_title: string;
  seniority_level: string;
  industry: string;
  keywords: Array<{ term: string; frequency: string; category: string }>;
  power_phrases: Array<{ phrase: string; impact_level: string; use_case: string }>;
  typical_qualifications: Array<{ qualification: string; importance: string; category: string }>;
  competitive_benchmarks: Array<{ area: string; top_performer: string; average: string }>;
  summary_template: string;
  experience_focus: string[];
}

// Matches IdealSectionSchema from rb-schemas.ts
interface IdealGenerationResult {
  section_type: string;
  ideal_content: string;
  structure_notes: string;
  key_elements: string[];
  word_count: number;
  keywords_included: string[];
}

// Matches PersonalizedSectionSchema from rb-schemas.ts
interface PersonalizedGenerationResult {
  section_type: string;
  personalized_content: string;
  ideal_elements_preserved: string[];
  evidence_incorporated: Array<{ claim_id?: string; evidence_text: string; how_used: string }>;
  gaps_identified: string[];
  questions_for_user: string[];
  similarity_to_ideal: number;
  word_count?: number;
}

interface UseTwoStageGenerationReturn {
  // State
  stage: GenerationStage;
  isLoading: boolean;
  error: string | null;
  
  // Data
  industryResearch: IndustryResearch | null;
  idealContent: IdealGenerationResult | null;
  personalizedContent: PersonalizedGenerationResult | null;
  userEvidence: RBEvidence[];
  
  // Actions
  startGeneration: (params: StartGenerationParams) => Promise<void>;
  generatePersonalized: () => Promise<void>;
  selectVersion: (version: 'ideal' | 'personalized' | 'blend', blendedContent?: string) => string;
  reset: () => void;
}

interface StartGenerationParams {
  projectId: string;
  sectionName: string;
  roleTitle: string;
  seniorityLevel: string;
  industry: string;
  jobDescription: string;
}

// Partial evidence shape from database before type casting
interface PartialEvidence {
  id: string;
  claim_text: string;
  evidence_quote: string | null;
  source: string;
  category: string;
  confidence: string;
  is_active: boolean;
  project_id: string;
  span_location: unknown;
  created_at: string;
}

// Safe type mapping function (Fix 2: proper type casting)
function mapToRBEvidence(data: PartialEvidence[]): RBEvidence[] {
  return data.map(item => ({
    id: item.id,
    project_id: item.project_id,
    claim_text: item.claim_text,
    evidence_quote: item.evidence_quote || item.claim_text,
    category: item.category as EvidenceCategory,
    source: item.source as EvidenceSource,
    confidence: item.confidence as EvidenceConfidence,
    span_location: item.span_location as SpanLocation | null,
    is_active: item.is_active,
    created_at: item.created_at,
  }));
}

export function useTwoStageGeneration(): UseTwoStageGenerationReturn {
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [industryResearch, setIndustryResearch] = useState<IndustryResearch | null>(null);
  const [idealContent, setIdealContent] = useState<IdealGenerationResult | null>(null);
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedGenerationResult | null>(null);
  const [userEvidence, setUserEvidence] = useState<RBEvidence[]>([]);
  
  // Store params for personalization stage
  const [generationParams, setGenerationParams] = useState<StartGenerationParams | null>(null);
  
  // Fix 3: Replace AbortController with mounted ref pattern
  // Supabase SDK doesn't support abort signals, so we use a mounted check
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const startGeneration = useCallback(async (params: StartGenerationParams) => {
    // Fix 5: Validate required inputs early
    if (!params.jobDescription?.trim()) {
      setError('Please add a job description before generating content');
      toast.error('Job description is required');
      return;
    }
    if (!params.roleTitle?.trim() || !params.industry?.trim()) {
      setError('Please confirm your target role and industry first');
      toast.error('Target role information is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setStage('researching');
    setGenerationParams(params);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to continue');
      }

      // Pre-load evidence for strength analysis (Fix 3 - do this early)
      const { data: evidenceData } = await supabase
        .from('rb_evidence')
        .select('id, claim_text, evidence_quote, source, category, confidence, is_active, project_id, span_location, created_at')
        .eq('project_id', params.projectId)
        .eq('is_active', true);
      
      // Fix 2: Use safe mapping function
      if (!isMountedRef.current) return;
      setUserEvidence(mapToRBEvidence((evidenceData as PartialEvidence[]) || []));

      // Step 1: Industry Research
      const { data: researchData, error: researchError } = await supabase.functions.invoke<IndustryResearch>(
        'rb-research-industry',
        {
          body: {
            role_title: params.roleTitle,
            seniority_level: params.seniorityLevel,
            industry: params.industry,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!isMountedRef.current) return;

      if (researchError || !researchData) {
        throw new Error(researchError?.message || 'Industry research failed');
      }

      setIndustryResearch(researchData);
      setStage('generating_ideal');

      // Step 2: Generate Ideal Section - Uses shared utility for section mapping
      const { data: idealData, error: idealError } = await supabase.functions.invoke<IdealGenerationResult>(
        'rb-generate-ideal-section',
        {
          body: {
            section_type: mapUISectionToAPIType(params.sectionName),
            jd_text: params.jobDescription,
            industry_research: {
              keywords: researchData.keywords,
              power_phrases: researchData.power_phrases,
              typical_qualifications: researchData.typical_qualifications,
              summary_template: researchData.summary_template,
              experience_focus: researchData.experience_focus,
            },
            role_context: {
              role_title: params.roleTitle,
              seniority_level: params.seniorityLevel,
              industry: params.industry,
            },
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!isMountedRef.current) return;

      if (idealError || !idealData) {
        throw new Error(idealError?.message || 'Ideal section generation failed');
      }

      setIdealContent(idealData);
      setStage('ready_for_personalization');
      toast.success('Industry-standard version ready!');
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
      setStage('idle');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const generatePersonalized = useCallback(async () => {
    if (!generationParams || !idealContent || !industryResearch) {
      toast.error('Please generate the ideal version first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStage('personalizing');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to continue');
      }

      // Fix 11: Reuse already-loaded evidence instead of fetching again
      // Evidence was pre-loaded in startGeneration
      const evidenceClaims = userEvidence.map((e) => ({
        claim_text: e.claim_text,
        evidence_quote: e.evidence_quote || e.claim_text,
        category: e.category,
        confidence: e.confidence,
      }));

      // Fixed API contract for personalized section - uses shared utility
      const { data: personalizedData, error: personalizedError } = await supabase.functions.invoke<PersonalizedGenerationResult>(
        'rb-generate-personalized-section',
        {
          body: {
            section_type: mapUISectionToAPIType(generationParams.sectionName),
            ideal_content: idealContent.ideal_content,
            user_evidence: evidenceClaims,
            role_context: {
              role_title: generationParams.roleTitle,
              seniority_level: generationParams.seniorityLevel,
              industry: generationParams.industry,
            },
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!isMountedRef.current) return;

      if (personalizedError || !personalizedData) {
        throw new Error(personalizedError?.message || 'Personalization failed');
      }

      setPersonalizedContent(personalizedData);
      setStage('comparing');
      toast.success('Your personalized version is ready!');
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const message = err instanceof Error ? err.message : 'Personalization failed';
      setError(message);
      toast.error(message);
      setStage('ready_for_personalization');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [generationParams, idealContent, industryResearch, userEvidence]);

  const selectVersion = useCallback((version: 'ideal' | 'personalized' | 'blend', blendedContent?: string): string => {
    setStage('complete');
    
    if (version === 'ideal') {
      return idealContent?.ideal_content || '';
    } else if (version === 'personalized') {
      return personalizedContent?.personalized_content || '';
    } else {
      return blendedContent || personalizedContent?.personalized_content || '';
    }
  }, [idealContent, personalizedContent]);

  const reset = useCallback(() => {
    setStage('idle');
    setIsLoading(false);
    setError(null);
    setIndustryResearch(null);
    setIdealContent(null);
    setPersonalizedContent(null);
    setGenerationParams(null);
    setUserEvidence([]);
  }, []);

  return {
    stage,
    isLoading,
    error,
    industryResearch,
    idealContent,
    personalizedContent,
    userEvidence,
    startGeneration,
    generatePersonalized,
    selectVersion,
    reset,
  };
}
