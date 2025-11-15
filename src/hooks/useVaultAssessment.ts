import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QualityAssessment {
  overall_score: number;
  competitive_percentile: number;
  critical_gaps: Array<{
    category: string;
    severity: 'critical' | 'important' | 'nice_to_have';
    description: string;
    impact: string;
  }>;
  quick_wins: Array<{
    action: string;
    time_estimate: string;
    impact_score: number;
    description: string;
  }>;
  enhancement_suggestions: Array<{
    item_id: string;
    item_type: string;
    current_text: string;
    suggestion: string;
    improvement_type: string;
  }>;
  next_best_action: {
    title: string;
    description: string;
    why_now: string;
  };
}

export const useVaultAssessment = () => {
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessment, setAssessment] = useState<QualityAssessment | null>(null);
  const { toast } = useToast();

  const assessVaultQuality = async (vaultId: string) => {
    setIsAssessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('assess-vault-quality', {
        body: { vaultId }
      });

      if (error) throw error;

      if (data?.success && data.assessment) {
        setAssessment(data.assessment);
        return data.assessment;
      } else {
        throw new Error('Assessment failed');
      }
    } catch (error) {
      console.error('Error assessing vault:', error);
      toast({
        title: 'Assessment failed',
        description: error instanceof Error ? error.message : 'Failed to assess vault quality',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsAssessing(false);
    }
  };

  return {
    isAssessing,
    assessment,
    assessVaultQuality
  };
};
