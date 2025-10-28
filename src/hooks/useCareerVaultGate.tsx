import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useCareerVaultGate = () => {
  const [isVaultComplete, setIsVaultComplete] = useState(false);
  const [vaultCompletion, setVaultCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkVaultStatus();
  }, []);

  const checkVaultStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('career_vault')
        .select('review_completion_percentage')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const completion = data.review_completion_percentage || 0;
        setVaultCompletion(completion);
        setIsVaultComplete(completion === 100);
      }
    } catch (error) {
      console.error('Error checking Career Vault status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateWithGate = (path: string, featureName: string) => {
    if (isVaultComplete) {
      navigate(path);
    } else {
      return {
        blocked: true,
        featureName,
        completion: vaultCompletion
      };
    }
  };

  return {
    isVaultComplete,
    vaultCompletion,
    isLoading,
    navigateWithGate,
    refreshStatus: checkVaultStatus
  };
};
