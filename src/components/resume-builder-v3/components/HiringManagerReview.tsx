/**
 * HiringManagerReview - Final pre-export analysis
 * Uses the existing hiring-manager-review edge function
 * Shows actionable feedback and keyword opportunities
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  Plus, 
  Target,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OptimizedResume } from "@/types/resume-builder-v3";

// Types matching the edge function response
interface CompetencyEval {
  competency: string;
  evidence_level: "strong" | "moderate" | "weak" | "missing";
  notes: string;
}

interface CriticalGap {
  gap: string;
  whyMatters: string;
  recommendation: string;
  severity: "deal_breaker" | "concerning" | "minor";
  interviewRisk: string;
}

interface ImprovementSuggestion {
  section: string;
  currentIssue: string;
  suggestedImprovement: string;
  expectedImpact: string;
  priority: "high" | "medium" | "low";
}

interface Strength {
  point: string;
  evidence: string;
  impactLevel: "critical" | "important" | "nice_to_have";
}

interface ReviewResult {
  wouldInterview: boolean;
  recommendation: "strong-yes" | "yes" | "maybe" | "no";
  confidenceLevel: "high" | "medium" | "low";
  overallImpression: string;
  rubricEvaluation?: {
    competenciesDemonstrated: CompetencyEval[];
    outcomesAddressed: { outcome: string; addressed: boolean; how: string }[];
    benchmarkGaps: string[];
  };
  strengths: Strength[];
  criticalGaps: CriticalGap[];
  improvementSuggestions: ImprovementSuggestion[];
  interviewQuestions: { question: string; purpose: string; redFlagAnswer: string }[];
  finalVerdict?: {
    summary: string;
    topStrength: string;
    biggestConcern: string;
    interviewLikelihood: number;
  };
}

interface HiringManagerReviewProps {
  resume: OptimizedResume;
  jobDescription: string;
  onSkillAdd: (skill: string) => void;
  onClose?: () => void;
}

const RECOMMENDATION_CONFIG = {
  "strong-yes": {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    label: "Strong Yes",
    description: "Highly recommend interviewing",
  },
  "yes": {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Yes",
    description: "Would interview",
  },
  "maybe": {
    icon: AlertCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Maybe",
    description: "Needs improvement before interview",
  },
  "no": {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Not Yet",
    description: "Significant gaps to address",
  },
};

const SEVERITY_COLORS = {
  deal_breaker: "border-destructive/50 bg-destructive/5",
  concerning: "border-orange-500/50 bg-orange-500/5",
  minor: "border-yellow-500/50 bg-yellow-500/5",
};

const PRIORITY_COLORS = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-yellow-500/10 text-yellow-600",
  low: "bg-muted text-muted-foreground",
};

export function HiringManagerReview({
  resume,
  jobDescription,
  onSkillAdd,
  onClose,
}: HiringManagerReviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set());

  const handleRunReview = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setResult(null);

    try {
      // Format resume content for the edge function
      const resumeContent = {
        sections: [
          { title: "Summary", content: [resume.summary] },
          ...resume.experience.map(exp => ({
            title: `${exp.title} at ${exp.company}`,
            content: exp.bullets,
          })),
          { title: "Skills", content: [resume.skills.join(", ")] },
          ...(resume.education?.map(edu => ({
            title: "Education",
            content: [`${edu.degree} - ${edu.institution}${edu.year ? ` (${edu.year})` : ""}`],
          })) || []),
        ],
      };

      const { data, error } = await supabase.functions.invoke("hiring-manager-review", {
        body: {
          resumeContent,
          jobDescription,
          jobTitle: resume.header.title,
        },
      });

      if (error) throw error;

      if (data?.success && data?.review) {
        setResult(data.review);
      } else {
        throw new Error(data?.error || "Failed to run review");
      }
    } catch (error) {
      console.error("Review error:", error);
      toast.error("Failed to run hiring manager review. Please try again.");
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    onSkillAdd(skill);
    setAddedKeywords(prev => new Set([...prev, skill]));
    toast.success(`Added skill: ${skill}`);
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setAddedKeywords(new Set());
    onClose?.();
  };

  const config = result ? RECOMMENDATION_CONFIG[result.recommendation] : null;
  const RecommendationIcon = config?.icon || CheckCircle2;

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleRunReview}
        className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
      >
        <Target className="h-4 w-4 text-primary" />
        <span className="font-medium">Pre-Export Review</span>
      </Button>

      {/* Review Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Hiring Manager Review
            </DialogTitle>
            <DialogDescription>
              How a hiring manager would evaluate your resume
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Reviewing your resume from a hiring manager's perspective...
              </p>
            </div>
          ) : result ? (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6 pb-4">
                {/* Recommendation Header */}
                <div className={cn(
                  "rounded-lg p-4 flex items-start gap-4",
                  config?.bgColor
                )}>
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                    config?.bgColor
                  )}>
                    <RecommendationIcon className={cn("h-6 w-6", config?.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-semibold text-lg", config?.color)}>
                        {config?.label}
                      </span>
                      {result.finalVerdict?.interviewLikelihood !== undefined && (
                        <Badge variant="secondary" className="font-mono">
                          {result.finalVerdict.interviewLikelihood}% interview chance
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.overallImpression}
                    </p>
                  </div>
                </div>

                {/* Strengths */}
                {result.strengths.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-foreground">What Stands Out</h3>
                    </div>
                    <div className="space-y-2">
                      {result.strengths.slice(0, 3).map((strength, idx) => (
                        <div 
                          key={idx} 
                          className="rounded-lg border border-green-500/30 bg-green-500/5 p-3"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{strength.point}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{strength.evidence}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Gaps */}
                {result.criticalGaps.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <h3 className="font-semibold text-foreground">Areas to Address</h3>
                      <Badge variant="destructive" className="text-xs">
                        {result.criticalGaps.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {result.criticalGaps.map((gap, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "rounded-lg border p-3",
                            SEVERITY_COLORS[gap.severity]
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{gap.gap}</p>
                            <Badge variant="outline" className="text-xs capitalize shrink-0">
                              {gap.severity.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{gap.whyMatters}</p>
                          <div className="mt-2 flex items-start gap-2 text-xs">
                            <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                            <span className="text-primary">{gap.recommendation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Suggestions */}
                {result.improvementSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground">Quick Improvements</h3>
                    </div>
                    <div className="space-y-2">
                      {result.improvementSuggestions
                        .filter(s => s.priority === "high")
                        .slice(0, 3)
                        .map((suggestion, idx) => (
                          <div 
                            key={idx}
                            className="rounded-lg border p-3 bg-muted/30"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={cn("text-xs", PRIORITY_COLORS[suggestion.priority])}>
                                {suggestion.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{suggestion.section}</span>
                            </div>
                            <p className="text-sm text-foreground">{suggestion.suggestedImprovement}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Impact: {suggestion.expectedImpact}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Benchmark Gaps (Keywords to potentially add) */}
                {result.rubricEvaluation?.benchmarkGaps && 
                 result.rubricEvaluation.benchmarkGaps.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground">Consider Adding</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.rubricEvaluation.benchmarkGaps.slice(0, 8).map((gap, idx) => {
                        const isAdded = addedKeywords.has(gap);
                        return (
                          <Button
                            key={idx}
                            variant={isAdded ? "secondary" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleAddSkill(gap)}
                            disabled={isAdded}
                          >
                            {isAdded ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <Plus className="h-3 w-3 mr-1" />
                            )}
                            {gap}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Interview Questions Preview */}
                {result.interviewQuestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-muted-foreground">Likely Interview Questions</h3>
                    </div>
                    <div className="space-y-2">
                      {result.interviewQuestions.slice(0, 3).map((q, idx) => (
                        <div key={idx} className="text-sm p-2 rounded bg-muted/30">
                          <p className="font-medium text-foreground">"{q.question}"</p>
                          {q.purpose && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Purpose: {q.purpose}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Good State */}
                {result.recommendation === "strong-yes" && result.criticalGaps.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                    <ThumbsUp className="h-10 w-10 text-green-500" />
                    <h3 className="font-semibold text-foreground">Ready for Submission!</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Your resume presents well for this role. Go ahead and export!
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}

          {/* Footer */}
          {result && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {addedKeywords.size > 0 && (
                <Button onClick={handleClose} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Done ({addedKeywords.size} added)
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
