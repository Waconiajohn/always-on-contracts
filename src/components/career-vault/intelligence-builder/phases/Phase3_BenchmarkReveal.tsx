import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Phase3Props {
  vaultId: string;
  onProgress: (progress: number) => void;
  onTimeEstimate: (estimate: string) => void;
  onComplete: () => void;
}

interface BenchmarkComparison {
  confirmed_data: {
    technical_skills: string[];
    leadership_skills: string[];
    achievements: string[];
  };
  likely_data: {
    technical_skills: string[];
    leadership_skills: string[];
    achievements: string[];
  };
  gaps_requiring_questions: Array<{
    gap_id: string;
    gap_type: string;
    requirement: string;
    priority: 'blocking' | 'important' | 'nice_to_have';
    reasoning: string;
  }>;
  evidence_summary: {
    strength_score: number;
    completeness_percentage: number;
  };
}

export const Phase3_BenchmarkReveal = ({
  vaultId,
  onProgress,
  onTimeEstimate,
  onComplete
}: Phase3Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkComparison | null>(null);
  const [marketData, setMarketData] = useState<any>(null);

  useEffect(() => {
    loadBenchmarkData();
  }, [vaultId]);

  const loadBenchmarkData = async () => {
    setIsLoading(true);
    onProgress(20);

    try {
      // Load benchmark comparison
      const { data: comparisonData, error: comparisonError } = await supabase
        .from('vault_benchmark_comparison')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (comparisonError) throw comparisonError;

      onProgress(60);

      // Load market research data
      const { data: marketResearch, error: marketError } = await supabase
        .from('vault_market_research')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!marketError && marketResearch) {
        setMarketData(marketResearch);
      }

      setBenchmark(comparisonData as any);
      onProgress(100);
      onTimeEstimate('~3 minutes to review gaps');
    } catch (error) {
      console.error('Error loading benchmark data:', error);
      toast.error('Failed to load benchmark comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGapInterview = async () => {
    setIsGeneratingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-gap-questions', {
        body: {
          vaultId,
          gaps: benchmark?.gaps_requiring_questions || []
        }
      });

      if (error) throw error;

      toast.success(`Generated ${data.totalQuestions} targeted questions`);
      onComplete();
    } catch (error) {
      console.error('Error generating gap questions:', error);
      toast.error('Failed to generate interview questions');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'blocking': return 'destructive';
      case 'important': return 'warning';
      default: return 'secondary';
    }
  };

  if (isLoading || !benchmark) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Analyzing your competitive position...</p>
      </div>
    );
  }

  const blockingGaps = benchmark.gaps_requiring_questions.filter(g => g.priority === 'blocking');
  const importantGaps = benchmark.gaps_requiring_questions.filter(g => g.priority === 'important');
  const niceToHaveGaps = benchmark.gaps_requiring_questions.filter(g => g.priority === 'nice_to_have');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Your Competitive Position</h2>
        <p className="text-lg text-muted-foreground">
          See how you stack up against market expectations
        </p>
      </div>

      {/* Strength Score */}
      <Card className="p-6 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">
              {benchmark.evidence_summary?.strength_score ?? 0}%
            </h3>
            <p className="text-sm text-muted-foreground">Market Readiness Score</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold">
              {benchmark.evidence_summary?.completeness_percentage ?? 0}%
            </h3>
            <p className="text-sm text-muted-foreground">Profile Completeness</p>
          </div>
        </div>
      </Card>

      {/* YOU vs MARKET Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* YOUR PROFILE */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">YOU</h3>
            <Badge variant="default">Confirmed Evidence</Badge>
          </div>

          <div className="space-y-4">
            {benchmark.confirmed_data?.technical_skills?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Technical Skills</h4>
                <div className="space-y-1">
                  {benchmark.confirmed_data.technical_skills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {benchmark.confirmed_data?.leadership_skills?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Leadership</h4>
                <div className="space-y-1">
                  {benchmark.confirmed_data.leadership_skills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* MARKET EXPECTATIONS */}
        <Card className="p-6 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">MARKET</h3>
            <Badge variant="secondary">Expected Skills</Badge>
          </div>

          <div className="space-y-4">
            {marketData?.expected_skills && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Common Requirements</h4>
                <div className="space-y-1">
                  {marketData.expected_skills.slice(0, 5).map((skill: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Gap Analysis or Success Message */}
      <div className="space-y-6">
        {benchmark.gaps_requiring_questions.length === 0 ? (
          <Card className="p-8 bg-green-500/10 border-green-500/20">
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-2xl font-bold text-green-500">Excellent Profile!</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Your profile shows strong alignment with market expectations. No critical gaps were identified. 
                You're ready to explore your complete Career Intelligence Library.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div>
              <h3 className="text-2xl font-bold mb-4">Gaps to Address</h3>
              <p className="text-muted-foreground mb-6">
                We'll help you fill these gaps through targeted questions in the next phase
              </p>
            </div>

        {/* Blocking Gaps */}
        {blockingGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h4 className="font-bold">Critical Gaps ({blockingGaps.length})</h4>
            </div>
            {blockingGaps.map((gap, i) => (
              <Card key={i} className="p-4 border-destructive">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(gap.priority) as any}>
                        {gap.gap_type}
                      </Badge>
                      <p className="font-semibold">{gap.requirement}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{gap.reasoning}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Important Gaps */}
        {importantGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h4 className="font-bold">Important Gaps ({importantGaps.length})</h4>
            </div>
            {importantGaps.map((gap, i) => (
              <Card key={i} className="p-4 border-orange-500/50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(gap.priority) as any}>
                        {gap.gap_type}
                      </Badge>
                      <p className="font-semibold">{gap.requirement}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{gap.reasoning}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Nice-to-Have Gaps */}
        {niceToHaveGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-bold">Enhancement Opportunities ({niceToHaveGaps.length})</h4>
            </div>
            {niceToHaveGaps.map((gap, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(gap.priority) as any}>
                        {gap.gap_type}
                      </Badge>
                      <p className="font-semibold">{gap.requirement}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{gap.reasoning}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      {/* Continue Button */}
      <Card className="p-6 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">
              {benchmark.gaps_requiring_questions.length === 0 
                ? "Continue to Vault Library" 
                : "Ready to Fill the Gaps?"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isGeneratingQuestions 
                ? "Generating personalized questions..."
                : benchmark.gaps_requiring_questions.length === 0
                  ? "Your profile is complete. Explore your full career intelligence."
                  : "Next, we'll ask targeted questions to unlock your hidden strengths"
              }
            </p>
          </div>
          <Button 
            onClick={handleStartGapInterview} 
            size="lg"
            disabled={isGeneratingQuestions}
          >
            {isGeneratingQuestions 
              ? "Generating..." 
              : benchmark.gaps_requiring_questions.length === 0
                ? "Continue to Library"
                : "Start Gap Interview"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
