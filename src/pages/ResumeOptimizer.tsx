import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGate } from "@/components/ModuleGate";
import { ResumeMatchWorkspace } from "@/components/resume-match";
import { OptimizerErrorBoundary } from "@/components/resume-optimizer/components/OptimizerErrorBoundary";
import { useOptimizerStore } from "@/stores/optimizerStore";

const ResumeOptimizerContent = () => {
  return (
    <div className="container mx-auto py-6 px-4 h-[calc(100vh-4rem)]">
      <ResumeMatchWorkspace className="h-full" />
    </div>
  );
};

export default function ResumeOptimizer() {
  const clearSession = useOptimizerStore(state => state.clearSession);
  
  return (
    <ProtectedRoute>
      <ModuleGate module="resume_jobs_studio">
        <OptimizerErrorBoundary onReset={clearSession}>
          <ResumeOptimizerContent />
        </OptimizerErrorBoundary>
      </ModuleGate>
    </ProtectedRoute>
  );
}
