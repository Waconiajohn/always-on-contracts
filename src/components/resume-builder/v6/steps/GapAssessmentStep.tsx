/**
 * GapAssessmentStep - Visual gap analysis dashboard
 * Shows what's missing and what we'll fix
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Target,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import type { BenchmarkBuilderState, Gap } from '../types';

interface GapAssessmentStepProps {
  state: BenchmarkBuilderState;
  onNext: () => void;
  onUpdateState: (updates: Partial<BenchmarkBuilderState>) => void;
}

export function GapAssessmentStep({
  state,
  onNext,
  onUpdateState
}: GapAssessmentStepProps) {
  const criticalGaps = state.gaps.filter(g => g.severity === 'critical');
  const importantGaps = state.gaps.filter(g => g.severity === 'important');
  const niceToHaveGaps = state.gaps.filter(g => g.severity === 'nice-to-have');
  
  const potentialScore = Math.min(95, state.currentScore + 
    (criticalGaps.length * 8) + 
    (importantGaps.length * 4) + 
    (niceToHaveGaps.length * 2)
  );

  const GapCard = ({ gap, index }: { gap: Gap; index: number }) => (
    <Card className={`border-l-4 ${
      gap.severity === 'critical' ? 'border-l-red-500' :
      gap.severity === 'important' ? 'border-l-amber-500' : 'border-l-blue-500'
    }`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            gap.severity === 'critical' ? 'bg-red-500/10' :
            gap.severity === 'important' ? 'bg-amber-500/10' : 'bg-blue-500/10'
          }`}>
            {gap.severity === 'critical' ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : gap.severity === 'important' ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <Info className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {gap.category}
              </Badge>
              <Badge variant="outline" className="text-xs text-green-600">
                {gap.impact}
              </Badge>
            </div>
            <p className="font-medium text-sm">{gap.issue}</p>
            <p className="text-sm text-muted-foreground mt-1">{gap.fix}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Gap Analysis Report</h1>
          <p className="text-lg text-muted-foreground">
            Here's what's standing between you and "must-interview" status
          </p>
        </div>

        {/* Score Projection Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Score</p>
                <p className="text-4xl font-bold">{state.currentScore}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <ArrowRight className="h-8 w-8 text-primary" />
              </div>
              
              <div className="space-y-2 text-right">
                <p className="text-sm text-muted-foreground">Potential Score</p>
                <p className="text-4xl font-bold text-primary">{potentialScore}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress to Benchmark (90+)</span>
                <span className="font-medium">{state.currentScore}% → {potentialScore}%</span>
              </div>
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-muted-foreground/30 rounded-full"
                  style={{ width: `${state.currentScore}%` }}
                />
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${potentialScore}%` }}
                />
                {/* Benchmark line */}
                <div className="absolute inset-y-0 left-[90%] w-0.5 bg-green-500" />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Fixing these gaps could add <span className="font-bold text-primary">+{potentialScore - state.currentScore} points</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                ATS Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold">{state.scores.ats}%</p>
                <p className="text-sm text-muted-foreground mb-1">/ 100</p>
              </div>
              <Progress value={state.scores.ats} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                How well your resume parses through ATS systems
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Requirements Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold">{state.scores.requirements}%</p>
                <p className="text-sm text-muted-foreground mb-1">/ 100</p>
              </div>
              <Progress value={state.scores.requirements} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                How well you match the job requirements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Competitive Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold">{state.scores.competitive}%</p>
                <p className="text-sm text-muted-foreground mb-1">/ 100</p>
              </div>
              <Progress value={state.scores.competitive} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                How you stack up against other candidates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gaps by Severity */}
        <div className="space-y-6">
          {/* Critical Gaps */}
          {criticalGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Critical Gaps ({criticalGaps.length})
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Must fix for interview consideration
                </span>
              </div>
              <div className="grid gap-3">
                {criticalGaps.map((gap, i) => (
                  <GapCard key={gap.id} gap={gap} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Important Gaps */}
          {importantGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="gap-1 border-amber-500 text-amber-500">
                  <AlertTriangle className="h-3 w-3" />
                  Important Gaps ({importantGaps.length})
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Strong impact on hiring decision
                </span>
              </div>
              <div className="grid gap-3">
                {importantGaps.map((gap, i) => (
                  <GapCard key={gap.id} gap={gap} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Nice to Have */}
          {niceToHaveGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="gap-1">
                  <Info className="h-3 w-3" />
                  Nice to Have ({niceToHaveGaps.length})
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Polish points that differentiate top candidates
                </span>
              </div>
              <div className="grid gap-3">
                {niceToHaveGaps.map((gap, i) => (
                  <GapCard key={gap.id} gap={gap} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Wins */}
        {state.quickWins.length > 0 && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Quick Wins
              </CardTitle>
              <CardDescription>
                Easy changes you can make right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {state.quickWins.map((win, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{win}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Industry Research (if available) */}
        {state.industryResearch && (
          <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-500" />
                Industry Intelligence
              </CardTitle>
              <CardDescription>
                Competitive insights for {state.detected.role} positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {state.industryResearch}
              </p>
            </CardContent>
          </Card>
        )}

        {/* What We'll Do */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Sparkles className="h-10 w-10 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Here's What We'll Do</h3>
              <div className="grid md:grid-cols-3 gap-4 text-left mt-4">
                <div className="p-4 bg-background rounded-lg">
                  <p className="font-medium text-sm mb-1">1. Choose Your Format</p>
                  <p className="text-xs text-muted-foreground">
                    Pick from 4 ATS-optimized templates
                  </p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <p className="font-medium text-sm mb-1">2. Rewrite Each Section</p>
                  <p className="text-xs text-muted-foreground">
                    AI-powered editing with your control
                  </p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <p className="font-medium text-sm mb-1">3. Polish & Export</p>
                  <p className="text-xs text-muted-foreground">
                    ATS audit, humanize, and export
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex justify-center">
          <Button size="lg" onClick={onNext} className="gap-2 px-8">
            <Sparkles className="h-5 w-5" />
            Start Building My Benchmark Resume
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
