import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { RewriteControls } from '@/components/resume-builder/RewriteControls';
import { VersionHistory } from '@/components/resume-builder/VersionHistory';
import { TwoStageGenerationDialog } from '@/components/resume-builder/TwoStageGenerationDialog';
import { Textarea } from '@/components/ui/textarea';
import { useStudioPageData } from '@/hooks/useStudioPageData';

const SECTION_NAME = 'summary';

function OriginalContentPanel({ content }: { content: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Original Summary</h3>
      {content ? (
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No original summary found
        </p>
      )}
    </div>
  );
}

export default function SummaryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showTwoStage, setShowTwoStage] = useState(false);

  const {
    content,
    setContent,
    project,
    versions,
    showHistory,
    setShowHistory,
    hasChanges,
    isLoading,
    handleRewrite,
    handleSave,
    handleRevert,
    saveStatus,
    lastSaved,
  } = useStudioPageData({ projectId: projectId || '', sectionName: SECTION_NAME });

  // Get original content from first version or empty
  const originalContent = versions.length > 0 
    ? versions[versions.length - 1]?.content || '' 
    : '';

  const handleWorldClassContent = (newContent: string) => {
    setContent(newContent);
  };

  // Fix 7: Strengthen validation - show error instead of using fallbacks
  const handleWorldClass = () => {
    if (!project?.jd_text) {
      toast.error('Please add a job description first');
      return;
    }
    if (!project?.role_title) {
      toast.error('Please confirm your target role first');
      return;
    }
    if (!project?.industry) {
      toast.error('Please confirm your target industry first');
      return;
    }
    if (!project?.seniority_level) {
      toast.error('Please confirm your seniority level first');
      return;
    }
    setShowTwoStage(true);
  };

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={<OriginalContentPanel content={originalContent} />}
        score={project?.current_score}
        previousScore={project?.original_score}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Professional Summary</h2>

          <RewriteControls
            onRewrite={handleRewrite}
            onShowHistory={() => setShowHistory(true)}
            onSave={handleSave}
            onWorldClass={handleWorldClass}
            isLoading={isLoading}
            hasChanges={hasChanges}
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] text-sm leading-relaxed resize-none"
            placeholder="Your professional summary..."
            disabled={isLoading}
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

      {/* Only render dialog when all required data is present */}
      {project?.role_title && project?.industry && project?.seniority_level && project?.jd_text && (
        <TwoStageGenerationDialog
          open={showTwoStage}
          onOpenChange={setShowTwoStage}
          projectId={projectId || ''}
          sectionName={SECTION_NAME}
          roleTitle={project.role_title}
          seniorityLevel={project.seniority_level}
          industry={project.industry}
          jobDescription={project.jd_text}
          onContentSelect={handleWorldClassContent}
        />
      )}
    </ResumeBuilderShell>
  );
}
