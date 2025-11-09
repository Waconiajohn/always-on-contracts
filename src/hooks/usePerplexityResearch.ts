import { useState } from 'react';
import { invokeEdgeFunction, PerplexityResearchSchema, safeValidateInput } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

interface ResearchParams {
  research_type: 'market_intelligence' | 'company_research' | 'skills_demand' | 'career_path' | 'interview_prep';
  query_params: Record<string, any>;
}

interface ResearchResult {
  success: boolean;
  research_result?: string;
  citations?: string[];
  related_questions?: string[];
  researched_at?: string;
  error?: string;
}

export const usePerplexityResearch = () => {
  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);

  const research = async (params: ResearchParams): Promise<ResearchResult> => {
    setIsResearching(true);
    setResult(null);

    const validation = safeValidateInput(PerplexityResearchSchema, params);
    if (!validation.success) {
      setIsResearching(false);
      return { success: false, error: validation.error };
    }

    const { data, error } = await invokeEdgeFunction<ResearchResult>(
      supabase,
      'perplexity-research',
      params,
      { showSuccessToast: true, successMessage: 'Research complete!' }
    );

    setIsResearching(false);

    if (error) {
      logger.error('Research failed', error);
      const errorResult = { success: false, error: error.message };
      setResult(errorResult);
      return errorResult;
    }

    setResult(data);
    return data || { success: false, error: 'No data returned' };
  };

  const verify = async (
    content_to_verify: any,
    verification_type: string,
    context?: Record<string, any>
  ): Promise<ResearchResult> => {
    setIsResearching(true);

    const { data, error } = await invokeEdgeFunction<ResearchResult>(
      supabase,
      'verify-with-perplexity',
      { content_to_verify, verification_type, context },
      { showSuccessToast: true, successMessage: 'Verification complete!' }
    );

    setIsResearching(false);

    if (error) {
      logger.error('Verification failed', error);
      return { success: false, error: error.message };
    }

    return data || { success: false, error: 'No data returned' };
  };

  return {
    research,
    verify,
    isResearching,
    result,
  };
};