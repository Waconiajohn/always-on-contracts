import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp } from "lucide-react";
import type { VaultData } from '@/hooks/useVaultData';
import { 
  getStrengthLevel, 
  getBenchmarkMatchContext, 
  getNextActionPrompt 
} from '@/lib/utils/vaultQualitativeHelpers';

interface V3VaultBuilderOverviewProps {
  vaultData: VaultData;
  overallPercentage: number;
  sections: Array<{ key: string; percentage: number; layer: number }>;
}

/**
 * V3 Vault Builder Overview - Calm, contextual header
 * Replaces gamified VaultQuickStats with benchmark-aware guidance
 */
export function V3VaultBuilderOverview({
  vaultData,
  overallPercentage,
  sections
}: V3VaultBuilderOverviewProps) {
  const targetRoles = ((vaultData.userProfile as any)?.target_roles || []) as any[];
  const primaryTarget = targetRoles[0];
  const targetRoleTitle = primaryTarget?.title || primaryTarget?.role || 'your target role';
  const targetIndustry = primaryTarget?.industry;
  
  const strengthLevel = getStrengthLevel(overallPercentage);
  const benchmarkMatchText = getBenchmarkMatchContext(
    overallPercentage,
    targetRoleTitle,
    'mid-level'
  );
  const nextActionText = getNextActionPrompt(overallPercentage, sections);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardContent className="py-6">
        <div className="space-y-4">
          {/* Primary Target Role */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Building vault for</p>
              <p className="font-semibold text-lg">
                {targetRoleTitle}
                {targetIndustry && (
                  <span className="text-muted-foreground font-normal"> in {targetIndustry}</span>
                )}
              </p>
            </div>
          </div>

          {/* Strength Level & Benchmark Match */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Qualitative Strength Level */}
            <div className={`p-4 rounded-lg ${strengthLevel.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`h-4 w-4 ${strengthLevel.textColor}`} />
                <Badge variant="outline" className={strengthLevel.textColor}>
                  {strengthLevel.level}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {strengthLevel.description}
              </p>
            </div>

            {/* Benchmark Match Context */}
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-1">Benchmark Alignment</p>
              <p className="text-xs text-muted-foreground">
                {benchmarkMatchText}
              </p>
            </div>
          </div>

          {/* Next Action Guidance */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Next step:</span> {nextActionText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
