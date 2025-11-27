import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useResumeGate = () => {
  const [hasResume, setHasResume] = useState(false);
  const [vaultCompletion, setVaultCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkResumeStatus();
  }, []);

  const checkResumeStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check vault data quality, not just existence
      const { data } = await supabase
        .from('career_vault')
        .select(`
          resume_raw_text, 
          review_completion_percentage,
          total_power_phrases,
          total_transferable_skills,
          total_hidden_competencies,
          intelligent_qa_completed
        `)
        .eq('user_id', user.id)
        .single();

      if (data) {
        const hasResumeUploaded = !!data.resume_raw_text && data.resume_raw_text.trim().length > 0;
        const completion = data.review_completion_percentage || 0;
        
        // Check if vault has minimum viable data for AI features
        const hasMinimumData = (
          (data.total_power_phrases || 0) >= 5 &&
          (data.total_transferable_skills || 0) >= 5 &&
          (data.total_hidden_competencies || 0) >= 3
        );
        
        setHasResume(hasResumeUploaded && hasMinimumData);
        setVaultCompletion(completion);
      }
    } catch (error) {
      console.error('Error checking resume status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasResume,
    vaultCompletion,
    isLoading,
    refreshStatus: checkResumeStatus
  };
};
