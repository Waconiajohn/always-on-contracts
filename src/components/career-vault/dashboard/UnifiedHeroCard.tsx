import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw, Settings, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UnifiedHeroCardProps {
  score: number;
  grade: string;
  level: string;
  summary: string;
  totalItems: number;
  marketPercentile: number;
  itemsToReview: number;
  onManageResume: () => void;
  onReanalyze: () => void;
  onSettings: () => void;
  isReanalyzing?: boolean;
}

/**
 * Unified Hero Card - Single-glance vault status
 *
 * Design principles:
 * - Single source of truth for vault status
 * - Radial progress for visual impact
 * - Contextual summary (AI-powered)
 * - Quick access actions (not primary actions)
 */
export function UnifiedHeroCard({
  score,
  grade,
  level,
  summary,
  totalItems,
  marketPercentile,
  itemsToReview,
  onManageResume,
  onReanalyze,
  onSettings,
  isReanalyzing = false,
}: UnifiedHeroCardProps) {
  // Calculate percentile tier
  const getPercentileTier = (percentile: number) => {
    if (percentile >= 90) return { label: 'Top 10%', stars: 5, color: 'text-yellow-500' };
    if (percentile >= 75) return { label: 'Top 25%', stars: 4, color: 'text-yellow-500' };
    if (percentile >= 50) return { label: 'Top 50%', stars: 3, color: 'text-blue-500' };
    if (percentile >= 25) return { label: 'Top 75%', stars: 2, color: 'text-gray-500' };
    return { label: 'Below Average', stars: 1, color: 'text-gray-400' };
  };

  const tier = getPercentileTier(marketPercentile);

  // Calculate stroke for radial progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Grade color
  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A+') return 'text-green-600 bg-green-50 border-green-200';
    if (grade === 'B' || grade === 'B+') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (grade === 'C' || grade === 'C+') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <Card className="border-2 shadow-lg mb-6">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Left: Radial Progress */}
          <div className="flex-shrink-0">
            <div className="relative w-40 h-40">
              {/* Background circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-gray-200"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-primary transition-all duration-1000 ease-out"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-primary">{score}</div>
                <div className={`text-sm font-semibold px-2 py-1 rounded border ${getGradeColor(grade)}`}>
                  {grade}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Status Summary */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <h2 className="text-2xl md:text-3xl font-bold">{level}</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold">Career Level</p>
                    <p className="text-sm mt-1">
                      Based on your experience, achievements, and vault strength,
                      you're positioned for {level.toLowerCase()} opportunities.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <p className="text-base md:text-lg text-muted-foreground mb-4 max-w-2xl">
              {summary}
            </p>

            {/* Metrics Row */}
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="text-sm">
                      {totalItems} items
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total career intelligence items in your vault</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="text-sm">
                      <span className={tier.color}>
                        {'⭐'.repeat(tier.stars)}{'☆'.repeat(5 - tier.stars)}
                      </span>
                      <span className="ml-1">{tier.label}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Market Rank</p>
                    <p className="text-sm mt-1">
                      Your vault strength ranks in the {tier.label.toLowerCase()} compared to
                      professionals targeting similar roles.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {itemsToReview > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-sm border-amber-300 bg-amber-50 text-amber-700">
                        {itemsToReview} to review
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Items extracted by AI that need your review</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Right: Quick Access Actions */}
          <div className="flex md:flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onManageResume}
                    className="h-10 w-10"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Manage Resume</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onReanalyze}
                    disabled={isReanalyzing}
                    className="h-10 w-10"
                  >
                    <RefreshCw className={`h-4 w-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Re-analyze Resume</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onSettings}
                    className="h-10 w-10"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
}
