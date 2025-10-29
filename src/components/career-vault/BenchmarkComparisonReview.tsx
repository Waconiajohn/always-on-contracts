import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";

interface Gap {
  category: string;
  score: number;
  benchmark: number;
  status: 'exceeds' | 'matches' | 'below';
  gap?: number;
  evidence: string[];
  message: string;
  recommendations?: string[];
  quickFix?: {
    action: string;
    items: string[];
  };
}

interface BenchmarkComparisonProps {
  gapAnalysis: {
    strengths: Gap[];
    opportunities: Gap[];
    gaps: Gap[];
    overallAnalysis: {
      vaultStrength: number;
      benchmarkAlignment: number;
      competitivePosition: string;
      topStrengths: string[];
      topGaps: string[];
    };
  };
  onComplete: () => void;
  onAddRecommendedItems: (items: string[]) => void;
}

export const BenchmarkComparisonReview = ({ 
  gapAnalysis, 
  onComplete,
  onAddRecommendedItems 
}: BenchmarkComparisonProps) => {
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<string[]>([]);

  const handleAcceptRecommendation = (category: string, items: string[]) => {
    setAcceptedRecommendations(prev => [...prev, category]);
    onAddRecommendedItems(items);
  };

  const renderGapCard = (gap: Gap) => {
    const isAccepted = acceptedRecommendations.includes(gap.category);
    
    return (
      <Card key={gap.category} className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-base capitalize">
                  {gap.category.replace(/_/g, ' ')}
                </CardTitle>
                {gap.status === 'exceeds' && (
                  <Badge variant="default" className="bg-success">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Exceeds Benchmark
                  </Badge>
                )}
                {gap.status === 'matches' && (
                  <Badge variant="secondary">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Matches Benchmark
                  </Badge>
                )}
                {gap.status === 'below' && (
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Below Benchmark
                  </Badge>
                )}
              </div>
              <CardDescription>{gap.message}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Industry Benchmark</p>
              <div className="flex items-center gap-2">
                <Progress value={gap.benchmark} className="flex-1" />
                <span className="text-sm font-medium">{gap.benchmark}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Score</p>
              <div className="flex items-center gap-2">
                <Progress 
                  value={gap.score} 
                  className="flex-1"
                  indicatorClassName={gap.status === 'exceeds' ? 'bg-success' : gap.status === 'below' ? 'bg-destructive' : ''}
                />
                <span className="text-sm font-medium">{gap.score}%</span>
              </div>
            </div>
          </div>

          {gap.evidence.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Evidence</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {gap.evidence.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {gap.recommendations && gap.recommendations.length > 0 && (
            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Recommendations
              </p>
              <ul className="text-sm space-y-1">
                {gap.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
              {gap.quickFix && (
                <Button
                  onClick={() => handleAcceptRecommendation(gap.category, gap.quickFix!.items)}
                  disabled={isAccepted}
                  size="sm"
                  className="mt-3"
                >
                  {isAccepted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Added to Vault
                    </>
                  ) : (
                    <>Add {gap.quickFix.items.length} Items to Vault</>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Overall Summary */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl">Your Career Vault Benchmark Analysis</CardTitle>
          <CardDescription>
            See how your profile compares to top executives in your field
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Vault Strength</p>
              <p className="text-3xl font-bold text-primary">
                {gapAnalysis.overallAnalysis.vaultStrength}%
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Benchmark Alignment</p>
              <p className="text-3xl font-bold">
                {gapAnalysis.overallAnalysis.benchmarkAlignment}%
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Position</p>
              <p className="text-lg font-semibold mt-2">
                {gapAnalysis.overallAnalysis.competitivePosition}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <p className="font-semibold text-success mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Top Strengths
              </p>
              <ul className="text-sm space-y-1">
                {gapAnalysis.overallAnalysis.topStrengths.map((strength, i) => (
                  <li key={i} className="capitalize">{strength.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="font-semibold text-destructive mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Areas to Highlight
              </p>
              <ul className="text-sm space-y-1">
                {gapAnalysis.overallAnalysis.topGaps.map((gap, i) => (
                  <li key={i} className="capitalize">{gap.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      {gapAnalysis.strengths.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Your Strengths ({gapAnalysis.strengths.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gapAnalysis.strengths.map(renderGapCard)}
          </div>
        </div>
      )}

      {/* Gaps */}
      {gapAnalysis.gaps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Opportunities to Strengthen ({gapAnalysis.gaps.length})
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {gapAnalysis.gaps.map(renderGapCard)}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {gapAnalysis.opportunities.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Good, Could Be Better ({gapAnalysis.opportunities.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gapAnalysis.opportunities.map(renderGapCard)}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onComplete} className="flex-1">
              Skip Review
            </Button>
            <Button onClick={onComplete} className="flex-1">
              Complete Vault Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
