import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ResumeAssessment } from "@/types/mustInterviewBuilder";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Target,
  ArrowRight,
  Sparkles,
  FileText,
  TrendingUp
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
    if (score >= 80) return "Must-Interview";
    if (score >= 60) return "Qualified";
    if (score >= 40) return "Needs Work";
    return "Major Gaps";
  };

  const criticalGaps = assessment.gaps.filter(g => g.severity === 'critical');

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

        {/* Critical Gaps */}
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base">Critical Gaps ({criticalGaps.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {criticalGaps.slice(0, 3).map((gap, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">!</span>
                  <span className="text-muted-foreground line-clamp-2">{gap.requirement}</span>
                </li>
              ))}
              {criticalGaps.length === 0 && (
                <li className="text-green-600 text-sm">No critical gaps!</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Points Needed */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">To Must-Interview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {assessment.alignmentScore >= 80 ? (
                <div className="text-green-500">
                  <TrendingUp className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-medium">You're already must-interview!</p>
                  <p className="text-xs text-muted-foreground">Let's polish it further</p>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-primary">+{80 - assessment.alignmentScore}</p>
                  <p className="text-sm text-muted-foreground">points needed to reach 80</p>
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
                and become a must-interview candidate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
