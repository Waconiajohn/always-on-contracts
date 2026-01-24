import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { RewriteControls } from '@/components/resume-builder/RewriteControls';
import { VersionHistory } from '@/components/resume-builder/VersionHistory';
import { Textarea } from '@/components/ui/textarea';
import { useRewriteSection, useVersionHistory, useSectionContent } from '@/hooks/useRewriteSection';
import type { ActionSource } from '@/types/resume-builder';

const SECTION_NAME = 'education';

export default function EducationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showHistory, setShowHistory] = useState(false);

  const { content, setContent, originalContent, isLoading: loadingContent, loadContent } = 
    useSectionContent(projectId || '', SECTION_NAME);
  const { versions, loadVersions, revertToVersion } = 
    useVersionHistory(projectId || '', SECTION_NAME);
  const { rewrite, isLoading: rewriting } = useRewriteSection();

  useEffect(() => {
    loadContent();
    loadVersions();
  }, [loadContent, loadVersions]);

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
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Original Education</h3>
            {originalContent ? (
              <p className="text-sm whitespace-pre-wrap">{originalContent}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No original education section found
              </p>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Education & Certifications</h2>
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
            className="min-h-[200px] text-sm leading-relaxed resize-none"
            placeholder="Your education and certifications..."
            disabled={rewriting || loadingContent}
          />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{content.length} characters</span>
            <span>{versions.length} versions</span>
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
