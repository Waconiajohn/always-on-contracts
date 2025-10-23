import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, X, Award, Clock } from "lucide-react";

interface VaultMatchesDisplayProps {
  vaultMatches: any[];
  matchStatus: string;
  requirement: any;
}

export const VaultMatchesDisplay = ({ vaultMatches, matchStatus }: VaultMatchesDisplayProps) => {
  const getStatusIcon = () => {
    if (matchStatus === 'perfect_match') return <Check className="h-5 w-5 text-green-600" />;
    if (matchStatus === 'partial_match') return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    return <X className="h-5 w-5 text-red-600" />;
  };

  const getStatusColor = () => {
    if (matchStatus === 'perfect_match') return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    if (matchStatus === 'partial_match') return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
  };

  const getQualityBadge = (tier: string) => {
    const badges = {
      gold: { icon: Award, color: 'text-yellow-600 dark:text-yellow-400', label: 'Gold Quality' },
      silver: { icon: Award, color: 'text-gray-600 dark:text-gray-400', label: 'Silver Quality' },
      bronze: { icon: Award, color: 'text-orange-600 dark:text-orange-400', label: 'Bronze Quality' },
      assumed: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', label: 'Assumed' }
    };
    return badges[tier as keyof typeof badges] || badges.assumed;
  };

  return (
    <Card className={`p-4 ${getStatusColor()}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-semibold">What You Have</h3>
        </div>
        {vaultMatches.length > 0 ? (
          <ul className="space-y-2">
            {vaultMatches.slice(0, 3).map((match, idx) => {
              const quality = getQualityBadge(match.qualityTier || 'assumed');
              const QualityIcon = quality.icon;
              const daysSinceUpdate = match.last_updated_at 
                ? Math.floor((Date.now() - new Date(match.last_updated_at).getTime()) / (1000 * 60 * 60 * 24))
                : null;
              
              return (
                <li key={idx} className="text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    <div className="flex-1">
                      <span>{match.content || match.text || match.stated_skill || match.inferred_from || 'Vault item'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <QualityIcon className={`h-3 w-3 ${quality.color}`} />
                        <span className={`text-xs ${quality.color}`}>{quality.label}</span>
                        {daysSinceUpdate !== null && daysSinceUpdate > 180 && (
                          <>
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-600">Stale ({daysSinceUpdate}d)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No direct matches in Career Vault</p>
        )}
        <Badge variant="outline" className="mt-2">
          Status: {matchStatus.replace('_', ' ')}
        </Badge>
      </div>
    </Card>
  );
};
