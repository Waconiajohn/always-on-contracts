/**
 * useResumeDraft - Auto-save and persist resume builder state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseResumeDraftReturn {
  sectionContent: Record<string, string>;
  setSectionContent: (content: Record<string, string>) => void;
  updateSection: (sectionId: string, content: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  isLoading: boolean;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
}

// Simple hash function for job description
function hashJobDescription(jd: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(jd.length, 500); i++) {
    const char = jd.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `jd_${Math.abs(hash).toString(16)}`;
}

export function useResumeDraft(jobDescription: string): UseResumeDraftReturn {
  const { user } = useAuth();
  const [sectionContent, setSectionContentState] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const jobDescriptionHash = hashJobDescription(jobDescription);

  // Load draft on mount
  const loadDraft = useCallback(async () => {
    if (!user?.id || !jobDescription) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('resume_builder_drafts')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_description_hash', jobDescriptionHash)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading draft:', error);
      }

      if (data?.section_content) {
        setSectionContentState(data.section_content as Record<string, string>);
        if (data.updated_at) {
          setLastSaved(new Date(data.updated_at));
        }
      }
    } catch (err) {
      console.error('Failed to load draft:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, jobDescription, jobDescriptionHash]);

  // Save draft to database
  const saveDraft = useCallback(async () => {
    if (!user?.id || !jobDescription || Object.keys(sectionContent).length === 0) {
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('resume_builder_drafts')
        .upsert({
          user_id: user.id,
          job_description_hash: jobDescriptionHash,
          section_content: sectionContent,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,job_description_hash'
        });

      if (error) {
        console.error('Error saving draft:', error);
      } else {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, jobDescription, jobDescriptionHash, sectionContent]);

  // Debounced save on content change
  useEffect(() => {
    if (isLoading || Object.keys(sectionContent).length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 2000); // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [sectionContent, saveDraft, isLoading]);

  // Load on mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Update entire section content
  const setSectionContent = useCallback((content: Record<string, string>) => {
    setSectionContentState(content);
  }, []);

  // Update single section
  const updateSection = useCallback((sectionId: string, content: string) => {
    setSectionContentState(prev => ({
      ...prev,
      [sectionId]: content
    }));
  }, []);

  return {
    sectionContent,
    setSectionContent,
    updateSection,
    isSaving,
    lastSaved,
    isLoading,
    saveDraft,
    loadDraft
  };
}
