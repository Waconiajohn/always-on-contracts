import { useParams } from 'react-router-dom';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { Badge } from '@/components/ui/badge';

export default function SkillsPage() {
  const { projectId: _projectId } = useParams<{ projectId: string }>();

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Original Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">Example Skill</Badge>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Skills</h2>
          <p className="text-sm text-muted-foreground">
            Skills editor coming in next phase
          </p>
        </div>
      </StudioLayout>
    </ResumeBuilderShell>
  );
}
