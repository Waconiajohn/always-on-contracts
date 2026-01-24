import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { RewriteControls } from '@/components/resume-builder/RewriteControls';
import { VersionHistory } from '@/components/resume-builder/VersionHistory';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useRewriteSection, useVersionHistory, useSectionContent } from '@/hooks/useRewriteSection';
import type { ActionSource, RBKeywordDecision } from '@/types/resume-builder';
import { Check, X, AlertCircle } from 'lucide-react';

const SECTION_NAME = 'skills';

export default function SkillsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showHistory, setShowHistory] = useState(false);
  const [keywords, setKeywords] = useState<RBKeywordDecision[]>([]);

  const { content, setContent, originalContent, isLoading: loadingContent, loadContent } = 
    useSectionContent(projectId || '', SECTION_NAME);
  const { versions, loadVersions, revertToVersion } = 
    useVersionHistory(projectId || '', SECTION_NAME);
  const { rewrite, isLoading: rewriting } = useRewriteSection();

  useEffect(() => {
    loadContent();
    loadVersions();
    loadKeywords();
  }, [loadContent, loadVersions, projectId]);

  const loadKeywords = async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('rb_keyword_decisions')
      .select('*')
      .eq('project_id', projectId)
      .order('keyword', { ascending: true });
    
    setKeywords((data as unknown as RBKeywordDecision[]) || []);
  };

  const handleRewrite = async (action: ActionSource) => {
    if (!projectId || !content.trim()) return;
    
    const result = await rewrite({
      projectId,
      sectionName: SECTION_NAME,
      currentContent: content,
      actionSource: action,
    });

    if (result) {
      setContent(result.rewritten_text);
      loadVersions();
    }
  };

  const handleSave = async () => {
    if (!projectId) return;
    await rewrite({
      projectId,
      sectionName: SECTION_NAME,
      currentContent: content,
      actionSource: 'manual',
    });
    loadVersions();
  };

  const handleRevert = async (version: typeof versions[0]) => {
    const success = await revertToVersion(version);
    if (success) {
      setContent(version.content);
      setShowHistory(false);
    }
  };

  const hasChanges = content !== originalContent && content.trim().length > 0;

  const approvedKeywords = keywords.filter(k => k.decision === 'add');
  const suppressedKeywords = keywords.filter(k => k.decision === 'not_true' || k.decision === 'ignore');
  const pendingKeywords = keywords.filter(k => !k.decision || (k.decision as string) === 'pending');

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Keyword Status</h3>
            
            {approvedKeywords.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  Approved ({approvedKeywords.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {approvedKeywords.map((k) => (
                    <Badge key={k.id} variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                      {k.keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {suppressedKeywords.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <X className="h-3 w-3 text-destructive" />
                  Suppressed ({suppressedKeywords.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {suppressedKeywords.map((k) => (
                    <Badge key={k.id} variant="secondary" className="text-xs bg-destructive/10 text-destructive line-through">
                      {k.keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {pendingKeywords.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  Pending Review ({pendingKeywords.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {pendingKeywords.map((k) => (
                    <Badge key={k.id} variant="outline" className="text-xs">
                      {k.keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {keywords.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No keywords analyzed yet
              </p>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Skills & Technical Competencies</h2>
          </div>

          <RewriteControls
            onRewrite={handleRewrite}
            onShowHistory={() => setShowHistory(true)}
            onSave={handleSave}
            isLoading={rewriting || loadingContent}
            hasChanges={hasChanges}
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[250px] text-sm leading-relaxed resize-none"
            placeholder="Your skills and technical competencies..."
            disabled={rewriting || loadingContent}
          />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{content.length} characters</span>
            <span>{versions.length} versions</span>
            <span>{approvedKeywords.length} approved keywords</span>
          </div>
        </div>

        <VersionHistory
          open={showHistory}
          onOpenChange={setShowHistory}
          versions={versions}
          currentContent={content}
          onRevert={handleRevert}
        />
      </StudioLayout>
    </ResumeBuilderShell>
  );
}
