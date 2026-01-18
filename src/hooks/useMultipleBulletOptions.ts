/**
 * useMultipleBulletOptions - Hook for generating multiple bullet point variations
 * Calls generate-bullet-options edge function to get 3 strategic angles
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BulletOption {
  id: 'A' | 'B' | 'C';
  label: string;
  bullet: string;
  emphasis: string;
}

interface GenerateBulletOptionsParams {
  requirementText: string;
  currentBullet?: string;
  jobDescription: string;
  evidenceContext?: string;
  gapExplanation?: string;
  bridgingStrategy?: string;
}

export function useMultipleBulletOptions() {
  const [options, setOptions] = useState<BulletOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateOptions = useCallback(async (params: GenerateBulletOptionsParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-bullet-options', {
        body: params,
      });

      if (fnError) throw fnError;

      if (data?.success && data?.options) {
        setOptions(data.options as BulletOption[]);
        return data.options as BulletOption[];
      } else {
        throw new Error(data?.error || 'No options returned');
      }
    } catch (err) {
      console.error('Failed to generate bullet options:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate options';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearOptions = useCallback(() => {
    setOptions([]);
    setError(null);
  }, []);

  const selectOption = useCallback((optionId: 'A' | 'B' | 'C'): BulletOption | undefined => {
    return options.find(opt => opt.id === optionId);
  }, [options]);

  return {
    options,
    isLoading,
    error,
    generateOptions,
    clearOptions,
    selectOption,
  };
}
