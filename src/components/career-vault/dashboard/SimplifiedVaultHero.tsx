import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Rocket, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SimplifiedVaultHeroProps {
  strengthScore: number;
  level: 'Developing' | 'Solid' | 'Strong' | 'Elite' | 'Exceptional';
  totalItems: number;
  verifiedPercentage: number;
  quickWinsCount: number;
  hasQuickWins: boolean;
  onPrimaryCTA: () => void;
  primaryCTALabel?: string;
  coreScores?: {
    powerPhrases: number;
    skills: number;
    competencies: number;
    intangibles: number;
    quantification: number;
    modernTerms: number;
  };
}

export function SimplifiedVaultHero({
  strengthScore,
  level,
  totalItems,
  verifiedPercentage,
  quickWinsCount,
  hasQuickWins,
  onPrimaryCTA,
  primaryCTALabel,
  coreScores,
}: SimplifiedVaultHeroProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Calculate percentile from strength score
  const percentile = Math.min(95, Math.floor(strengthScore / 1.5));
  const getPercentileLabel = () => {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Top 50%';
    return `Top ${100 - percentile}%`;
  };

  // Get level color
  const getLevelColor = () => {
    if (level === 'Exceptional') return 'bg-purple-600';
    if (level === 'Elite') return 'bg-indigo-600';
    if (level === 'Strong') return 'bg-blue-600';
    if (level === 'Solid') return 'bg-green-600';
    return 'bg-slate-600';
  };

  // Get default CTA label
  const getDefaultCTALabel = () => {
    if (hasQuickWins) {
      return `Complete ${quickWinsCount} Quick Wins → Elite (90+)`;
    }
    return 'Deploy Vault (Build Resume)';
  };

  const ctaLabel = primaryCTALabel || getDefaultCTALabel();

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
      <CardContent className="p-6">
        {/* Single Focus: Vault Strength */}
        <div className="text-center mb-4">
          <Badge className={`${getLevelColor()} text-white text-2xl px-6 py-2 mb-3`}>
            {strengthScore}/100
          </Badge>
          <h2 className="text-lg text-slate-700 font-medium">
            {level} • {getPercentileLabel()} of Professionals
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Progress value={strengthScore} className="h-3" />
        </div>

        {/* Key Stats (Compact) */}
        <div className="flex justify-around text-sm mb-4 py-3 bg-white/50 rounded-lg">
          <div className="text-center">
            <p className="font-semibold text-lg text-slate-900">{totalItems}</p>
            <p className="text-slate-600 text-xs">Intelligence Items</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg text-slate-900">{verifiedPercentage}%</p>
            <p className="text-slate-600 text-xs">Verified</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg text-slate-900">{quickWinsCount}</p>
            <p className="text-slate-600 text-xs">Quick Wins</p>
          </div>
        </div>

        {/* Single Primary CTA */}
        <Button
          size="lg"
          className="w-full h-auto py-3 bg-indigo-600 hover:bg-indigo-700"
          onClick={onPrimaryCTA}
        >
          <div className="flex items-center gap-2">
            {hasQuickWins ? (
              <Target className="h-5 w-5" />
            ) : (
              <Rocket className="h-5 w-5" />
            )}
            <span className="font-medium">{ctaLabel}</span>
          </div>
          <ArrowRight className="ml-auto h-5 w-5" />
        </Button>

        {/* Expandable Details */}
        {coreScores && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full mt-3 text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1">
                View score breakdown
                {detailsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-4 bg-white/70 rounded-lg space-y-2">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Category Scores
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Power Phrases:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.powerPhrases}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Skills:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.skills}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Competencies:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.competencies}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Intangibles:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.intangibles}/40
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Quantification:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.quantification}/15
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Modern Terms:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.modernTerms}/15
                    </span>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200 text-xs text-slate-600">
                  <p>
                    <strong>How it's calculated:</strong> Based on quality tiers (Gold/Silver/Bronze/Assumed),
                    freshness (items updated in last 30 days), and category-specific metrics.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
