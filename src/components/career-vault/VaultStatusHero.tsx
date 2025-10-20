import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface VaultStatusHeroProps {
  strengthScore: number;
  level: 'Developing' | 'Solid' | 'Strong' | 'Elite' | 'Exceptional';
  totalItems: number;
  quickWinsAvailable: number;
  onTakeQuickWins: () => void;
  coreScores: {
    powerPhrases: number;
    skills: number;
    competencies: number;
    intangibles: number;
    quantification: number;
    modernTerms: number;
  };
}

export const VaultStatusHero = ({
  strengthScore,
  level,
  totalItems,
  quickWinsAvailable,
  onTakeQuickWins,
  coreScores
}: VaultStatusHeroProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = () => {
    if (strengthScore >= 80) return <CheckCircle className="h-6 w-6 text-green-500" />;
    if (strengthScore >= 60) return <TrendingUp className="h-6 w-6 text-blue-500" />;
    return <AlertCircle className="h-6 w-6 text-amber-500" />;
  };

  const getStatusMessage = () => {
    if (strengthScore >= 80) {
      return "Your vault can generate elite-level resumes and comprehensive interview prep.";
    }
    if (strengthScore >= 60) {
      return "Your vault can generate competitive resumes and prep you for interviews.";
    }
    return "Your vault is building. Complete the interview to unlock full capabilities.";
  };

  const getNextLevelInfo = () => {
    if (strengthScore >= 90) return { nextLevel: null, pointsNeeded: 0 };
    if (strengthScore >= 80) return { nextLevel: "Exceptional (90+)", pointsNeeded: 90 - strengthScore };
    if (strengthScore >= 70) return { nextLevel: "Elite (80+)", pointsNeeded: 80 - strengthScore };
    if (strengthScore >= 60) return { nextLevel: "Strong (70+)", pointsNeeded: 70 - strengthScore };
    return { nextLevel: "Solid (60+)", pointsNeeded: 60 - strengthScore };
  };

  const { nextLevel, pointsNeeded } = getNextLevelInfo();

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Status */}
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-background rounded-full shadow-sm">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">Your Career Vault: {level}</h2>
              <Badge variant={strengthScore >= 80 ? "default" : "secondary"} className="text-base px-3">
                {strengthScore}/100
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon()}
              <p className="text-muted-foreground">{getStatusMessage()}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">{totalItems} intelligence items extracted</span>
              </div>
              {quickWinsAvailable > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {quickWinsAvailable} Quick Win{quickWinsAvailable > 1 ? 's' : ''} Available
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-3 lg:min-w-[240px]">
          {quickWinsAvailable > 0 && nextLevel && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                Next Level: {nextLevel}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                +{pointsNeeded} points needed
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1"
            >
              View Details
              {showDetails ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
            {quickWinsAvailable > 0 && (
              <Button 
                size="sm"
                onClick={onTakeQuickWins}
                className="flex-1"
              >
                Take Quick Wins →
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Details */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Score Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Power Phrases</span>
                <span className="text-sm text-muted-foreground">{coreScores.powerPhrases}/10</span>
              </div>
              <Progress value={(coreScores.powerPhrases / 10) * 100} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Skills</span>
                <span className="text-sm text-muted-foreground">{coreScores.skills}/10</span>
              </div>
              <Progress value={(coreScores.skills / 10) * 100} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Competencies</span>
                <span className="text-sm text-muted-foreground">{coreScores.competencies}/10</span>
              </div>
              <Progress value={(coreScores.competencies / 10) * 100} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Intangibles</span>
                <span className="text-sm text-muted-foreground">{coreScores.intangibles}/40</span>
              </div>
              <Progress value={(coreScores.intangibles / 40) * 100} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Quantification</span>
                <span className="text-sm text-muted-foreground">{coreScores.quantification}/15</span>
              </div>
              <Progress value={(coreScores.quantification / 15) * 100} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Modern Terms</span>
                <span className="text-sm text-muted-foreground">{coreScores.modernTerms}/15</span>
              </div>
              <Progress value={(coreScores.modernTerms / 15) * 100} className="h-1.5" />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
