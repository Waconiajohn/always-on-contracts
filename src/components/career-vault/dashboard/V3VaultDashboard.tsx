import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useVaultData } from "@/hooks/useVaultData";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

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

  const vaultId = (vaultData.vault as any)?.id;

  return (
    <div className="space-y-4 pb-8">
      <V3VaultOverview vault={vaultData} stats={stats} />

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
