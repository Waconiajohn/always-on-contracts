import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, ChevronRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface V3ScoreStatusCardProps {
  lastScore?: number;
  lastScoredDate?: string;
  tierInfo?: {
    tier: string;
    emoji: string;
    message: string;
  };
}

export function V3ScoreStatusCard({ lastScore, lastScoredDate, tierInfo }: V3ScoreStatusCardProps) {
  const navigate = useNavigate();
  const hasScore = typeof lastScore === 'number';

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Resume Score</CardTitle>
          </div>
          {tierInfo && (
            <Badge variant="secondary" className="text-xs">
              {tierInfo.emoji} {tierInfo.tier}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        {hasScore ? (
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <span className={`text-5xl font-bold ${getScoreColor(lastScore!)}`}>
                {lastScore}
              </span>
              <span className="text-muted-foreground text-lg mb-1">/100</span>
            </div>
            {tierInfo?.message && (
              <p className="text-sm text-muted-foreground">{tierInfo.message}</p>
            )}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Scored {lastScoredDate ? formatDistanceToNow(new Date(lastScoredDate), { addSuffix: true }) : 'recently'}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/quick-score')}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Improve Score
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Get your resume scored by AI to see how you compare against the competition.
            </p>
            <Button onClick={() => navigate('/quick-score')} className="w-full">
              Get Your Score
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
