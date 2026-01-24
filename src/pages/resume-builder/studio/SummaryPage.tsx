import { useParams } from 'react-router-dom';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { Textarea } from '@/components/ui/textarea';

export default function SummaryPage() {
  const { projectId: _projectId } = useParams<{ projectId: string }>();

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Original Summary</h3>
            <p className="text-sm text-muted-foreground italic">
              Summary content will appear here
            </p>
          </div>
        }
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Professional Summary</h2>
          <Textarea
            className="min-h-[200px] text-sm leading-relaxed resize-none"
            placeholder="Your professional summary..."
          />
          <p className="text-xs text-muted-foreground">
            Rewrite controls coming in next phase
          </p>
        </div>
      </StudioLayout>
    </ResumeBuilderShell>
  );
}
