import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { VaultData } from '@/hooks/useVaultData';
import { getStrengthLevel } from '@/lib/utils/vaultQualitativeHelpers';

interface V3VaultBuilderHeroProps {
  vaultData: VaultData;
  overallPercentage: number;
}

export function V3VaultBuilderHero({
  vaultData,
  overallPercentage
}: V3VaultBuilderHeroProps) {
  const targetRoles = ((vaultData.userProfile as any)?.target_roles || []) as any[];
  const primaryTarget = targetRoles[0];
  const targetRoleTitle = primaryTarget?.title || primaryTarget?.role || 'your target role';
  const targetIndustry = primaryTarget?.industry;
  
  const strengthLevel = getStrengthLevel(overallPercentage);

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 rounded-lg p-8 md:p-12">
      <Badge variant="outline" className="mb-4">Your Career Vault</Badge>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-2">
        {targetRoleTitle}
      </h1>
      {targetIndustry && (
        <p className="text-xl text-muted-foreground mb-6">in {targetIndustry}</p>
      )}
      
      <p className="text-base max-w-3xl mb-8 leading-relaxed">
        Build a comprehensive career profile that showcases your experience 
        against industry benchmarks. Your vault powers AI-generated resumes, 
        interview preparation, and personalized job matching.
      </p>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Your Progress</p>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-5xl font-bold">{Math.round(overallPercentage)}%</span>
            <Badge variant="outline" className={`text-base ${strengthLevel.textColor}`}>
              {strengthLevel.level}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{strengthLevel.description}</p>
          <Progress value={overallPercentage} className="h-3" />
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-2">What This Unlocks</p>
          <ul className="space-y-2 text-base">
            <li className={overallPercentage >= 40 ? "text-foreground" : "text-muted-foreground"}>
              {overallPercentage >= 40 ? "✓" : "⏳"} AI resume generation
            </li>
            <li className={overallPercentage >= 60 ? "text-foreground" : "text-muted-foreground"}>
              {overallPercentage >= 60 ? "✓" : "⏳"} Interview preparation
            </li>
            <li className={overallPercentage >= 85 ? "text-foreground" : "text-muted-foreground"}>
              {overallPercentage >= 85 ? "✓" : "⏳"} Advanced job matching
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
