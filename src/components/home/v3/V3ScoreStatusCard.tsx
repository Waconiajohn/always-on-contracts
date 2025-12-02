import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Zap, Target, ArrowRight, TrendingUp } from "lucide-react";

interface V3ScoreStatusCardProps {
  lastScore?: number;
  lastScoredDate?: string;
  tierInfo?: {
    tier: string;
    emoji: string;
    message: string;
  };
}

export const V3ScoreStatusCard = ({ 
  lastScore, 
  lastScoredDate,
  tierInfo 
}: V3ScoreStatusCardProps) => {
  const navigate = useNavigate();
  
  const hasScore = typeof lastScore === 'number';
  const mustInterviewThreshold = 80;
  const gapToMustInterview = hasScore ? Math.max(0, mustInterviewThreshold - lastScore) : null;
  
  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Resume Score</CardTitle>
              <CardDescription>Your benchmark candidate status</CardDescription>
            </div>
          </div>
          {hasScore && tierInfo && (
            <Badge variant="outline" className="text-sm">
              {tierInfo.emoji} {tierInfo.tier}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasScore ? (
          <>
            {/* Score Display */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${getScoreColor(lastScore)}`}>
                    {lastScore}
                  </span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                {lastScoredDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last scored: {new Date(lastScoredDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {/* Progress to Benchmark */}
              <div className="text-right">
                {lastScore >= 80 ? (
                  <div className="text-green-500">
                    <Target className="h-8 w-8 mx-auto" />
                    <p className="text-sm font-medium">"Must Speak To"!</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">To benchmark:</p>
                    <p className="text-2xl font-bold text-primary">+{gapToMustInterview} pts</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Qualified</span>
                <span>Benchmark (80+)</span>
              </div>
              <div className="relative">
                <Progress value={lastScore} className="h-3" />
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-primary"
                  style={{ left: '80%' }}
                />
              </div>
            </div>

            {/* Tier Message */}
            {tierInfo && (
              <p className="text-sm text-center text-muted-foreground italic">
                {tierInfo.message}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/quick-score')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Re-Score
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate('/agents/resume-builder-wizard')}
              >
                Improve Score
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          /* No Score Yet */
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-lg">See where you stand</p>
              <p className="text-sm text-muted-foreground">
                Score your resume in 90 seconds. Know exactly what's missing to reach benchmark status.
              </p>
            </div>
            <Button 
              size="lg" 
              className="w-full gap-2"
              onClick={() => navigate('/quick-score')}
            >
              <Zap className="h-5 w-5" />
              Score My Resume (Free)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
