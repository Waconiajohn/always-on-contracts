import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, AlertTriangle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface QualityTierExplainerProps {
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  assumedCount: number;
  totalItems: number;
  onVerifyAssumed?: () => void;
}

export const QualityTierExplainer = ({
  goldCount,
  silverCount,
  bronzeCount,
  assumedCount,
  totalItems,
  onVerifyAssumed
}: QualityTierExplainerProps) => {
  const verifiedCount = goldCount + silverCount + bronzeCount;
  const verifiedPercentage = totalItems > 0 ? (verifiedCount / totalItems) * 100 : 0;

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Info className="h-4 w-4" />
      <AlertTitle className="text-lg font-semibold mb-4">Your Vault Quality Score</AlertTitle>
      <AlertDescription>
        <div className="space-y-4">
          {/* Quality Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Verified Items</span>
              <span className="text-sm text-muted-foreground">{verifiedCount} of {totalItems} ({Math.round(verifiedPercentage)}%)</span>
            </div>
            <Progress value={verifiedPercentage} className="h-2" />
          </div>

          {/* Tier Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Gold */}
            <div className="bg-card rounded-lg p-3 border-2 border-tier-gold">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-tier-gold" />
                <span className="font-semibold text-sm">Gold</span>
              </div>
              <div className="text-2xl font-bold text-tier-gold">{goldCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Quiz-verified (highest trust)</p>
            </div>

            {/* Silver */}
            <div className="bg-card rounded-lg p-3 border-2 border-tier-silver">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-tier-silver" />
                <span className="font-semibold text-sm">Silver</span>
              </div>
              <div className="text-2xl font-bold text-tier-silver">{silverCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Evidence-based from resume</p>
            </div>

            {/* Bronze */}
            <div className="bg-card rounded-lg p-3 border-2 border-tier-bronze">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-tier-bronze" />
                <span className="font-semibold text-sm">Bronze</span>
              </div>
              <div className="text-2xl font-bold text-tier-bronze">{bronzeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">AI-inferred from patterns</p>
            </div>

            {/* Assumed */}
            <div className="bg-card rounded-lg p-3 border-2 border-tier-assumed">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-tier-assumed" />
                <span className="font-semibold text-sm">Assumed</span>
              </div>
              <div className="text-2xl font-bold text-tier-assumed">{assumedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Needs verification</p>
            </div>
          </div>

          {/* Verification CTA */}
          {assumedCount > 0 && onVerifyAssumed && (
            <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Verify Your Assumed Items</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Take a quick 5-minute quiz to upgrade {assumedCount} assumed items to Gold quality. This dramatically improves your vault's trustworthiness and resume impact.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      +{assumedCount * 5} points
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      ~5 minutes
                    </Badge>
                  </div>
                </div>
                <Button size="sm" onClick={onVerifyAssumed}>
                  Start Quiz
                </Button>
              </div>
            </div>
          )}

          {/* What Quality Tiers Mean */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p className="font-medium">Why Quality Tiers Matter:</p>
            <ul className="space-y-1 pl-4">
              <li>• <strong>Gold items</strong> are prioritized in resume generation (+10 match boost)</li>
              <li>• <strong>Silver items</strong> are trusted facts from your resume (+5 match boost)</li>
              <li>• <strong>Bronze items</strong> are AI inferences backed by evidence (+2 boost)</li>
              <li>• <strong>Assumed items</strong> are AI guesses that need verification (no boost)</li>
            </ul>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};