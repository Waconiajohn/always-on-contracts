import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Linkedin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConsistencyResult {
  alignmentScore: number;
  matchingSkills: string[];
  resumeOnlySkills: string[];
  linkedInOnlySkills: string[];
  recommendations: {
    addToLinkedIn: string[];
    addToResume: string[];
    keywordGaps: string[];
  };
  summary: string;
}

interface LinkedInConsistencyCheckProps {
  resumeContent: string;
}

export function LinkedInConsistencyCheck({ resumeContent }: LinkedInConsistencyCheckProps) {
  const [linkedInSkills, setLinkedInSkills] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ConsistencyResult | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const analyzeConsistency = async () => {
    if (!resumeContent || resumeContent.length < 100) {
      toast.error("Please add more content to your Master Resume first");
      return;
    }

    if (!linkedInSkills.trim()) {
      toast.error("Please paste your LinkedIn skills or profile content");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-linkedin-resume-consistency', {
        body: {
          resumeContent,
          linkedInContent: linkedInSkills,
        },
      });

      if (error) throw error;

      // Transform response to our format
      const consistencyResult: ConsistencyResult = {
        alignmentScore: data.alignmentScore || data.score || 70,
        matchingSkills: data.matchingSkills || data.matching || [],
        resumeOnlySkills: data.resumeOnlySkills || data.resumeOnly || [],
        linkedInOnlySkills: data.linkedInOnlySkills || data.linkedInOnly || [],
        recommendations: {
          addToLinkedIn: data.recommendations?.addToLinkedIn || data.addToLinkedIn || [],
          addToResume: data.recommendations?.addToResume || data.addToResume || [],
          keywordGaps: data.recommendations?.keywordGaps || data.keywordGaps || [],
        },
        summary: data.summary || "Analysis complete.",
      };

      setResult(consistencyResult);
      toast.success("LinkedIn-Resume consistency analysis complete");
    } catch (err) {
      console.error("Consistency analysis error:", err);
      toast.error("Failed to analyze consistency");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                <CardTitle className="text-lg">LinkedIn-Resume Consistency</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {result && (
                  <Badge variant="outline" className={getScoreColor(result.alignmentScore)}>
                    {result.alignmentScore}% aligned
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
            <CardDescription>
              Ensure your LinkedIn profile keywords match your Master Resume
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* LinkedIn Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Paste your LinkedIn Skills & Headline
              </label>
              <Textarea
                value={linkedInSkills}
                onChange={(e) => setLinkedInSkills(e.target.value)}
                placeholder="Copy/paste from LinkedIn: your headline, skills section, and about section keywords..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Go to your LinkedIn profile → Skills section → Select all and copy, or paste your entire About section
              </p>
            </div>

            <Button
              onClick={analyzeConsistency}
              disabled={isAnalyzing || !linkedInSkills.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Check Consistency
                </>
              )}
            </Button>

            {/* Results */}
            {result && (
              <div className="space-y-4 pt-4 border-t">
                {/* Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alignment Score</span>
                    <span className={`text-lg font-bold ${getScoreColor(result.alignmentScore)}`}>
                      {result.alignmentScore}%
                    </span>
                  </div>
                  <Progress value={result.alignmentScore} className={`h-2 ${getScoreBg(result.alignmentScore)}`} />
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>

                {/* Matching Skills */}
                {result.matchingSkills.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Matching Skills ({result.matchingSkills.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchingSkills.slice(0, 12).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                          {skill}
                        </Badge>
                      ))}
                      {result.matchingSkills.length > 12 && (
                        <Badge variant="outline">+{result.matchingSkills.length - 12} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills only on Resume */}
                {result.resumeOnlySkills.length > 0 && (
                  <div className="space-y-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4" />
                        On Resume, Missing from LinkedIn ({result.resumeOnlySkills.length})
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(result.resumeOnlySkills.join(", "), "resume-skills")}
                      >
                        {copiedSection === "resume-skills" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.resumeOnlySkills.slice(0, 10).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="bg-amber-500/10">
                          {skill}
                        </Badge>
                      ))}
                      {result.resumeOnlySkills.length > 10 && (
                        <Badge variant="outline">+{result.resumeOnlySkills.length - 10} more</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add these to your LinkedIn Skills section for better recruiter visibility
                    </p>
                  </div>
                )}

                {/* Skills only on LinkedIn */}
                {result.linkedInOnlySkills.length > 0 && (
                  <div className="space-y-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                      <Linkedin className="h-4 w-4" />
                      On LinkedIn, Missing from Resume ({result.linkedInOnlySkills.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.linkedInOnlySkills.slice(0, 8).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-500/10">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Consider adding these to your Master Resume if relevant to your experience
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {(result.recommendations.addToLinkedIn.length > 0 || result.recommendations.keywordGaps.length > 0) && (
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Recommended Actions
                    </h4>

                    {result.recommendations.addToLinkedIn.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Add to LinkedIn:</p>
                        <ul className="space-y-1">
                          {result.recommendations.addToLinkedIn.slice(0, 5).map((rec, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.recommendations.keywordGaps.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Keyword Opportunities:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.recommendations.keywordGaps.slice(0, 8).map((kw, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
