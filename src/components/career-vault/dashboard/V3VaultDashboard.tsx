import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useVaultData } from "@/hooks/useVaultData";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useVaultAssessment } from "@/hooks/useVaultAssessment";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import { V3VaultOverview } from "./V3VaultOverview";
import { V3SmartQuestionPanel } from "./V3SmartQuestionPanel";
import { V3VaultDetailTabs } from "./V3VaultDetailTabs";

/**
 * Career Vault V3: Calm, smart, ongoing improvement.
 * 
 * Design principles:
 * - One smart question at a time (right panel)
 * - Simple overview of what's in the vault (below)
 * - No big modal flows, no overwhelming dashboards
 * - Everything is additive: answering questions strengthens the vault over time
 */
function V3VaultDashboardContent() {
  const { user } = useAuth();
  const { data: vaultData, isLoading, refetch } = useVaultData(user?.id);
  const stats = useVaultStats(vaultData);
  const { assessment, assessVaultQuality, isAssessing } = useVaultAssessment();
  const navigate = useNavigate();

  const vaultId = (vaultData?.vault as any)?.id;

  // Fetch assessment on mount
  useEffect(() => {
    if (vaultId && !assessment && !isAssessing) {
      void assessVaultQuality(vaultId);
    }
  }, [vaultId, assessment, isAssessing, assessVaultQuality]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vaultData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No Career Vault found. Please upload a resume to get started.
        </p>
      </div>
    );
  }

  const benchmarkMatch = assessment?.competitive_percentile;
  const vaultStrength = stats?.strengthScore.total ?? 0;

  return (
    <div className="space-y-4 pb-8">
      <V3VaultOverview 
        vault={vaultData} 
        stats={stats} 
        benchmarkMatch={benchmarkMatch}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <V3VaultDetailTabs vault={vaultData} />
        </div>

        <div className="lg:col-span-1">
          {vaultId && (
            <V3SmartQuestionPanel
              vaultId={vaultId}
              onVaultUpdated={() => refetch()}
            />
          )}
        </div>
      </div>

      {/* Next-step CTA */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3 border-t pt-4 text-sm">
        <span className="text-muted-foreground">
          {vaultStrength < 70
            ? "A few more quick answers will make your Career Vault even more compelling before you generate targeted resumes."
            : "Your Career Vault is in strong shape. You're ready to generate targeted resumes and refresh LinkedIn."}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/resume-builder")}
          >
            Build a targeted resume
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              document
                .getElementById("smart-question-panel")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Strengthen my vault
          </Button>
        </div>
      </div>
    </div>
  );
}

export function V3VaultDashboard() {
  return (
    <ProtectedRoute>
      <ContentLayout maxWidth="container" className="py-6">
        <V3VaultDashboardContent />
      </ContentLayout>
    </ProtectedRoute>
  );
}
