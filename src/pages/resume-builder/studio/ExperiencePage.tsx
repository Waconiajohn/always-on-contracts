import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { RewriteControls } from '@/components/resume-builder/RewriteControls';
import { VersionHistory } from '@/components/resume-builder/VersionHistory';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useRewriteSection, useVersionHistory, useSectionContent } from '@/hooks/useRewriteSection';
import type { ActionSource, RBEvidence } from '@/types/resume-builder';

const SECTION_NAME = 'experience';

export default function ExperiencePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showHistory, setShowHistory] = useState(false);
  const [evidence, setEvidence] = useState<RBEvidence[]>([]);

  const { content, setContent, originalContent, isLoading: loadingContent, loadContent } = 
    useSectionContent(projectId || '', SECTION_NAME);
  const { versions, loadVersions, revertToVersion } = 
    useVersionHistory(projectId || '', SECTION_NAME);
  const { rewrite, isLoading: rewriting } = useRewriteSection();

  useEffect(() => {
    loadContent();
    loadVersions();
    loadEvidence();
  }, [loadContent, loadVersions, projectId]);

  const loadEvidence = async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('rb_evidence')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('confidence', { ascending: false });
    
    setEvidence((data as unknown as RBEvidence[]) || []);
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

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Verified Evidence</h3>
            
            {evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No evidence extracted yet
              </p>
            ) : (
              <div className="space-y-2">
                {evidence.slice(0, 10).map((item) => (
                  <Card key={item.id} className="p-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium">{item.claim_text}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(Number(item.confidence || 0) * 100)}% conf
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
                {evidence.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{evidence.length - 10} more
                  </p>
                )}
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Work Experience</h2>
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
            className="min-h-[400px] text-sm leading-relaxed resize-none font-mono"
            placeholder="Your work experience..."
            disabled={rewriting || loadingContent}
          />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{content.length} characters</span>
            <span>{versions.length} versions</span>
            <span>{evidence.length} evidence items</span>
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
