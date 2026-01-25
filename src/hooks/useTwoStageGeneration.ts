import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type GenerationStage = 
  | 'idle'
  | 'researching'
  | 'generating_ideal'
  | 'ready_for_personalization'
  | 'personalizing'
  | 'comparing'
  | 'complete';

interface IndustryResearch {
  role_title: string;
  seniority_level: string;
  industry: string;
  keywords: string[];
  power_phrases: string[];
  typical_qualifications: string[];
  competitive_benchmarks: string[];
  market_insights: string[];
}

interface GenerationResult {
  content: string;
  quality_indicators: {
    keyword_density: number;
    achievement_count: number;
    quantified_results: number;
    power_phrase_usage: number;
  };
  explanation: string;
}

interface UseTwoStageGenerationReturn {
  // State
  stage: GenerationStage;
  isLoading: boolean;
  error: string | null;
  
  // Data
  industryResearch: IndustryResearch | null;
  idealContent: GenerationResult | null;
  personalizedContent: GenerationResult | null;
  
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

export function useTwoStageGeneration(): UseTwoStageGenerationReturn {
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [industryResearch, setIndustryResearch] = useState<IndustryResearch | null>(null);
  const [idealContent, setIdealContent] = useState<GenerationResult | null>(null);
  const [personalizedContent, setPersonalizedContent] = useState<GenerationResult | null>(null);
  
  // Store params for personalization stage
  const [generationParams, setGenerationParams] = useState<StartGenerationParams | null>(null);

  const startGeneration = useCallback(async (params: StartGenerationParams) => {
    setIsLoading(true);
    setError(null);
    setStage('researching');
    setGenerationParams(params);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to continue');
      }

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

      if (researchError || !researchData) {
        throw new Error(researchError?.message || 'Industry research failed');
      }

      setIndustryResearch(researchData);
      setStage('generating_ideal');

      // Step 2: Generate Ideal Section
      const { data: idealData, error: idealError } = await supabase.functions.invoke<GenerationResult>(
        'rb-generate-ideal-section',
        {
          body: {
            section_name: params.sectionName,
            job_description: params.jobDescription,
            industry_research: researchData,
            role_title: params.roleTitle,
            seniority_level: params.seniorityLevel,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (idealError || !idealData) {
        throw new Error(idealError?.message || 'Ideal section generation failed');
      }

      setIdealContent(idealData);
      setStage('ready_for_personalization');
      toast.success('Industry-standard version ready!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
      setStage('idle');
    } finally {
      setIsLoading(false);
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

      // Load user's evidence
      const { data: evidence } = await supabase
        .from('rb_evidence')
        .select('claim_text, source, category, confidence')
        .eq('project_id', generationParams.projectId)
        .eq('is_active', true);

      const evidenceClaims = (evidence || []).map((e: any) => ({
        claim: e.claim_text,
        source: e.source,
        category: e.category,
        confidence: e.confidence,
      }));

      const { data: personalizedData, error: personalizedError } = await supabase.functions.invoke<GenerationResult>(
        'rb-generate-personalized-section',
        {
          body: {
            section_name: generationParams.sectionName,
            ideal_content: idealContent.content,
            evidence_claims: evidenceClaims,
            industry_research: industryResearch,
            role_title: generationParams.roleTitle,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (personalizedError || !personalizedData) {
        throw new Error(personalizedError?.message || 'Personalization failed');
      }

      setPersonalizedContent(personalizedData);
      setStage('comparing');
      toast.success('Your personalized version is ready!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Personalization failed';
      setError(message);
      toast.error(message);
      setStage('ready_for_personalization');
    } finally {
      setIsLoading(false);
    }
  }, [generationParams, idealContent, industryResearch]);

  const selectVersion = useCallback((version: 'ideal' | 'personalized' | 'blend', blendedContent?: string): string => {
    setStage('complete');
    
    if (version === 'ideal') {
      return idealContent?.content || '';
    } else if (version === 'personalized') {
      return personalizedContent?.content || '';
    } else {
      return blendedContent || personalizedContent?.content || '';
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
  }, []);

  return {
    stage,
    isLoading,
    error,
    industryResearch,
    idealContent,
    personalizedContent,
    startGeneration,
    generatePersonalized,
    selectVersion,
    reset,
  };
}
