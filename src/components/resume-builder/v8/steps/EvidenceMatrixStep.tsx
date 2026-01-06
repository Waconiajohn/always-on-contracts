/**
 * EvidenceMatrixStep - Step 1: Match vault evidence to job requirements
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  RefreshCw,
  Building,
  Briefcase,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSmartAnswers } from '@/hooks/useSmartAnswers';
import { SmartAnswerCard } from '@/components/resume-builder/SmartAnswerCard';
import type { GapAnalysis, EvidenceMatrixResult, DetectedInfo } from '../types';

interface EvidenceMatrixStepProps {
  gapAnalysis: GapAnalysis | null;
  evidenceMatrix: EvidenceMatrixResult | null;
  detected: DetectedInfo;
  isProcessing: boolean;
  processingMessage: string;
  onToggleEvidence: (matchId: string) => void;
  onRefresh: () => void;
  onNext: () => void;
  canProceed: boolean;
}

export function EvidenceMatrixStep({
  gapAnalysis,
  evidenceMatrix,
  detected,
  isProcessing,
  onToggleEvidence,
  onRefresh,
  onNext,
  canProceed
}: EvidenceMatrixStepProps) {
  const selectedCount = evidenceMatrix?.matches.filter(m => m.isSelected).length || 0;

  // AI suggestions for missing requirements
  const {
    suggestions,
    loadingSuggestions,
    loadingAlternatives,
    generateSuggestion,
    generateMoreAlternatives,
    selectAnswer,
    provideFeedback
  } = useSmartAnswers({
    jobContext: {
      title: detected.role,
      company: undefined
    }
  });

  const handleRequestAISuggestion = (requirement: string, workaround: string, index: number) => {
    const key = `gap-${index}`;
    generateSuggestion(key, requirement, 'experienceGaps', workaround);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          We found evidence in your Career Vault for this job
        </h2>
        <p className="text-muted-foreground">
          Select which evidence to use in your resume. We'll organize it for maximum impact.
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="outline">{detected.role}</Badge>
          <Badge variant="outline">{detected.industry}</Badge>
          <Badge variant="outline">{detected.level}</Badge>
        </div>
      </div>

      {/* Stats Summary */}
      {evidenceMatrix && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-500">
                {evidenceMatrix.matches.filter(m => m.qualityScore === 'strong').length}
              </div>
              <p className="text-sm text-muted-foreground">Strong Matches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-amber-500">
                {evidenceMatrix.matches.filter(m => m.qualityScore === 'good').length}
              </div>
              <p className="text-sm text-muted-foreground">Good Matches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-red-500">
                {evidenceMatrix.unmatchedRequirements.length}
              </div>
              <p className="text-sm text-muted-foreground">Gaps to Address</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Evidence Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Matched Evidence</h3>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isProcessing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isProcessing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {evidenceMatrix?.matches.map((match) => (
          <Card 
            key={match.milestoneId}
            className={cn(
              "cursor-pointer transition-all",
              match.isSelected && "ring-2 ring-primary"
            )}
            onClick={() => onToggleEvidence(match.milestoneId)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <Checkbox 
                  checked={match.isSelected}
                  onCheckedChange={() => onToggleEvidence(match.milestoneId)}
                  className="mt-1"
                />

                {/* Content */}
                <div className="flex-1 space-y-2">
                  {/* Requirement */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={match.qualityScore === 'strong' ? 'default' : 'secondary'}
                      className={cn(
                        match.qualityScore === 'strong' && "bg-green-500",
                        match.qualityScore === 'good' && "bg-amber-500",
                        match.qualityScore === 'weak' && "bg-red-500"
                      )}
                    >
                      {match.matchScore}% match
                    </Badge>
                    <span className="text-sm font-medium">{match.requirementText}</span>
                  </div>

                  {/* Evidence */}
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">{match.originalBullet}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Building className="h-3 w-3" />
                      <span>{match.originalSource.company}</span>
                      <span>•</span>
                      <Briefcase className="h-3 w-3" />
                      <span>{match.originalSource.jobTitle}</span>
                    </div>
                  </div>

                  {/* Enhanced Version Preview */}
                  {match.enhancedBullet && (
                    <div className="p-3 bg-primary/5 rounded-md border-l-2 border-primary">
                      <p className="text-xs text-muted-foreground mb-1">Enhanced version:</p>
                      <p className="text-sm">{match.enhancedBullet}</p>
                    </div>
                  )}

                  {/* Keywords */}
                  {match.atsKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.atsKeywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Gaps with AI Suggestions */}
        {gapAnalysis && gapAnalysis.missingRequirements.length > 0 && (
          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Missing Requirements ({gapAnalysis.missingRequirements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gapAnalysis.missingRequirements.map((req, i) => {
                const suggestionKey = `gap-${i}`;
                const suggestion = suggestions[suggestionKey];
                const isLoading = loadingSuggestions.has(suggestionKey);
                const isLoadingAlts = loadingAlternatives.has(suggestionKey);

                return (
                  <div key={i} className="space-y-3 pb-4 border-b last:border-0">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium">{req.requirement}</span>
                        <p className="text-sm text-muted-foreground mt-1">{req.workaround}</p>
                      </div>
                    </div>

                    {/* AI Suggestion or Button */}
                    {suggestion ? (
                      <SmartAnswerCard
                        suggestedAnswer={suggestion.suggestedAnswer}
                        reasoning={suggestion.reasoning}
                        confidenceScore={suggestion.confidenceScore}
                        resumeEvidence={suggestion.resumeEvidence}
                        alternatives={suggestion.alternatives}
                        onSelectAnswer={(answer) => selectAnswer(suggestionKey, answer)}
                        onRequestAlternatives={() => generateMoreAlternatives(suggestionKey)}
                        onProvideFeedback={(type) => provideFeedback(suggestionKey, type as 'helpful' | 'not_helpful')}
                        isLoadingAlternatives={isLoadingAlts}
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestAISuggestion(req.requirement, req.workaround, i);
                        }}
                        disabled={isLoading}
                        className="ml-6"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {isLoading ? 'Generating...' : 'Get AI Suggestion'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {selectedCount} evidence items selected
        </p>
        <Button onClick={onNext} disabled={!canProceed} className="gap-2">
          Continue to Build
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
