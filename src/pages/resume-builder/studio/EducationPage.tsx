import { useParams } from 'react-router-dom';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { GraduationCap } from 'lucide-react';

export default function EducationPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Original Education</h3>
            <p className="text-sm text-muted-foreground italic">
              Education content will appear here
            </p>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Education</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Education editor coming in next phase
          </p>
        </div>
      </StudioLayout>
    </ResumeBuilderShell>
  );
}
