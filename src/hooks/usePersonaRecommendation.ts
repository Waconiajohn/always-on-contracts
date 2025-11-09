import { useState } from 'react';
import { invokeEdgeFunction, RecommendPersonaSchema, safeValidateInput } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PersonaMatch {
  id: string;
  name: string;
  description: string;
  score: number;
  strengths: string[];
}

export interface PersonaRecommendation {
  recommendedPersona: string;
  reasoning: string;
  confidence: number;
  personas: PersonaMatch[];
}

export const usePersonaRecommendation = (agentType: 'resume' | 'interview' | 'networking') => {
  const [recommendation, setRecommendation] = useState<PersonaRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getRecommendation = async (jobDescription: string) => {
    if (!jobDescription?.trim()) {
      toast({
        title: "Job description required",
        description: "Please provide a job description to get persona recommendations",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const validation = safeValidateInput(RecommendPersonaSchema, { jobDescription, agentType });
    if (!validation.success) {
      setLoading(false);
      return;
    }

    const { data, error } = await invokeEdgeFunction(
      supabase,
      'recommend-persona',
      { jobDescription, agentType }
    );

    setLoading(false);

    if (error) {
      logger.error('Persona recommendation failed', error);
      return;
    }

    if (data?.success) {
      setRecommendation({
        recommendedPersona: data.recommendedPersona,
        reasoning: data.reasoning,
        confidence: data.confidence,
        personas: data.personas
      });
    }
  };

  const resetRecommendation = () => {
    setRecommendation(null);
  };

  return {
    recommendation,
    loading,
    getRecommendation,
    resetRecommendation
  };
};
