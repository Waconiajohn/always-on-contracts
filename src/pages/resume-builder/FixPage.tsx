import { useParams, useNavigate } from 'react-router-dom';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Construction } from 'lucide-react';

export default function FixPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <ResumeBuilderShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fix Issues</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Address missing keywords and ATS compatibility issues
            </p>
          </div>
          <Button onClick={() => navigate(`/resume-builder/${projectId}/studio/summary`)}>
            Continue to Rewrite
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <Card className="text-center">
          <CardContent className="pt-12 pb-12 space-y-4">
            <Construction className="h-16 w-16 mx-auto text-muted-foreground" />
            <CardTitle>Fix-It Mode</CardTitle>
            <p className="text-muted-foreground">
              Keyword chips and ATS fixes coming in next phase
            </p>
          </CardContent>
        </Card>
      </div>
    </ResumeBuilderShell>
  );
}
