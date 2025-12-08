/**
 * useSessionPersistence - Persist V8 builder state to Supabase
 */

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { V8BuilderState, EvidenceMatrixResult } from '../types';

interface SessionData {
  id?: string;
  user_id: string;
  job_id?: string;
  requirements_json: any;
  selections_json: any;
  metadata: any;
  is_complete: boolean;
}

export function useSessionPersistence(state: V8BuilderState) {
  const { user } = useAuth();
  const { toast } = useToast();
  const sessionIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save session to database
  const saveSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      const sessionData: SessionData = {
        user_id: user.id,
        requirements_json: state.gapAnalysis ? {
          fullMatches: state.gapAnalysis.fullMatches,
          partialMatches: state.gapAnalysis.partialMatches,
          missingRequirements: state.gapAnalysis.missingRequirements
        } : {},
        selections_json: {
          evidenceMatrix: state.evidenceMatrix,
          sections: state.sections,
          currentStep: state.currentStep,
          completedSteps: Array.from(state.completedSteps)
        },
        metadata: {
          detected: state.detected,
          initialScore: state.initialScore,
          currentScore: state.currentScore,
          scoreBreakdown: state.scoreBreakdown,
          resumeTextLength: state.resumeText.length,
          jobDescriptionLength: state.jobDescription.length
        },
        is_complete: state.currentStep === 'export'
      };

      if (sessionIdRef.current) {
        // Update existing session
        const { error } = await supabase
          .from('evidence_matrix_sessions')
          .update({
            ...sessionData,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionIdRef.current);

        if (error) throw error;
      } else {
        // Create new session
        const { data, error } = await supabase
          .from('evidence_matrix_sessions')
          .insert(sessionData)
          .select('id')
          .single();

        if (error) throw error;
        sessionIdRef.current = data.id;
      }

      console.log('[V8] Session saved:', sessionIdRef.current);
    } catch (error) {
      console.error('[V8] Failed to save session:', error);
    }
  }, [user?.id, state]);

  // Debounced auto-save when state changes
  useEffect(() => {
    if (!state.isDirty || !user?.id) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save after 3 seconds of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveSession();
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.isDirty, state.currentStep, state.sections, saveSession, user?.id]);

  // Load existing session on mount
  const loadSession = useCallback(async (): Promise<Partial<V8BuilderState> | null> => {
    if (!user?.id) return null;

    try {
      // Find most recent incomplete session
      const { data, error } = await supabase
        .from('evidence_matrix_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      sessionIdRef.current = data.id;

      const selections = data.selections_json as any;
      const metadata = data.metadata as any;

      toast({
        title: 'Session restored',
        description: 'Continuing from where you left off'
      });

      return {
        evidenceMatrix: selections?.evidenceMatrix as EvidenceMatrixResult || null,
        sections: selections?.sections || undefined,
        currentStep: selections?.currentStep || 'evidence-matrix',
        completedSteps: new Set(selections?.completedSteps || []),
        detected: metadata?.detected || undefined,
        initialScore: metadata?.initialScore || 0,
        currentScore: metadata?.currentScore || 0,
        scoreBreakdown: metadata?.scoreBreakdown || undefined
      };
    } catch (error) {
      console.error('[V8] Failed to load session:', error);
      return null;
    }
  }, [user?.id, toast]);

  // Mark session complete
  const completeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('evidence_matrix_sessions')
        .update({
          is_complete: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionIdRef.current);

      console.log('[V8] Session marked complete');
    } catch (error) {
      console.error('[V8] Failed to complete session:', error);
    }
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    sessionIdRef.current = null;
  }, []);

  return {
    saveSession,
    loadSession,
    completeSession,
    clearSession,
    sessionId: sessionIdRef.current
  };
}
