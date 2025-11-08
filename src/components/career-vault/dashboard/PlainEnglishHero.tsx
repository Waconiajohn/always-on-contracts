import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, AlertCircle } from "lucide-react";

interface PlainEnglishHeroProps {
  score: number;
  totalItems: number;
  onPrimaryAction: () => void;
}

export const PlainEnglishHero = ({ score, totalItems, onPrimaryAction }: PlainEnglishHeroProps) => {
  const getScoreInfo = (score: number) => {
    if (score >= 85) return {
      label: 'Excellent',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      emoji: '✅',
      message: 'Your resume stands out to hiring managers. Ready to create tailored documents.'
    };
    if (score >= 70) return {
      label: 'Good',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      emoji: '👍',
      message: 'Your resume is competitive for most roles. A few improvements will make it excellent.'
    };
    if (score >= 50) return {
      label: 'Okay',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      emoji: '⚠️',
      message: 'Your resume shows experience but lacks key details about your impact and achievements.'
    };
    if (score >= 30) return {
      label: 'Needs Work',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      emoji: '🔴',
      message: 'Your resume has the basics, but we couldn\'t find much detail about your achievements and impact.'
    };
    return {
      label: 'Incomplete',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      emoji: '❌',
      message: 'Your resume is missing critical information. Let\'s build it out together.'
    };
  };

  const scoreInfo = getScoreInfo(score);

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Score visualization */}
          <div className="flex-1">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Your Resume Strength
            </h2>
            
            {/* Linear progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold">{score}</span>
                <span className="text-lg text-muted-foreground">/ 100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all ${
                    score >= 85 ? 'bg-green-500' :
                    score >= 70 ? 'bg-blue-500' :
                    score >= 50 ? 'bg-yellow-500' :
                    score >= 30 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Score label */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${scoreInfo.bgColor}`}>
              <span className="text-lg">{scoreInfo.emoji}</span>
              <span className={`font-semibold ${scoreInfo.color}`}>
                {scoreInfo.label}
              </span>
            </div>
          </div>

          {/* Right: Explanation and CTA */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                What this means:
              </h3>
              <p className="text-sm leading-relaxed">
                {scoreInfo.message}
              </p>
            </div>

            {score < 70 && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Most hiring managers won't see your full value without more specific details. 
                  Complete the sections below to improve your positioning.
                </p>
              </div>
            )}

            <Button 
              onClick={onPrimaryAction}
              className="w-full md:w-auto"
              size="lg"
            >
              {score < 70 ? (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Fix My Resume
                </>
              ) : (
                <>
                  Create Tailored Resume
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Career Details Extracted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{score >= 70 ? '✓' : 'In Progress'}</p>
              <p className="text-xs text-muted-foreground">Resume Quality</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {score >= 85 ? 'Ready' : score >= 70 ? 'Almost' : 'Building'}
              </p>
              <p className="text-xs text-muted-foreground">Market Readiness</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
