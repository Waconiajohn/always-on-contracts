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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-lg">
      <CardContent className="py-6 px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/40 rounded-full" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Career Vault
              </h1>
            </div>

            {primaryTarget && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Primary target:</span>
                <span className="font-semibold text-lg">
                  {primaryTarget.title || primaryTarget.role || "Target role"}
                </span>
                {primaryTarget.industry && (
                  <>
                    <span className="text-muted-foreground">in</span>
                    <span className="font-semibold text-lg text-primary">
                      {primaryTarget.industry}
                    </span>
                  </>
                )}
              </div>
            )}

            {typeof benchmarkMatch === "number" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {Math.round(benchmarkMatch)}% benchmark match
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Your Career Vault is the master record of your experience, impact, and
              leadership story. We use it behind the scenes for every resume, LinkedIn
              update, and interview preparation.
            </p>
          </div>

          <div className="flex items-center gap-6 justify-center lg:justify-end">
            <div className="relative">
              <div className="h-32 w-32">
                <svg className="transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted opacity-20"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${completeness * 3.39} 339`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--primary) / 0.5)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                      {Math.round(completeness)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Readiness
              </div>
              <div className="text-xl font-bold">{strengthLevel}</div>
              <div className="text-sm text-muted-foreground">
                {totalItems} data points
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
