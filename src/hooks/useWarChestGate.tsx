import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useWarChestGate = () => {
  const [isWarChestComplete, setIsWarChestComplete] = useState(false);
  const [warChestCompletion, setWarChestCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkWarChestStatus();
  }, []);

  const checkWarChestStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('career_war_chest')
        .select('interview_completion_percentage')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const completion = data.interview_completion_percentage || 0;
        setWarChestCompletion(completion);
        setIsWarChestComplete(completion === 100);
      }
    } catch (error) {
      console.error('Error checking War Chest status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateWithGate = (path: string, featureName: string) => {
    if (isWarChestComplete) {
      navigate(path);
    } else {
      return {
        blocked: true,
        featureName,
        completion: warChestCompletion
      };
    }
  };

  return {
    isWarChestComplete,
    warChestCompletion,
    isLoading,
    navigateWithGate,
    refreshStatus: checkWarChestStatus
  };
};
