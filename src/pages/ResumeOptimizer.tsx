import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGate } from "@/components/ModuleGate";
import { ResumeOptimizer as ResumeOptimizerComponent } from "@/components/ResumeOptimizer";

const ResumeOptimizerContent = () => {
  return <ResumeOptimizerComponent />;
};

export default function ResumeOptimizer() {
  return (
    <ProtectedRoute>
      <ModuleGate module="resume_jobs_studio">
        <ResumeOptimizerContent />
      </ModuleGate>
    </ProtectedRoute>
  );
}
