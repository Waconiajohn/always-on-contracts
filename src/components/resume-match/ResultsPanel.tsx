import { Loader2, TrendingUp, Zap, Target, Users, FileCheck, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ResumeMatchResult } from './types';
import { KeywordBreakdown } from './KeywordBreakdown';
import { ATSCompliancePanel } from './ATSCompliancePanel';
import { ExportReportButton } from './ExportReportButton';
import { ScoreTooltip } from './ScoreTooltip';
import { PriorityFixesPanel, PriorityFix } from './PriorityFixesPanel';

interface ResultsPanelProps {
  result: ResumeMatchResult | null;
  isAnalyzing: boolean;
  error: string | null;
  resumeText: string;
  hasContent: boolean;
  onRefreshScore?: () => void;
  onAddSkill?: (skill: string) => void;
  onGenerateBullet?: (keyword: string) => void;
  onFixClick?: (fix: PriorityFix) => void;
}

export function ResultsPanel({ 
  result, 
  isAnalyzing, 
  error,
  resumeText,
  hasContent,
  onRefreshScore,
  onAddSkill,
  onGenerateBullet,
  onFixClick,
}: ResultsPanelProps) {
  // Empty state
  if (!hasContent) {
    return (
      <Card className="h-full flex flex-col bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Match Results
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Add your resume and a job description</p>
            <p className="text-xs mt-1">to see your match score</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isAnalyzing) {
    return (
      <Card className="h-full flex flex-col bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Analyzing...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your resume match...</p>
            <p className="text-xs text-muted-foreground mt-1">This usually takes 5-10 seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="h-full flex flex-col bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-destructive">
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2 text-muted-foreground">Please try again</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No result yet but has content
  if (!result) {
    return (
      <Card className="h-full flex flex-col bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Match Results
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Show ATS panel even before full analysis */}
          <ATSCompliancePanel resumeText={resumeText} />
          
          <div className="flex-1 flex items-center justify-center mt-4">
            <div className="text-center text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click "Analyze Match" for full results</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full results
  const tier = result.tier;
  const getTierBgColor = (tierName: string) => {
    switch (tierName) {
      case 'ON_FIRE': return 'bg-gradient-to-br from-red-500 to-orange-500';
      case 'HOT': return 'bg-gradient-to-br from-orange-500 to-amber-500';
      case 'WARM': return 'bg-gradient-to-br from-amber-500 to-yellow-500';
      case 'LUKEWARM': return 'bg-gradient-to-br from-yellow-500 to-lime-500';
      case 'COLD': return 'bg-gradient-to-br from-blue-400 to-blue-500';
      case 'FREEZING': return 'bg-gradient-to-br from-blue-600 to-indigo-600';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="h-full flex flex-col bg-card/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Match Results
          </CardTitle>
          <div className="flex items-center gap-2">
            {onRefreshScore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefreshScore}
                disabled={isAnalyzing}
                className="h-7 px-2 text-xs gap-1"
              >
                <RefreshCw className={cn("h-3 w-3", isAnalyzing && "animate-spin")} />
                Refresh
              </Button>
            )}
            <ExportReportButton result={result} />
          </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1">
        <CardContent className="space-y-4 pb-4">
          {/* Overall Score - Hero */}
          <div className={cn(
            "rounded-lg p-4 text-white",
            getTierBgColor(tier?.tier || '')
          )}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{result.overallScore}%</span>
                  <span className="text-2xl">{tier?.emoji}</span>
                  <div className="ml-1">
                    <ScoreTooltip />
                  </div>
                </div>
                <p className="text-sm opacity-90 mt-1">{tier?.message}</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {tier?.tier?.replace('_', ' ')}
                </Badge>
                {result.pointsToNextTier > 0 && (
                  <p className="text-xs opacity-80 mt-2">
                    +{result.pointsToNextTier} pts to next tier
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <FileCheck className="h-3 w-3" />
                JD Match
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold">{result.scores?.jdMatch?.score || 0}%</span>
                <Progress value={result.scores?.jdMatch?.score || 0} className="w-12 h-1.5" />
              </div>
            </div>
            
            <div className="p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                Industry
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold">{result.scores?.industryBenchmark?.score || 0}%</span>
                <Progress value={result.scores?.industryBenchmark?.score || 0} className="w-12 h-1.5" />
              </div>
            </div>
          </div>

          {/* Quick Wins */}
          {result.quickWins && result.quickWins.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Quick Wins</span>
              </div>
              <ul className="space-y-1.5">
                {result.quickWins.map((win, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Keyword Breakdown */}
          <KeywordBreakdown
            matchedKeywords={result.breakdown?.jdMatch?.matchedKeywords || []}
            missingKeywords={result.breakdown?.jdMatch?.missingKeywords || []}
            gapAnalysis={result.gapAnalysis}
            skillsMatch={result.breakdown?.jdMatch?.skillsMatch}
            experienceMatch={result.breakdown?.jdMatch?.experienceMatch}
            onAddSkill={onAddSkill}
            onGenerateBullet={onGenerateBullet}
          />

          {/* Priority Fixes */}
          {result.priorityFixes && result.priorityFixes.length > 0 && (
            <PriorityFixesPanel
              fixes={result.priorityFixes.map((fix: any) => ({
                issue: fix.issue || fix.gapType || 'Issue',
                recommendation: fix.fix || fix.recommendation || 'Address this gap',
                severity: fix.priority <= 1 ? 'critical' as const : 
                          fix.priority <= 2 ? 'high' as const : 
                          fix.priority <= 3 ? 'medium' as const : 'low' as const,
                category: fix.category,
                fixType: fix.gapType === 'skill' ? 'add_skill' as const : 
                         fix.gapType === 'experience' ? 'add_bullet' as const : 'other' as const,
              }))}
              onFixClick={onFixClick}
            />
          )}

          {/* ATS Compliance */}
          <ATSCompliancePanel 
            resumeText={resumeText}
            apiIssues={result.breakdown?.atsCompliance}
            apiScore={result.scores?.atsCompliance?.score}
          />

          {/* Industry Benchmark */}
          {result.breakdown?.industryBenchmark && (
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Industry Benchmark
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Competitive Rank:</span>
                  <Badge variant="outline">{result.breakdown.industryBenchmark.competitiveRank}</Badge>
                </div>
                
                {result.breakdown.industryBenchmark.meetingStandards?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                      Meeting Standards:
                    </p>
                    <ul className="space-y-0.5">
                      {result.breakdown.industryBenchmark.meetingStandards.slice(0, 3).map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {result.breakdown.industryBenchmark.belowStandards?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                      Below Standards:
                    </p>
                    <ul className="space-y-0.5">
                      {result.breakdown.industryBenchmark.belowStandards.slice(0, 3).map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analysis timestamp */}
          {result.analyzedAt && (
            <p className="text-[10px] text-muted-foreground text-center">
              Analyzed {new Date(result.analyzedAt).toLocaleString()}
              {result.executionTimeMs && ` • ${(result.executionTimeMs / 1000).toFixed(1)}s`}
            </p>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
