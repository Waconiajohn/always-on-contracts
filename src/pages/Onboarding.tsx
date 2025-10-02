import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const OnboardingContent = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <OnboardingWizard />
    </div>
  );
};

export default function Onboarding() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
