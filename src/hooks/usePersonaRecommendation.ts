import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { showContextualError } from '@/lib/utils/contextualErrors';

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
    try {
      const { data, error } = await supabase.functions.invoke('recommend-persona', {
        body: {
          jobDescription,
          agentType
        }
      });

      if (error) throw error;

      if (data.success) {
        setRecommendation({
          recommendedPersona: data.recommendedPersona,
          reasoning: data.reasoning,
          confidence: data.confidence,
          personas: data.personas
        });
      }
    } catch (error) {
      console.error('Error getting persona recommendation:', error);
      showContextualError('ai_generation', error instanceof Error ? error : undefined);
    } finally {
      setLoading(false);
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
