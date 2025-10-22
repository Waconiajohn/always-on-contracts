import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, X } from "lucide-react";

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

  return (
    <Card className={`p-4 ${getStatusColor()}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-semibold">What You Have</h3>
        </div>
        {vaultMatches.length > 0 ? (
          <ul className="space-y-2">
            {vaultMatches.slice(0, 3).map((match, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{match.content || match.text}</span>
              </li>
            ))}
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
