import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSectionContent, useVersionHistory, useRewriteSection } from '@/hooks/useRewriteSection';
import type { RBEvidence, RBProject, ActionSource } from '@/types/resume-builder';

interface UseStudioPageDataOptions {
  projectId: string;
  sectionName: string;
}

export function useStudioPageData({ projectId, sectionName }: UseStudioPageDataOptions) {
  const [evidence, setEvidence] = useState<RBEvidence[]>([]);
  const [project, setProject] = useState<RBProject | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { content, setContent, originalContent, isLoading: loadingContent, loadContent } = 
    useSectionContent(projectId, sectionName);
  const { versions, loadVersions, revertToVersion } = 
    useVersionHistory(projectId, sectionName);
  const { rewrite, isLoading: rewriting } = useRewriteSection();

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

  useEffect(() => {
    loadContent();
    loadVersions();
    loadEvidence();
    loadProject();
  }, [loadContent, loadVersions, loadEvidence, loadProject]);

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
    }
  }, [revertToVersion, setContent]);

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
    
    // Actions
    handleRewrite,
    handleSave,
    handleRevert,
    
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
