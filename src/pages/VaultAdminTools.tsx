import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultData } from "@/hooks/useVaultData";
import { Loader2 } from "lucide-react";

// Internal maintenance and management tools
import { VaultNuclearReset } from "@/components/career-vault/VaultNuclearReset";
import { VaultMigrationTool } from "@/components/career-vault/VaultMigrationTool";
import { AutoDuplicateCleanup } from "@/components/career-vault/AutoDuplicateCleanup";
import { FreshnessManager } from "@/components/career-vault/FreshnessManager";
import AdvancedVaultSearch from "@/components/career-vault/AdvancedVaultSearch";

function VaultAdminToolsContent() {
  const { user } = useAuth();
  const { data: vaultData, isLoading } = useVaultData(user?.id);
  const vaultId = (vaultData?.vault as any)?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vaultId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No Career Vault found. These tools require an existing vault to operate on.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Career Vault Admin Tools</h1>
        <p className="text-sm text-muted-foreground">
          Internal utilities for managing and maintaining Career Vault data. These tools are for development and admin use only.
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">Admin-Only Tools</p>
              <p className="text-amber-800 dark:text-amber-300">
                These tools can modify or delete vault data. Use with caution and only when necessary for maintenance or debugging.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search & Browse</CardTitle>
          <CardDescription>Advanced search and filtering of vault data</CardDescription>
        </CardHeader>
        <CardContent>
          <AdvancedVaultSearch vaultId={vaultId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Maintenance</CardTitle>
          <CardDescription>Tools for cleaning and maintaining vault data integrity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Duplicate Cleanup</h3>
            <AutoDuplicateCleanup vaultId={vaultId} />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Freshness Manager</h3>
            <FreshnessManager vaultId={vaultId} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Migration & Recovery</CardTitle>
          <CardDescription>Tools for migrating vault data and schema updates</CardDescription>
        </CardHeader>
        <CardContent>
          <VaultMigrationTool vaultId={vaultId} />
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-red-900 dark:text-red-200">Danger Zone</CardTitle>
          <CardDescription className="text-red-800 dark:text-red-300">
            Destructive operations that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VaultNuclearReset vaultId={vaultId} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function VaultAdminTools() {
  return (
    <ProtectedRoute>
      <ContentLayout maxWidth="container" className="py-6">
        <VaultAdminToolsContent />
      </ContentLayout>
    </ProtectedRoute>
  );
}
