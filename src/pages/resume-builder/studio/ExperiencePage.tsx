import { useParams } from 'react-router-dom';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';

export default function ExperiencePage() {
  const { projectId: _projectId, jobId: _jobId } = useParams<{ projectId: string; jobId?: string }>();

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Original Experience</h3>
            <p className="text-sm text-muted-foreground italic">
              Experience content will appear here
            </p>
          </div>
        }
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Work Experience</h2>
          <p className="text-sm text-muted-foreground">
            Experience editor coming in next phase
          </p>
        </div>
      </StudioLayout>
    </ResumeBuilderShell>
  );
}
