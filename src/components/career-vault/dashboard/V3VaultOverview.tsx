import type { VaultData } from "@/hooks/useVaultData";
import type { VaultStats } from "@/hooks/useVaultStats";
import { Card, CardContent } from "@/components/ui/card";

interface V3VaultOverviewProps {
  vault: VaultData;
  stats: VaultStats | null;
  benchmarkMatch?: number | null;
}

/**
 * Simple, calm overview of the Career Vault.
 * Shows primary target role + overall strength/completeness.
 */
export function V3VaultOverview({ vault, stats, benchmarkMatch }: V3VaultOverviewProps) {
  const targetRoles = ((vault.userProfile as any)?.target_roles || []) as any[];
  const primaryTarget = targetRoles[0];

  const completeness = stats?.strengthScore.total ?? 0;
  const strengthLevel = stats?.strengthScore.level ?? "Developing";
  const totalItems = stats?.totalItems ?? 0;

  return (
    <Card className="shadow-sm">
      <CardContent className="py-4 px-4 md:px-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold">Career Vault</h1>

          {primaryTarget && (
            <p className="text-sm text-muted-foreground">
              Primary target:{" "}
              <span className="font-medium">
                {primaryTarget.title || primaryTarget.role || "Target role"}
              </span>
              {primaryTarget.industry && (
                <>
                  {" "}
                  in{" "}
                  <span className="font-medium">
                    {primaryTarget.industry}
                  </span>
                </>
              )}
            </p>
          )}

          {typeof benchmarkMatch === "number" && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Benchmark match: {Math.round(benchmarkMatch)}% compared to an
              ideal candidate profile for this role.
            </p>
          )}

          <p className="text-xs text-muted-foreground max-w-xl">
            Your Career Vault is the master record of your experience, impact, and
            leadership story. We use it behind the scenes for every resume, LinkedIn
            update, and interview preparation.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold">
                  {Math.round(completeness)}%
                </span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              Overall vault strength
            </span>
          </div>

          <div className="border-l pl-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Readiness rating
            </div>
            <div className="font-semibold text-sm">{strengthLevel}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalItems} career data points analyzed across roles, results, and strengths.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
