import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useMasterResume, useMasterResumeHistory } from "@/hooks/useMasterResume";
import { MasterResumeViewer } from "@/components/master-resume/MasterResumeViewer";
import { MasterResumeEditor } from "@/components/master-resume/MasterResumeEditor";
import { MasterResumeHistory } from "@/components/master-resume/MasterResumeHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, FileText, Plus, ArrowRight, Sparkles } from "lucide-react";

const MasterResumeContent = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  const { 
    masterResume, 
    isLoading, 
    createMasterResume, 
    updateMasterResume,
    isCreating,
    isUpdating 
  } = useMasterResume();
  
  const { history, isLoading: isLoadingHistory } = useMasterResumeHistory();

  const handleSave = (content: string) => {
    if (masterResume) {
      updateMasterResume({ content });
    } else {
      createMasterResume(content);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No master resume yet - show onboarding
  if (!masterResume && !isEditing) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 text-center">
          <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Create Your Master Resume</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Your Master Resume is a comprehensive document containing everything you've ever accomplished. 
            It's the source of truth for all your tailored resumes.
          </p>

          <div className="grid gap-4 text-left max-w-md mx-auto mb-8">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Start comprehensive</p>
                <p className="text-sm text-muted-foreground">
                  Include all experience, skills, and achievements
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Grows automatically</p>
                <p className="text-sm text-muted-foreground">
                  New content from tailored resumes gets suggested back
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Powers your applications</p>
                <p className="text-sm text-muted-foreground">
                  Use it as the starting point for every tailored resume
                </p>
              </div>
            </div>
          </div>

        <Button size="lg" onClick={() => setIsEditing(true)} className="gap-2">
            <Plus className="h-5 w-5" />
            Create Master Resume
          </Button>
        </Card>
      </div>
    );
  }

  // Editing mode
  if (isEditing || !masterResume) {
    return (
      <div className="max-w-4xl mx-auto">
        <MasterResumeEditor
          resume={masterResume ?? null}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isSaving={isCreating || isUpdating}
        />
      </div>
    );
  }

  // Viewing mode
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Master Resume</h1>
          <p className="text-muted-foreground">
            Your complete career history in one place
          </p>
        </div>
        <Button onClick={() => navigate("/resume-jobs")} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          Build Tailored Resume
        </Button>
      </div>

      {masterResume && (
        <MasterResumeViewer 
          resume={masterResume} 
          onEdit={() => setIsEditing(true)} 
        />
      )}

      <MasterResumeHistory 
        history={history || []} 
        isLoading={isLoadingHistory} 
      />
    </div>
  );
};

export default function MasterResume() {
  return (
    <ProtectedRoute>
      <ContentLayout>
        <MasterResumeContent />
      </ContentLayout>
    </ProtectedRoute>
  );
}
