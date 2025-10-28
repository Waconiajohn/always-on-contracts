import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Target } from 'lucide-react';

interface VaultQualityScoreProps {
  currentScore: number;
  maxScore: number;
  level: string;
  nextLevel: string;
  pointsToNextLevel: number;
  weeklyImprovement: number;
  percentile: number;
}

export const VaultQualityScore = ({
  currentScore,
  maxScore,
  level,
  nextLevel,
  pointsToNextLevel,
  weeklyImprovement,
  percentile
}: VaultQualityScoreProps) => {
  const nextLevelProgress = ((currentScore % 100) / 100) * 100;

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'developing': return 'bg-gray-500';
      case 'solid': return 'bg-blue-500';
      case 'strong': return 'bg-purple-500';
      case 'elite': return 'bg-orange-500';
      case 'exceptional': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'exceptional': return '🏆';
      case 'elite': return '💎';
      case 'strong': return '⭐';
      case 'solid': return '🔷';
      default: return '🔸';
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Vault Quality Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level & Score */}
        <div className="text-center space-y-2">
          <div className="text-6xl font-bold text-primary">
            {currentScore}
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl">{getLevelIcon(level)}</span>
            <Badge className={`${getLevelColor(level)} text-white text-lg px-4 py-1`}>
              {level}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            out of {maxScore} points
          </p>
        </div>

        {/* Progress to Next Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress to {nextLevel}</span>
            <span className="text-muted-foreground">
              {pointsToNextLevel} points to go
            </span>
          </div>
          <Progress value={nextLevelProgress} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-background rounded-lg border">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600 mb-1">
              {weeklyImprovement > 0 && '+'}
              {weeklyImprovement}
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              Weekly Improvement
            </p>
          </div>
          
          <div className="text-center p-3 bg-background rounded-lg border">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary mb-1">
              {percentile}%
              <Target className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              Better than users
            </p>
          </div>
        </div>

        {/* Milestones */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Unlock Milestones:</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={currentScore >= 50 ? 'text-green-600' : 'text-muted-foreground'}>
                {currentScore >= 50 ? '✓' : '○'}
              </span>
              <span>50 pts - Solid Foundation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={currentScore >= 75 ? 'text-green-600' : 'text-muted-foreground'}>
                {currentScore >= 75 ? '✓' : '○'}
              </span>
              <span>75 pts - Verified Professional</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={currentScore >= 100 ? 'text-green-600' : 'text-muted-foreground'}>
                {currentScore >= 100 ? '✓' : '○'}
              </span>
              <span>100 pts - Elite Candidate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={currentScore >= 125 ? 'text-green-600' : 'text-muted-foreground'}>
                {currentScore >= 125 ? '✓' : '○'}
              </span>
              <span>125 pts - Exceptional Profile</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="p-3 bg-primary/10 rounded-lg text-center">
          <p className="text-sm font-medium text-primary">
            🎯 Complete {Math.ceil(pointsToNextLevel / 5)} more suggestions to reach {nextLevel}!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
