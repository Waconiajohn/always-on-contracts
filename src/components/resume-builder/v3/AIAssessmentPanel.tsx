import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ResumeAssessment, ResumeGap } from "@/types/mustInterviewBuilder";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Target,
  ArrowRight,
  Sparkles,
  FileText,
  TrendingUp,
  ChevronDown,
  Wrench,
  BookOpen,
  BarChart,
  Building,
  TrendingUpIcon,
  Crosshair
} from "lucide-react";

interface AIAssessmentPanelProps {
  assessment: ResumeAssessment;
  onFormatSelected: (format: string) => void;
}

export const AIAssessmentPanel = ({
  assessment,
  onFormatSelected,
}: AIAssessmentPanelProps) => {
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Benchmark Candidate";
    if (score >= 60) return "Qualified";
    if (score >= 40) return "Needs Work";
    return "Major Gaps";
  };

  const criticalGaps = assessment.gaps.filter(g => g.severity === 'critical');

  // Gap type icon mapping
  const getGapIcon = (gapId: string) => {
    if (gapId.includes('skill') || gapId.includes('tool')) return <Wrench className="h-4 w-4" />;
    if (gapId.includes('achievement') || gapId.includes('story')) return <BookOpen className="h-4 w-4" />;
    if (gapId.includes('metrics') || gapId.includes('scope')) return <BarChart className="h-4 w-4" />;
    if (gapId.includes('domain') || gapId.includes('experience')) return <Building className="h-4 w-4" />;
    if (gapId.includes('level') || gapId.includes('seniority')) return <TrendingUpIcon className="h-4 w-4" />;
    return <Crosshair className="h-4 w-4" />;
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (severity === 'important') return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
  };

  const renderGapCard = (gap: ResumeGap) => (
    <Collapsible key={gap.id} className="mb-3">
      <Card className={cn("border", getSeverityColor(gap.severity))}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1">
                <div className={cn("p-1.5 rounded", getSeverityColor(gap.severity))}>
                  {getGapIcon(gap.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-sm font-medium line-clamp-1">{gap.requirement}</CardTitle>
                    <Badge variant="outline" className={cn("text-xs", getSeverityColor(gap.severity))}>
                      {gap.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {gap.currentContent || 'Not addressed in current resume'}
                  </p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-3">
            {gap.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">AI Suggestions:</p>
                {gap.suggestions.slice(0, 2).map((suggestion, i) => (
                  <Alert key={i} className="py-2">
                    <AlertDescription className="text-xs space-y-1">
                      <p className="font-medium">{suggestion.text}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="secondary" className="text-xs">{suggestion.approach}</Badge>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            suggestion.confidence > 0.8 ? "text-green-600" :
                            suggestion.confidence > 0.5 ? "text-amber-600" : "text-red-600"
                          )}
                        >
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Score */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className={cn(
            "relative p-4 rounded-full",
            assessment.alignmentScore >= 80 ? "bg-green-500/10" : 
            assessment.alignmentScore >= 60 ? "bg-amber-500/10" : "bg-red-500/10"
          )}>
            <span className={cn("text-5xl font-bold", getScoreColor(assessment.alignmentScore))}>
              {assessment.alignmentScore}
            </span>
            <span className="absolute -bottom-1 -right-1 text-sm text-muted-foreground">/100</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-1">
          AI Assessment for: <span className="text-primary">{assessment.roleTitle}</span>
        </h1>
        <p className="text-muted-foreground">
          {assessment.companyName && `at ${assessment.companyName} • `}
          {assessment.industry} • {assessment.seniority}
        </p>
        <Badge variant="outline" className={cn("mt-2", getScoreColor(assessment.alignmentScore))}>
          {getScoreLabel(assessment.alignmentScore)}
        </Badge>
      </div>

      {/* Score Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Strengths */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">Strengths ({assessment.strengths.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {assessment.strengths.slice(0, 3).map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-muted-foreground">{strength.area}</span>
                </li>
              ))}
              {assessment.strengths.length === 0 && (
                <li className="text-muted-foreground text-sm">No strong matches found yet</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Critical Gaps with Details */}
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base">Critical Gaps ({criticalGaps.length})</CardTitle>
            </div>
            <CardDescription className="text-xs">
              These are must-address items for this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            {criticalGaps.length > 0 ? (
              <div className="space-y-2">
                {criticalGaps.slice(0, 3).map(gap => (
                  <div key={gap.id} className="flex items-start gap-2 p-2 rounded border border-red-500/20">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">{getGapIcon(gap.id)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{gap.requirement}</p>
                      <p className="text-xs text-muted-foreground">
                        {gap.suggestions.length} suggestion{gap.suggestions.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-600 text-sm">No critical gaps!</p>
            )}
          </CardContent>
        </Card>

        {/* Points Needed */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">To Benchmark</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {assessment.alignmentScore >= 80 ? (
                <div className="text-green-500">
                  <TrendingUp className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-medium">You're a benchmark candidate!</p>
                  <p className="text-xs text-muted-foreground">Let's polish it further</p>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-primary">+{80 - assessment.alignmentScore}</p>
                  <p className="text-sm text-muted-foreground">points needed to reach benchmark status</p>
                  <Progress 
                    value={assessment.alignmentScore} 
                    className="mt-2 h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Gap Analysis */}
      {assessment.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle className="text-lg">Gap Analysis & Suggestions</CardTitle>
                <CardDescription>
                  AI-powered suggestions with confidence scores. Expand each gap to see details.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {assessment.gaps.slice(0, 6).map(renderGapCard)}
            {assessment.gaps.length > 6 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                {assessment.gaps.length - 6} more gaps will be addressed in the build phase
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Format Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Choose Your Format</CardTitle>
              <CardDescription>
                Based on your profile ({assessment.seniority} in {assessment.industry}), we recommend:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {assessment.recommendedFormats.map((format, index) => (
              <button
                key={format.id}
                onClick={() => setHoveredFormat(format.id)}
                onDoubleClick={() => onFormatSelected(format.id)}
                className={cn(
                  "relative p-4 rounded-lg border-2 text-left transition-all",
                  hoveredFormat === format.id 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-border hover:border-primary/50",
                  index === 0 && "ring-2 ring-primary/20"
                )}
              >
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary">
                    Recommended
                  </Badge>
                )}
                <h3 className="font-semibold mb-1">{format.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{format.description}</p>
                <p className="text-xs text-muted-foreground">Best for: {format.bestFor}</p>
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {hoveredFormat 
                ? `Click "Continue" to use ${assessment.recommendedFormats.find(f => f.id === hoveredFormat)?.name} format`
                : "Click a format to select it"
              }
            </p>
            <Button
              size="lg"
              onClick={() => hoveredFormat && onFormatSelected(hoveredFormat)}
              disabled={!hoveredFormat}
              className="gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Continue to Build
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">What happens next:</p>
              <p className="text-muted-foreground">
                AI will generate improved content for each section and suggest specific text to address 
                your gaps. You'll review, edit, and approve each suggestion. The goal: reach 80+ score 
                and position you as the "must speak to" candidate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
