import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ResumeMatchResult } from '@/components/resume-match/types';

interface UseRealtimeResumeScoreOptions {
  debounceMs?: number;
  minResumeLength?: number;
  minJDLength?: number;
}

export function useRealtimeResumeScore(options: UseRealtimeResumeScoreOptions = {}) {
  const {
    debounceMs = 1500,
    minResumeLength = 100,
    minJDLength = 50
  } = options;

  const [result, setResult] = useState<ResumeMatchResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const analyze = useCallback(async (resumeText: string, jobDescription: string) => {
    // Validate inputs
    if (!resumeText || resumeText.length < minResumeLength) {
      setError(`Resume must be at least ${minResumeLength} characters`);
      return;
    }
    if (!jobDescription || jobDescription.length < minJDLength) {
      setError(`Job description must be at least ${minJDLength} characters`);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: apiError } = await supabase.functions.invoke('instant-resume-score', {
        body: { resumeText, jobDescription }
      });

      if (apiError) throw apiError;

      if (data.success) {
        setResult(data);
        setLastAnalyzedAt(data.analyzedAt);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      console.error('Resume scoring error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  }, [minResumeLength, minJDLength]);

  const debouncedAnalyze = useCallback((resumeText: string, jobDescription: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      analyze(resumeText, jobDescription);
    }, debounceMs);
  }, [analyze, debounceMs]);

  const cancelPending = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsAnalyzing(false);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setLastAnalyzedAt(null);
  }, []);

  return {
    result,
    isAnalyzing,
    error,
    lastAnalyzedAt,
    analyze,
    debouncedAnalyze,
    cancelPending,
    clearResult
  };
}
