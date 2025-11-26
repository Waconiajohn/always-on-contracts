import { ProtectedRoute } from "@/components/ProtectedRoute";
import CareerCompassWizard from "@/components/career-vault/CareerCompassWizard";

export default function Onboarding() {
  return (
    <ProtectedRoute>
      <CareerCompassWizard />
    </ProtectedRoute>
  );
}
