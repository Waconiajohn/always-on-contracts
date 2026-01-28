import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { RewriteControls } from '@/components/resume-builder/RewriteControls';
import { VersionHistory } from '@/components/resume-builder/VersionHistory';
import { EvidenceSidebar } from '@/components/resume-builder/EvidenceSidebar';
import { BulletEditor } from '@/components/resume-builder/BulletEditor';
import { TwoStageGenerationDialog } from '@/components/resume-builder/TwoStageGenerationDialog';
import { useStudioPageData } from '@/hooks/useStudioPageData';

const SECTION_NAME = 'education';

export default function EducationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showTwoStage, setShowTwoStage] = useState(false);

  const {
    content,
    setContent,
    evidence,
    project,
    versions,
    showHistory,
    setShowHistory,
    hasChanges,
    isLoading,
    handleRewrite,
    handleSave,
    handleRevert,
    evidenceContext,
    saveStatus,
    lastSaved,
  } = useStudioPageData({ projectId: projectId || '', sectionName: SECTION_NAME });

  const handleWorldClassContent = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={<EvidenceSidebar evidence={evidence} />}
        score={project?.current_score}
        previousScore={project?.original_score}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Education & Certifications</h2>

          <RewriteControls
            onRewrite={handleRewrite}
            onShowHistory={() => setShowHistory(true)}
            onSave={handleSave}
            onWorldClass={() => setShowTwoStage(true)}
            isLoading={isLoading}
            hasChanges={hasChanges}
          />

          <BulletEditor
            content={content}
            onContentChange={setContent}
            disabled={isLoading}
            placeholder="Your education and certifications..."
            context={{
              job_title: project?.role_title || undefined,
              section_name: SECTION_NAME,
            }}
            evidenceClaims={evidenceContext}
          />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

      <TwoStageGenerationDialog
        open={showTwoStage}
        onOpenChange={setShowTwoStage}
        projectId={projectId || ''}
        sectionName={SECTION_NAME}
        roleTitle={project?.role_title || 'Professional'}
        seniorityLevel={project?.seniority_level || 'Mid-Level'}
        industry={project?.industry || 'Technology'}
        jobDescription={project?.jd_text || ''}
        onContentSelect={handleWorldClassContent}
      />
    </ResumeBuilderShell>
  );
}
