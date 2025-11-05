import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CompactVaultStatsProps {
  strengthScore: number;
  level: 'Developing' | 'Solid' | 'Strong' | 'Elite' | 'Exceptional';
  totalItems: number;
  verifiedPercentage: number;
  dataQuality: string; // A+, A, B+, B, C, etc.
  dataFreshness: string; // A+, A, B+, B, C, etc.
  marketRank?: string; // "Top 35%", etc.
  coreScores?: {
    powerPhrases: number;
    skills: number;
    competencies: number;
    intangibles: number;
    quantification: number;
    modernTerms: number;
  };
}

export function CompactVaultStats({
  strengthScore,
  level,
  totalItems,
  verifiedPercentage,
  dataQuality,
  dataFreshness,
  marketRank,
  coreScores,
}: CompactVaultStatsProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getLevelColor = () => {
    if (level === 'Exceptional') return 'bg-purple-600';
    if (level === 'Elite') return 'bg-indigo-600';
    if (level === 'Strong') return 'bg-blue-600';
    if (level === 'Solid') return 'bg-green-600';
    return 'bg-slate-600';
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        {/* Compact Stats Row */}
        <div className="flex items-center justify-between gap-6 flex-wrap">
          {/* Vault Score */}
          <div className="flex items-center gap-3">
            <Badge className={`${getLevelColor()} text-white text-lg px-4 py-1`}>
              {strengthScore}/100
            </Badge>
            <div className="text-left">
              <div className="font-semibold text-slate-900">{level}</div>
              <div className="text-xs text-slate-600">Vault Score</div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-slate-200 hidden md:block" />

          {/* Total Items */}
          <div className="text-center">
            <div className="font-semibold text-lg text-slate-900">{totalItems}</div>
            <div className="text-xs text-slate-600">Intelligence Items</div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-slate-200 hidden md:block" />

          {/* Verified Percentage */}
          <div className="text-center">
            <div className="font-semibold text-lg text-slate-900">{verifiedPercentage}%</div>
            <div className="text-xs text-slate-600">Verified</div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-slate-200 hidden md:block" />

          {/* Data Quality */}
          <div className="text-center">
            <div className="font-semibold text-lg text-slate-900">{dataQuality}</div>
            <div className="text-xs text-slate-600">Quality</div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-slate-200 hidden md:block" />

          {/* Data Freshness */}
          <div className="text-center">
            <div className="font-semibold text-lg text-slate-900">{dataFreshness}</div>
            <div className="text-xs text-slate-600">Freshness</div>
          </div>

          {/* Market Rank (if available) */}
          {marketRank && (
            <>
              <div className="h-12 w-px bg-slate-200 hidden md:block" />
              <div className="text-center">
                <div className="font-semibold text-lg text-slate-900">{marketRank}</div>
                <div className="text-xs text-slate-600">Market Rank</div>
              </div>
            </>
          )}

          {/* Expand Details Button */}
          <div className="ml-auto">
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-600">
                  Details
                  {detailsOpen ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        {/* Expandable Details */}
        {coreScores && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleContent>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Category Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Power Phrases:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.powerPhrases}/10
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Skills:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.skills}/10
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Competencies:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.competencies}/10
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Intangibles:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.intangibles}/40
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Quantification:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.quantification}/15
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Modern Terms:</span>
                    <span className="font-medium text-slate-900">
                      {coreScores.modernTerms}/15
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                  <p>
                    <strong>Score Calculation:</strong> Based on quality tiers
                    (Gold/Silver/Bronze/Assumed), item freshness (last 30 days), and
                    category-specific metrics.
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

/**
 * Helper to calculate letter grade from quality percentage
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  return 'F';
}
