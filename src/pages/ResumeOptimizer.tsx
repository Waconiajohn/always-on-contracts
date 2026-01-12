import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGate } from "@/components/ModuleGate";
import { ResumeMatchWorkspace } from "@/components/resume-match";
import { ResumeBuilderErrorBoundary } from "@/components/resume-builder-v3/components/ErrorBoundary";

const ResumeOptimizerContent = () => {
  return (
    <div className="container mx-auto py-6 px-4 h-[calc(100vh-4rem)]">
      <ResumeMatchWorkspace className="h-full" />
    </div>
  );
};

export default function ResumeOptimizer() {
  return (
    <ProtectedRoute>
      <ModuleGate module="resume_jobs_studio">
        <ResumeBuilderErrorBoundary>
          <ResumeOptimizerContent />
        </ResumeBuilderErrorBoundary>
      </ModuleGate>
    </ProtectedRoute>
  );
}
