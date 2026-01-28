import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSectionContent, useVersionHistory, useRewriteSection } from '@/hooks/useRewriteSection';
import { calculateResumeScore } from '@/lib/calculate-resume-score';
import type { RBEvidence, RBProject, ActionSource, RBKeywordDecision, RBJDRequirement } from '@/types/resume-builder';
import type { SaveStatus } from '@/components/resume-builder/AutoSaveIndicator';

interface UseStudioPageDataOptions {
  projectId: string;
  sectionName: string;
}

export function useStudioPageData({ projectId, sectionName }: UseStudioPageDataOptions) {
  const [evidence, setEvidence] = useState<RBEvidence[]>([]);
  const [project, setProject] = useState<RBProject | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [keywordDecisions, setKeywordDecisions] = useState<RBKeywordDecision[]>([]);
  const [jdRequirements, setJdRequirements] = useState<RBJDRequirement[]>([]);

  const { content, setContent, originalContent, isLoading: loadingContent, loadContent } =
    useSectionContent(projectId, sectionName);
  const { versions, loadVersions, revertToVersion } =
    useVersionHistory(projectId, sectionName);
  const { rewrite, isLoading: rewriting } = useRewriteSection();

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedContent = useRef<string>('');
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('rb_projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (data) setProject(data as unknown as RBProject);
  }, [projectId]);

  const loadEvidence = useCallback(async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('rb_evidence')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('confidence', { ascending: false });
    
    setEvidence((data as unknown as RBEvidence[]) || []);
  }, [projectId]);

  const loadKeywordDecisions = useCallback(async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('rb_keyword_decisions')
      .select('*')
      .eq('project_id', projectId);
    
    setKeywordDecisions((data as unknown as RBKeywordDecision[]) || []);
  }, [projectId]);

  const loadJDRequirements = useCallback(async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('rb_jd_requirements')
      .select('*')
      .eq('project_id', projectId);
    
    setJdRequirements((data as unknown as RBJDRequirement[]) || []);
  }, [projectId]);

  useEffect(() => {
    loadContent();
    loadVersions();
    loadEvidence();
    loadProject();
    loadKeywordDecisions();
    loadJDRequirements();
  }, [loadContent, loadVersions, loadEvidence, loadProject, loadKeywordDecisions, loadJDRequirements]);

  // Auto-save effect
  useEffect(() => {
    // Skip if content hasn't changed or is empty
    if (!content.trim() || content === lastSavedContent.current || content === originalContent) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    setSaveStatus('saving');

    // Debounced auto-save after 2 seconds of inactivity
    autoSaveTimeout.current = setTimeout(async () => {
      try {
        await rewrite({
          projectId,
          sectionName,
          currentContent: content,
          actionSource: 'manual',
        });
        lastSavedContent.current = content;
        setLastSaved(new Date());
        setSaveStatus('saved');
        loadVersions();
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
      }
    }, 2000);

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [content, originalContent, projectId, sectionName, rewrite, loadVersions]);

  // Initialize lastSavedContent when content loads
  useEffect(() => {
    if (originalContent && !lastSavedContent.current) {
      lastSavedContent.current = originalContent;
    }
  }, [originalContent]);

  // Recalculate score utility
  const recalculateScore = useCallback(async (newContent: string) => {
    if (!projectId) return;

    const scoreResult = calculateResumeScore({
      keywordDecisions,
      jdRequirements,
      evidence,
      currentContent: newContent,
    });

    // Update project score in database
    await supabase
      .from('rb_projects')
      .update({ current_score: scoreResult.score })
      .eq('id', projectId);

    // Refresh project data
    loadProject();
    
    return scoreResult;
  }, [projectId, keywordDecisions, jdRequirements, evidence, loadProject]);

  const handleRewrite = useCallback(async (action: ActionSource) => {
    if (!projectId || !content.trim()) return;
    
    const result = await rewrite({
      projectId,
      sectionName,
      currentContent: content,
      actionSource: action,
    });

    if (result) {
      setContent(result.rewritten_text);
      loadVersions();
    }
  }, [projectId, content, sectionName, rewrite, setContent, loadVersions]);

  const handleSave = useCallback(async () => {
    if (!projectId) return;
    await rewrite({
      projectId,
      sectionName,
      currentContent: content,
      actionSource: 'manual',
    });
    loadVersions();
  }, [projectId, sectionName, content, rewrite, loadVersions]);

  const handleRevert = useCallback(async (version: typeof versions[0]) => {
    const success = await revertToVersion(version);
    if (success) {
      setContent(version.content);
      setShowHistory(false);
      // Recalculate score after reverting
      await recalculateScore(version.content);
    }
  }, [revertToVersion, setContent, recalculateScore]);

  const evidenceContext = evidence.map(e => ({
    claim: e.claim_text,
    source: e.source,
  }));

  const hasChanges = content !== originalContent && content.trim().length > 0;

  return {
    // Data
    content,
    setContent,
    evidence,
    project,
    versions,

    // State
    showHistory,
    setShowHistory,
    hasChanges,
    isLoading: rewriting || loadingContent,

    // Auto-save state
    saveStatus,
    lastSaved,

    // Actions
    handleRewrite,
    handleSave,
    handleRevert,
    recalculateScore,

    // Derived
    evidenceContext,
  };
}

// Bullet parsing utilities
export function parseBullets(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => line.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);
}

export function bulletsTocontent(bullets: string[]): string {
  return bullets.map(b => `• ${b}`).join('\n');
}
