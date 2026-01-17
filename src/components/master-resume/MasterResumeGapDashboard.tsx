import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, Target, ArrowRight, Sparkles, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface GapItem {
  category: string;
  gap: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion: string;
  estimatedTime: string;
  impact: number;
}

interface BenchmarkAnalysis {
  overallScore: number;
  targetScore: number;
  strengths: string[];
  gaps: GapItem[];
  recommendations: string[];
}

interface MasterResumeGapDashboardProps {
  resumeContent: string;
  vaultId?: string;
}

export function MasterResumeGapDashboard({ resumeContent, vaultId }: MasterResumeGapDashboardProps) {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['master-resume-benchmark', vaultId],
    queryFn: async (): Promise<BenchmarkAnalysis | null> => {
      if (!resumeContent || resumeContent.length < 100) {
        return null;
      }

      setIsAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-completion-benchmark', {
          body: { 
            resumeText: resumeContent,
            vaultId 
          }
        });

        if (error) throw error;
        
        // Transform the response to our format
        return transformBenchmarkResponse(data);
      } catch (err) {
        console.error('Benchmark analysis error:', err);
        toast.error('Failed to analyze resume gaps');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    enabled: !!resumeContent && resumeContent.length >= 100,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const transformBenchmarkResponse = (data: any): BenchmarkAnalysis => {
    // Handle various response formats from the edge function
    const gaps: GapItem[] = [];
    
    if (data?.gapAnalysis?.gaps) {
      data.gapAnalysis.gaps.forEach((gap: any) => {
        gaps.push({
          category: gap.category || 'General',
          gap: gap.description || gap.gap || 'Missing content',
          severity: gap.severity || 'medium',
          suggestion: gap.suggestion || gap.recommendation || 'Add more detail',
          estimatedTime: gap.estimatedTime || '15 min',
          impact: gap.impact || 5
        });
      });
    }

    if (data?.recommendations) {
      data.recommendations.forEach((rec: any, idx: number) => {
        if (typeof rec === 'string') {
          gaps.push({
            category: 'Improvement',
            gap: rec,
            severity: idx < 2 ? 'high' : 'medium',
            suggestion: rec,
            estimatedTime: '20 min',
            impact: 7 - idx
          });
        }
      });
    }

    return {
      overallScore: data?.overallScore || data?.score || 65,
      targetScore: 85,
      strengths: data?.strengths || [],
      gaps: gaps.slice(0, 8), // Limit to 8 gaps
      recommendations: data?.recommendations || []
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleFillGap = (gap: GapItem) => {
    // Navigate to resume builder with gap context
    navigate(`/resume-builder?fillGap=${encodeURIComponent(gap.category)}`);
  };

  if (isLoading || isAnalyzing) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing your resume against benchmark standards...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take 15-30 seconds</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Add more content to your Master Resume to get AI-powered gap analysis and improvement suggestions.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze My Resume
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = Math.round((analysis.overallScore / analysis.targetScore) * 100);
  const criticalGaps = analysis.gaps.filter(g => g.severity === 'critical' || g.severity === 'high');
  const otherGaps = analysis.gaps.filter(g => g.severity !== 'critical' && g.severity !== 'high');

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Benchmark Score
          </CardTitle>
          <CardDescription>How your Master Resume compares to the benchmark standard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">{analysis.overallScore}</span>
                <span className="text-muted-foreground">/ {analysis.targetScore}</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {progressPercent >= 100 
                  ? "You've reached benchmark level!" 
                  : `${analysis.targetScore - analysis.overallScore} points to reach benchmark`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Gaps Found</div>
              <div className="text-2xl font-bold">{analysis.gaps.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.strengths.map((strength, idx) => (
                <Badge key={idx} variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                  {strength}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Gaps */}
      {criticalGaps.length > 0 && (
        <Card className="border-orange-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Priority Gaps
              <Badge variant="destructive" className="ml-2">{criticalGaps.length}</Badge>
            </CardTitle>
            <CardDescription>Address these first for the biggest impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalGaps.map((gap, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(gap.severity)} variant="secondary">
                        {gap.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {gap.estimatedTime}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{gap.gap}</p>
                    <p className="text-xs text-muted-foreground mt-1">{gap.suggestion}</p>
                  </div>
                  <Button size="sm" onClick={() => handleFillGap(gap)} className="ml-3 shrink-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Fill Gap
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Gaps */}
      {otherGaps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Additional Improvements
            </CardTitle>
            <CardDescription>Nice-to-have enhancements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {otherGaps.map((gap, idx) => (
                <div key={idx} className="p-3 rounded-lg border hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {gap.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      +{gap.impact} pts
                    </span>
                  </div>
                  <p className="text-sm">{gap.gap}</p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="mt-2 h-7 text-xs"
                    onClick={() => handleFillGap(gap)}
                  >
                    Fill This Gap
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Analysis */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => refetch()} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Re-analyze Resume
        </Button>
      </div>
    </div>
  );
}
