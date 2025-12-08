/**
 * FineTuneStep - Step 3: Humanization, ATS check, HM review
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, ArrowRight, User, Target, Eye, 
  CheckCircle2, XCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HumanizationResult, ATSAuditResult, HMReviewResult } from '../types';

interface FineTuneStepProps {
  resumeContent: string;
  humanizationResult: HumanizationResult | null;
  atsAuditResult: ATSAuditResult | null;
  hmReviewResult: HMReviewResult | null;
  isProcessing: boolean;
  processingMessage: string;
  onRunHumanization: () => Promise<any>;
  onRunATSAudit: () => Promise<any>;
  onRunHMReview: () => Promise<any>;
  onNext: () => void;
  onBack: () => void;
}

export function FineTuneStep({
  humanizationResult,
  atsAuditResult,
  hmReviewResult,
  isProcessing,
  processingMessage,
  onRunHumanization,
  onRunATSAudit,
  onRunHMReview,
  onNext,
  onBack
}: FineTuneStepProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Fine-Tune Your Resume</h2>
        <p className="text-muted-foreground">
          Run these checks to ensure your resume sounds human and passes ATS systems.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Humanization Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              Humanization Check
            </CardTitle>
            <CardDescription>Detect and reduce AI-sounding language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {humanizationResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">AI Detection Probability</p>
                    <div className="flex items-center gap-2">
                      <Progress value={100 - humanizationResult.aiProbabilityAfter} className="flex-1" />
                      <span className={cn(
                        "text-sm font-medium",
                        humanizationResult.aiProbabilityAfter < 30 ? "text-green-500" : "text-amber-500"
                      )}>
                        {100 - humanizationResult.aiProbabilityAfter}% human
                      </span>
                    </div>
                  </div>
                </div>
                {humanizationResult.changesApplied.length > 0 && (
                  <div className="p-3 bg-muted rounded text-sm">
                    <p className="font-medium mb-2">Changes Applied:</p>
                    <ul className="space-y-1">
                      {humanizationResult.changesApplied.slice(0, 3).map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={onRunHumanization} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Run Humanization Check
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ATS Audit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              ATS Optimization
            </CardTitle>
            <CardDescription>Ensure your resume passes automated screening</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {atsAuditResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Badge variant={atsAuditResult.score >= 80 ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                    ATS Score: {atsAuditResult.score}
                  </Badge>
                </div>
                {atsAuditResult.issues.length > 0 && (
                  <div className="space-y-2">
                    {atsAuditResult.issues.slice(0, 3).map((issue, i) => (
                      <div key={i} className={cn(
                        "p-2 rounded text-sm flex items-start gap-2",
                        issue.severity === 'critical' && "bg-red-50 text-red-700",
                        issue.severity === 'warning' && "bg-amber-50 text-amber-700",
                        issue.severity === 'info' && "bg-blue-50 text-blue-700"
                      )}>
                        {issue.severity === 'critical' ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <div>
                          <p>{issue.description}</p>
                          <p className="text-xs mt-1">Fix: {issue.fix}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {atsAuditResult.keywordsPresent.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Keywords Found:</p>
                    <div className="flex flex-wrap gap-1">
                      {atsAuditResult.keywordsPresent.slice(0, 10).map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-green-50">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={onRunATSAudit} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Run ATS Audit
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Hiring Manager Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-500" />
              Hiring Manager Perspective
            </CardTitle>
            <CardDescription>Simulate how a hiring manager would view your resume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hmReviewResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    hmReviewResult.recommendation === 'strong-yes' ? 'default' :
                    hmReviewResult.recommendation === 'yes' ? 'secondary' : 'outline'
                  } className="capitalize">
                    {hmReviewResult.recommendation.replace('-', ' ')}
                  </Badge>
                </div>
                <p className="text-sm">{hmReviewResult.overallImpression}</p>
                {hmReviewResult.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-600">Strengths:</p>
                    <ul className="text-sm space-y-1 mt-1">
                      {hmReviewResult.strengths.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hmReviewResult.interviewQuestions.length > 0 && (
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm font-medium mb-2">Likely Interview Questions:</p>
                    <ul className="text-sm space-y-1">
                      {hmReviewResult.interviewQuestions.slice(0, 3).map((q, i) => (
                        <li key={i}>• {q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={onRunHMReview} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Run HM Review
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Build
        </Button>
        <Button onClick={onNext} className="gap-2">
          Continue to Export
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
