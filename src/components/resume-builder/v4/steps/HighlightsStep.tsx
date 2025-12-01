/**
 * HighlightsStep - Step 2
 * 
 * Create a role-aligned highlights section that addresses the most critical gaps.
 * Shows 3-6 BulletComparisonCard items with accept/edit/reject controls.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { HighlightsSection, JobBlueprint, BulletSuggestion } from "../types/builderV2Types";
import { BulletComparisonCard } from "../cards/BulletComparisonCard";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Info,
  Zap
} from "lucide-react";

interface HighlightsStepProps {
  highlights: HighlightsSection;
  jobBlueprint: JobBlueprint;
  scores: { current: number; projected: number };
  onBulletAction: (bulletId: string, action: 'accept' | 'reject' | 'edit', editedText?: string) => void;
  onApproveAllHighConfidence: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const HighlightsStep = ({
  highlights,
  jobBlueprint,
  scores,
  onBulletAction,
  onApproveAllHighConfidence,
  onNext,
  onBack
}: HighlightsStepProps) => {
  const pendingBullets = highlights.bullets.filter(b => b.status === 'pending');
  const acceptedBullets = highlights.bullets.filter(b => b.status === 'accepted' || b.status === 'edited');
  const highConfidencePending = pendingBullets.filter(b => b.confidence === 'high');

  const topPriorities = jobBlueprint.hiringManagerPriorities.slice(0, 4);
  const canProceed = acceptedBullets.length >= 3; // Need at least 3 highlights

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Badge variant="outline">Step 2 of 5</Badge>
          <span>Key Highlights</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Build Your Key Highlights</h1>
        <p className="text-muted-foreground">
          These 4-6 impact statements go at the top of your résumé. 
          They're the first thing the hiring manager sees.
        </p>
      </div>

      {/* What this section should accomplish */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-2">This section will help you cover:</p>
              <div className="flex flex-wrap gap-2">
                {topPriorities.map((priority, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {priority.priority}
                  </Badge>
                ))}
                {jobBlueprint.atsKeywords.critical.slice(0, 4).map((kw, i) => (
                  <Badge key={`kw-${i}`} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These are AI-generated drafts based on your career data. 
          Review each bullet and accept, edit, or skip as needed.
        </AlertDescription>
      </Alert>

      {/* Progress Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{acceptedBullets.length}</p>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingBullets.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{acceptedBullets.length}/4-6</p>
            <p className="text-xs text-muted-foreground">Target</p>
          </div>
        </div>

        {/* Quick approve for high confidence */}
        {highConfidencePending.length >= 2 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onApproveAllHighConfidence}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Approve All High-Confidence ({highConfidencePending.length})
          </Button>
        )}
      </div>

      {/* Accepted bullets (collapsed) */}
      {acceptedBullets.length > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">Accepted Highlights ({acceptedBullets.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {acceptedBullets.map((bullet, i) => (
                <li key={bullet.id} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-700 line-clamp-2">
                    {bullet.editedText || bullet.suggestedText}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs"
                    onClick={() => onBulletAction(bullet.id, 'reject')}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pending bullet suggestions */}
      {pendingBullets.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Review Suggestions ({pendingBullets.length} remaining)
          </h2>
          {pendingBullets.map((bullet, index) => (
            <BulletComparisonCard
              key={bullet.id}
              suggestion={bullet}
              bulletNumber={index + 1}
              onUseAI={() => onBulletAction(bullet.id, 'accept')}
              onKeepOriginal={() => onBulletAction(bullet.id, 'accept')} // For highlights, same as accept
              onEdit={(text) => onBulletAction(bullet.id, 'edit', text)}
              onRemove={() => onBulletAction(bullet.id, 'reject')}
            />
          ))}
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">All suggestions reviewed!</h3>
            <p className="text-sm text-muted-foreground">
              You have {acceptedBullets.length} highlights ready. 
              {acceptedBullets.length < 4 && " Consider adding more for impact."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Score projection */}
      {scores.projected > scores.current && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Score Impact</p>
                <p className="text-xs text-green-600">
                  Completing this section will boost your score
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600">
                  +{scores.projected - scores.current}
                </span>
                <p className="text-xs text-green-600">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          className="gap-2"
        >
          Continue to Experience
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {!canProceed && (
        <p className="text-center text-sm text-muted-foreground">
          Accept at least 3 highlights to continue
        </p>
      )}
    </div>
  );
};
