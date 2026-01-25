import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ActionSource, RBVersion } from '@/types/resume-builder';
import { toast } from 'sonner';

interface RewriteResult {
  rewritten_text: string;
  keywords_added: string[];
  evidence_used: string[];
  questions: string[];
  version_number: number;
}

interface ValidationIssue {
  type: 'hallucination' | 'exaggeration' | 'unsupported_claim' | 'missing_evidence';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  original_text?: string;
  problematic_text: string;
  suggestion: string;
}

interface ValidationResult {
  is_valid: boolean;
  confidence_score: number;
  issues: ValidationIssue[];
  summary: string;
  recommendation: 'approve' | 'revise' | 'reject';
}

interface UseRewriteSectionReturn {
  rewrite: (params: RewriteParams) => Promise<RewriteResult | null>;
  isLoading: boolean;
  error: string | null;
  lastResult: RewriteResult | null;
  validationResult: ValidationResult | null;
  isValidating: boolean;
}

interface RewriteParams {
  projectId: string;
  sectionName: string;
  currentContent: string;
  actionSource: ActionSource;
  microEditInstruction?: string;
  selectedText?: string;
  skipValidation?: boolean;
}

export function useRewriteSection(): UseRewriteSectionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RewriteResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Auto-validation function
  const validateRewrite = useCallback(async (
    projectId: string,
    sectionName: string,
    originalContent: string,
    rewrittenContent: string
  ): Promise<ValidationResult | null> => {
    try {
      setIsValidating(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return null;

      // Load evidence for this project
      const { data: evidence } = await supabase
        .from('rb_evidence')
        .select('claim_text, source, confidence')
        .eq('project_id', projectId)
        .eq('is_active', true);

      const evidenceClaims = (evidence || []).map((e: any) => ({
        claim: e.claim_text,
        source: e.source,
        confidence: e.confidence || 'medium',
      }));

      const { data, error: fnError } = await supabase.functions.invoke<ValidationResult>(
        'rb-validate-rewrite',
        {
          body: {
            original_content: originalContent,
            rewritten_content: rewrittenContent,
            section_name: sectionName,
            evidence_claims: evidenceClaims,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (fnError || !data) {
        console.error('Validation failed:', fnError);
        return null;
      }

      setValidationResult(data);

      // Show warnings for critical issues
      const criticalIssues = data.issues.filter(i => i.severity === 'critical');
      if (criticalIssues.length > 0) {
        toast.warning(`${criticalIssues.length} potential issue(s) detected - review before finalizing`);
      }

      return data;
    } catch (err) {
      console.error('Validation error:', err);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const rewrite = useCallback(async (params: RewriteParams): Promise<RewriteResult | null> => {
    setIsLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to continue');
      }

      const { data, error: fnError } = await supabase.functions.invoke<RewriteResult>(
        'rb-rewrite-section',
        {
          body: {
            project_id: params.projectId,
            section_name: params.sectionName,
            current_content: params.currentContent,
            action_source: params.actionSource,
            micro_edit_instruction: params.microEditInstruction,
            selected_text: params.selectedText,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Rewrite failed');
      }

      if (!data?.rewritten_text) {
        throw new Error('No rewritten content returned');
      }

      setLastResult(data);
      
      // Show keywords added toast if any
      if (data.keywords_added?.length > 0) {
        toast.success(`Added keywords: ${data.keywords_added.join(', ')}`);
      }

      // Show questions if AI needs more info
      if (data.questions?.length > 0) {
        toast.info(`AI needs more info: ${data.questions[0]}`);
      }

      // Auto-validate after rewrite (unless skipped)
      if (!params.skipValidation && params.actionSource !== 'manual') {
        // Run validation in background
        validateRewrite(
          params.projectId,
          params.sectionName,
          params.currentContent,
          data.rewritten_text
        );
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rewrite failed';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [validateRewrite]);

  return { rewrite, isLoading, error, lastResult, validationResult, isValidating };
}

// Hook for managing version history
export function useVersionHistory(projectId: string, sectionName: string) {
  const [versions, setVersions] = useState<RBVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadVersions = useCallback(async () => {
    if (!projectId || !sectionName) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rb_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('section_name', sectionName)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions((data as unknown as RBVersion[]) || []);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sectionName]);

  const revertToVersion = useCallback(async (version: RBVersion): Promise<boolean> => {
    try {
      // Deactivate all versions
      await supabase
        .from('rb_versions')
        .update({ is_active: false })
        .eq('project_id', projectId)
        .eq('section_name', sectionName);

      // Activate selected version
      await supabase
        .from('rb_versions')
        .update({ is_active: true })
        .eq('id', version.id);

      await loadVersions();
      toast.success(`Reverted to version ${version.version_number}`);
      return true;
    } catch (err) {
      toast.error('Failed to revert version');
      return false;
    }
  }, [projectId, sectionName, loadVersions]);

  return { versions, isLoading, loadVersions, revertToVersion };
}

// Hook for loading section content
export function useSectionContent(projectId: string, sectionName: string) {
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const loadContent = useCallback(async () => {
    if (!projectId || !sectionName) return;
    
    setIsLoading(true);
    try {
      // First try to get active version
      const { data: version, error: versionError } = await supabase
        .from('rb_versions')
        .select('content')
        .eq('project_id', projectId)
        .eq('section_name', sectionName)
        .eq('is_active', true)
        .maybeSingle();

      if (!versionError && version) {
        setContent(version.content);
        setIsLoading(false);
        return;
      }

      // Fall back to original document content
      const { data: doc, error: docError } = await supabase
        .from('rb_documents')
        .select('raw_text')
        .eq('project_id', projectId)
        .maybeSingle();

      if (docError) throw docError;

      // Use raw text as fallback
      const rawText = doc?.raw_text || '';
      setContent(rawText);
      setOriginalContent(rawText);
    } catch (err) {
      console.error('Failed to load section content:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sectionName]);

  return { content, setContent, originalContent, isLoading, loadContent };
}
