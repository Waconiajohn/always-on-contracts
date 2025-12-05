/**
 * GapAssessmentStep - V7 Gap Analysis Dashboard
 * Shows matches, gaps, and quick wins before building
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  TrendingUp, 
  Target,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import type { V7BuilderState } from '../types';

interface GapAssessmentStepProps {
  state: V7BuilderState;
  onNext: () => void;
}

export function GapAssessmentStep({ state, onNext }: GapAssessmentStepProps) {
  const { gapAnalysis, detected, scores, quickWins } = state;

  // Count items for summary
  const fullMatches = gapAnalysis?.fullMatches?.length || 0;
  const partialMatches = gapAnalysis?.partialMatches?.length || 0;
  const missing = gapAnalysis?.missingRequirements?.length || 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Gap Analysis Dashboard</h1>
          <p className="text-muted-foreground">
            We analyzed your resume against the job description. Here's what we found.
          </p>
          
          {/* Role Detection */}
          <div className="flex items-center gap-3 mt-4">
            <Badge variant="secondary" className="text-sm">
              {detected?.role || 'Professional'}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {detected?.industry || 'General'}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {detected?.level || 'Mid-Level'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{fullMatches}</p>
                    <p className="text-sm text-muted-foreground">Full Matches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{partialMatches}</p>
                    <p className="text-sm text-muted-foreground">Partial Matches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{missing}</p>
                    <p className="text-sm text-muted-foreground">Missing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Score Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">ATS Compatibility</span>
                    <span className="text-sm font-medium">{scores?.ats || 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${scores?.ats || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Requirements Match</span>
                    <span className="text-sm font-medium">{scores?.requirements || 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${scores?.requirements || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Competitive Edge</span>
                    <span className="text-sm font-medium">{scores?.competitive || 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${scores?.competitive || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Wins */}
          {quickWins && quickWins.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Quick Wins to Boost Your Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickWins.slice(0, 5).map((win, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{win}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Analysis */}
          <div className="grid grid-cols-2 gap-4">
            {/* Full Matches */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  What You Have
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gapAnalysis?.fullMatches?.slice(0, 6).map((match, idx) => (
                    <div key={idx} className="text-sm p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                      <p className="font-medium text-green-700 dark:text-green-400">{match.requirement}</p>
                      {match.evidence && (
                        <p className="text-xs text-muted-foreground mt-1">Evidence: {match.evidence}</p>
                      )}
                    </div>
                  ))}
                  {(!gapAnalysis?.fullMatches || gapAnalysis.fullMatches.length === 0) && (
                    <p className="text-sm text-muted-foreground">No full matches detected yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Missing Requirements */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  What's Missing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gapAnalysis?.missingRequirements?.slice(0, 6).map((item: { requirement: string; workaround: string }, idx: number) => (
                    <div key={idx} className="text-sm p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                      <p className="font-medium text-red-700 dark:text-red-400">{item.requirement}</p>
                      {item.workaround && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Tip: {item.workaround}
                        </p>
                      )}
                    </div>
                  ))}
                  {(!gapAnalysis?.missingRequirements || gapAnalysis.missingRequirements.length === 0) && (
                    <p className="text-sm text-muted-foreground">Great! No critical gaps detected.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-background">
        <div className="max-w-5xl mx-auto flex justify-end">
          <Button onClick={onNext} size="lg" className="gap-2">
            Choose Template
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
