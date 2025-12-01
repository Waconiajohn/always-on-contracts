import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { ResumeAssessment, ResumeSection, HiringManagerFeedback } from "@/types/mustInterviewBuilder";
import { 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  UserCheck,
  ArrowRight,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Eye
} from "lucide-react";

interface HiringManagerReviewProps {
  sections: ResumeSection[];
  jobDescription: string;
  assessment: ResumeAssessment | null;
  onComplete: (feedback: HiringManagerFeedback) => void;
  onBack: () => void;
}

export const HiringManagerReview = ({
  sections,
  jobDescription,
  assessment,
  onComplete,
  onBack
}: HiringManagerReviewProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<HiringManagerFeedback | null>(null);

  // Convert sections to text for analysis
  const resumeContent = sections
    .map(s => `${s.title}\n${s.items.map(i => i.content).join('\n')}`)
    .join('\n\n');

  // Run hiring manager analysis on mount
  useEffect(() => {
    runHiringManagerReview();
  }, []);

  const runHiringManagerReview = async () => {
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('hiring-manager-final-polish', {
        body: {
          resumeContent,
          jobDescription,
          jobTitle: assessment?.roleTitle || '',
          industry: assessment?.industry || ''
        }
      });

      if (error) throw error;

      // Parse the response into our feedback structure
      const parsedFeedback: HiringManagerFeedback = {
        firstImpressionScore: data?.firstImpressionScore || data?.overallScore || 75,
        firstImpressionSummary: data?.firstImpression || data?.summary || "Solid candidate with relevant experience.",
        redFlags: data?.redFlags?.map((rf: any) => ({
          issue: rf.issue || rf,
          severity: rf.severity || 'medium',
          suggestion: rf.suggestion || 'Consider addressing this point'
        })) || [],
        strengths: data?.strengths || [],
        improvements: data?.improvements?.map((imp: any) => ({
          area: imp.area || imp.section || 'General',
          currentText: imp.current || '',
          suggestedText: imp.suggested || imp.recommendation || '',
          reason: imp.reason || 'To strengthen your candidacy'
        })) || [],
        overallRecommendation: data?.recommendation || 'consider'
      };

      setFeedback(parsedFeedback);

      toast({
        title: "Review complete",
        description: "See what a hiring manager would think",
      });

    } catch (error) {
      console.error('Hiring manager review error:', error);
      // Provide default feedback on error
      setFeedback({
        firstImpressionScore: 70,
        firstImpressionSummary: "Analysis unavailable. Please proceed to finalize.",
        redFlags: [],
        strengths: ["Experience appears relevant to the role"],
        improvements: [],
        overallRecommendation: 'consider'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    if (rec === 'strong_hire') return 'text-green-500 bg-green-500/10';
    if (rec === 'consider') return 'text-amber-500 bg-amber-500/10';
    if (rec === 'needs_work') return 'text-orange-500 bg-orange-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const getRecommendationLabel = (rec: string) => {
    if (rec === 'strong_hire') return '🔥 Strong Hire';
    if (rec === 'consider') return '✓ Would Consider';
    if (rec === 'needs_work') return '⚠ Needs Work';
    return '✗ Pass';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Hiring Manager Review</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          AI reviews your résumé as if it were the hiring manager for this role. 
          See what stands out and what could be improved.
        </p>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Running hiring manager simulation...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing first impressions, red flags, and areas for improvement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Display */}
      {feedback && !isAnalyzing && (
        <>
          {/* Overall Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">First Impression Score</h3>
                    <p className="text-sm text-muted-foreground">6-second scan assessment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-4xl font-bold",
                    feedback.firstImpressionScore >= 80 ? "text-green-500" :
                    feedback.firstImpressionScore >= 60 ? "text-amber-500" : "text-red-500"
                  )}>
                    {feedback.firstImpressionScore}
                  </p>
                  <Badge className={getRecommendationColor(feedback.overallRecommendation)}>
                    {getRecommendationLabel(feedback.overallRecommendation)}
                  </Badge>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">
                "{feedback.firstImpressionSummary}"
              </p>
            </CardContent>
          </Card>

          {/* Strengths & Red Flags */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <Card className="border-green-500/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">What Stands Out</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.strengths.length > 0 ? (
                    feedback.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">No specific strengths identified</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Red Flags */}
            <Card className="border-red-500/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-base">Potential Concerns</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.redFlags.length > 0 ? (
                    feedback.redFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className={cn(
                          "h-4 w-4 mt-0.5 flex-shrink-0",
                          flag.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                        )} />
                        <div>
                          <span>{flag.issue}</span>
                          {flag.suggestion && (
                            <p className="text-xs text-muted-foreground mt-1">
                              💡 {flag.suggestion}
                            </p>
                          )}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-green-600">No red flags identified!</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Improvement Suggestions */}
          {feedback.improvements.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Suggested Improvements</CardTitle>
                </div>
                <CardDescription>
                  Consider these changes to strengthen your candidacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedback.improvements.map((imp, i) => (
                  <div key={i} className="border rounded-lg p-4 bg-muted/30">
                    <p className="text-sm font-medium mb-2">{imp.area}</p>
                    {imp.currentText && (
                      <p className="text-xs text-muted-foreground line-through mb-2">
                        "{imp.currentText}"
                      </p>
                    )}
                    <p className="text-sm text-primary">
                      → {imp.suggestedText}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Why: {imp.reason}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* What's Next */}
          <Alert className="border-primary/20 bg-primary/5">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Ready to finalize?</AlertTitle>
            <AlertDescription>
              Your résumé has been reviewed. In the next step, we'll run an ATS compatibility check 
              and prepare your résumé for export as PDF or DOCX.
            </AlertDescription>
          </Alert>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back to Edit Sections
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runHiringManagerReview}
            disabled={isAnalyzing}
          >
            Re-run Review
          </Button>
          <Button
            size="lg"
            onClick={() => feedback && onComplete(feedback)}
            disabled={isAnalyzing || !feedback}
            className="gap-2"
          >
            Continue to Finalize
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
