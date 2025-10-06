import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

    try {
      const { data, error } = await supabase.functions.invoke('perplexity-research', {
        body: params,
      });

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast.success('Research complete!');
      } else {
        toast.error(data.error || 'Research failed');
      }

      return data;
    } catch (error) {
      console.error('Research error:', error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setResult(errorResult);
      toast.error('Failed to complete research');
      return errorResult;
    } finally {
      setIsResearching(false);
    }
  };

  const verify = async (
    content_to_verify: any,
    verification_type: string,
    context?: Record<string, any>
  ): Promise<ResearchResult> => {
    setIsResearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-with-perplexity', {
        body: {
          content_to_verify,
          verification_type,
          context,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Verification complete!');
      }

      return data;
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsResearching(false);
    }
  };

  return {
    research,
    verify,
    isResearching,
    result,
  };
};