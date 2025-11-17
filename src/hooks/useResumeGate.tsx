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

      const { data } = await supabase
        .from('career_vault')
        .select('resume_raw_text, review_completion_percentage')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const hasResumeUploaded = !!data.resume_raw_text && data.resume_raw_text.trim().length > 0;
        const completion = data.review_completion_percentage || 0;
        
        setHasResume(hasResumeUploaded);
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
