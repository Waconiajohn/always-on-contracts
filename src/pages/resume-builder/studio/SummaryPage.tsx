import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { RewriteControls } from '@/components/resume-builder/RewriteControls';
import { VersionHistory } from '@/components/resume-builder/VersionHistory';
import { OriginalAndEvidencePanel } from '@/components/resume-builder/OriginalAndEvidencePanel';
import { TwoStageGenerationDialog } from '@/components/resume-builder/TwoStageGenerationDialog';
import { Textarea } from '@/components/ui/textarea';
import { useStudioPageData } from '@/hooks/useStudioPageData';

const SECTION_NAME = 'summary';

export default function SummaryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showTwoStage, setShowTwoStage] = useState(false);

  const {
    content,
    setContent,
    evidence,
    project,
    versions,
    originalSectionContent,
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

  const handleWorldClassContent = (newContent: string) => {
    setContent(newContent);
  };

  // Validate before opening World-Class dialog
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
        leftPanel={
          <OriginalAndEvidencePanel
            originalContent={originalSectionContent}
            evidence={evidence}
            sectionName={SECTION_NAME}
          />
        }
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
