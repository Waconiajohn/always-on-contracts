import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ResumeOptimizer as ResumeOptimizerComponent } from "@/components/ResumeOptimizer";

const ResumeOptimizerContent = () => {
  return <ResumeOptimizerComponent />;
};

export default function ResumeOptimizer() {
  return (
    <ProtectedRoute>
      <ResumeOptimizerContent />
    </ProtectedRoute>
  );
}
