// =====================================================
// AUTO-SAVE HOOK - Career Vault 2.0
// =====================================================
// Provides debounced auto-save functionality for
// onboarding progress, ensuring data is persisted
// without overwhelming the database with updates.
// =====================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { OnboardingStep } from '@/types/career-vault';

interface AutoSaveOptions {
  vaultId: string;
  enabled?: boolean;
  debounceMs?: number;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
}

interface AutoSaveData {
  onboarding_step?: OnboardingStep;
  initial_analysis?: any;
  career_direction?: 'stay' | 'pivot' | 'explore';
  target_roles?: string[];
  target_industries?: string[];
  industry_research?: any;
  vault_strength_before_qa?: number;
  vault_strength_after_qa?: number;
}

export function useAutoSave(options: AutoSaveOptions) {
  const {
    vaultId,
    enabled = true,
    debounceMs = 2000,
    onSaveStart,
    onSaveComplete,
    onSaveError,
  } = options;

  const supabase = useSupabaseClient();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<AutoSaveData | null>(null);

  // Save function that actually writes to database
  const performSave = useCallback(async (data: AutoSaveData) => {
    if (!enabled || !vaultId) return;

    try {
      setIsSaving(true);
      onSaveStart?.();

      const { error } = await supabase
        .from('career_vault')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vaultId);

      if (error) throw error;

      setLastSaved(new Date());
      onSaveComplete?.();
    } catch (error) {
      console.error('Auto-save failed:', error);
      onSaveError?.(error as Error);
    } finally {
      setIsSaving(false);
      pendingDataRef.current = null;
    }
  }, [enabled, vaultId, supabase, onSaveStart, onSaveComplete, onSaveError]);

  // Debounced save function
  const save = useCallback((data: AutoSaveData) => {
    if (!enabled) return;

    // Merge with any pending data
    pendingDataRef.current = {
      ...pendingDataRef.current,
      ...data,
    };

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        performSave(pendingDataRef.current);
      }
    }, debounceMs);
  }, [enabled, debounceMs, performSave]);

  // Force immediate save (useful for critical step transitions)
  const saveNow = useCallback(async (data?: AutoSaveData) => {
    if (!enabled) return;

    // Clear any pending timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Merge with pending data if any
    const dataToSave = {
      ...pendingDataRef.current,
      ...data,
    };

    if (Object.keys(dataToSave).length > 0) {
      await performSave(dataToSave);
    }
  }, [enabled, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    saveNow,
    isSaving,
    lastSaved,
  };
}

// Hook for auto-saving onboarding step changes
export function useOnboardingAutoSave(
  vaultId: string | undefined,
  currentStep: string
) {
  const supabase = useSupabaseClient();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const previousStepRef = useRef<string>(currentStep);

  // Map UI steps to database onboarding steps
  const mapUIStepToDBStep = (uiStep: string): OnboardingStep => {
    const stepMap: Record<string, OnboardingStep> = {
      'upload': 'not_started',
      'analysis': 'resume_uploaded',
      'direction': 'analysis_complete',
      'research': 'targets_set',
      'extraction': 'research_complete',
      'review': 'auto_population_complete',
      'gaps': 'review_complete',
      'complete': 'onboarding_complete',
    };
    return stepMap[uiStep] || 'not_started';
  };

  // Auto-save when step changes
  useEffect(() => {
    const saveStepProgress = async () => {
      if (!vaultId || currentStep === previousStepRef.current) return;

      setSaveStatus('saving');

      try {
        const { error } = await supabase
          .from('career_vault')
          .update({
            onboarding_step: mapUIStepToDBStep(currentStep),
            updated_at: new Date().toISOString(),
          })
          .eq('id', vaultId);

        if (error) throw error;

        setSaveStatus('saved');
        previousStepRef.current = currentStep;

        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to save step progress:', error);
        setSaveStatus('error');
      }
    };

    saveStepProgress();
  }, [vaultId, currentStep, supabase]);

  return saveStatus;
}
