import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  Target, 
  Building, 
  FileCheck, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ScoreBreakdownCardsProps {
  scores: {
    jdMatch: { score: number; weight: number };
    industryBenchmark: { score: number; weight: number };
    atsCompliance: { score: number; weight: number };
    humanVoice: { score: number; weight: number };
  };
  breakdown: {
    jdMatch: {
      matchedKeywords: Array<{ keyword: string; priority: string }>;
      missingKeywords: Array<{ keyword: string; priority: string; prevalence?: string }>;
      skillsMatch: number;
      experienceMatch: number;
    };
    industryBenchmark: {
      roleStandards: string[];
      meetingStandards: string[];
      belowStandards: string[];
      competitiveRank: string;
    };
    atsCompliance: {
      headerIssues: string[];
      formatIssues: string[];
      keywordPlacement: string;
    };
    humanVoice: {
      aiProbability: number;
      concerns: string[];
      humanElements: string[];
    };
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getProgressColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getStatusIcon(score: number) {
  if (score >= 80) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (score >= 60) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

interface ScoreCardProps {
  title: string;
  score: number;
  weight: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}

function ScoreCard({ title, score, weight, icon, children, delay = 0 }: ScoreCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="h-full">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {icon}
                  <CardTitle className="text-sm font-medium">{title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{weight}% weight</span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 mb-3">
              <span className={cn('text-3xl font-bold tabular-nums', getScoreColor(score))}>
                {score}%
              </span>
              {getStatusIcon(score)}
            </div>
            <Progress 
              value={score} 
              className={cn('h-2', getProgressColor(score))}
            />
            
            <CollapsibleContent className="mt-4 space-y-3">
              {children}
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

export function ScoreBreakdownCards({ scores, breakdown }: ScoreBreakdownCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* JD Match Card */}
      <ScoreCard
        title="JD Match"
        score={scores.jdMatch.score}
        weight={scores.jdMatch.weight}
        icon={<Target className="h-4 w-4 text-primary" />}
        delay={0}
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Missing Keywords</p>
            <div className="flex flex-wrap gap-1">
              {breakdown.jdMatch.missingKeywords?.slice(0, 5).map((kw, i) => (
                <Badge 
                  key={i} 
                  variant={kw.priority === 'critical' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {kw.keyword}
                </Badge>
              ))}
              {(breakdown.jdMatch.missingKeywords?.length || 0) > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{(breakdown.jdMatch.missingKeywords?.length || 0) - 5} more
                </Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Skills:</span>
              <span className={cn('ml-1 font-medium', getScoreColor(breakdown.jdMatch.skillsMatch))}>
                {breakdown.jdMatch.skillsMatch}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Experience:</span>
              <span className={cn('ml-1 font-medium', getScoreColor(breakdown.jdMatch.experienceMatch))}>
                {breakdown.jdMatch.experienceMatch}%
              </span>
            </div>
          </div>
        </div>
      </ScoreCard>

      {/* Industry Benchmark Card */}
      <ScoreCard
        title="Industry Standard"
        score={scores.industryBenchmark.score}
        weight={scores.industryBenchmark.weight}
        icon={<Building className="h-4 w-4 text-primary" />}
        delay={0.1}
      >
        <div className="space-y-3">
          {breakdown.industryBenchmark.competitiveRank && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {breakdown.industryBenchmark.competitiveRank}
              </Badge>
              <span className="text-xs text-muted-foreground">competitive rank</span>
            </div>
          )}
          {breakdown.industryBenchmark.belowStandards?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Below Standards</p>
              <ul className="text-xs space-y-1">
                {breakdown.industryBenchmark.belowStandards.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ScoreCard>

      {/* ATS Compliance Card */}
      <ScoreCard
        title="ATS Compliance"
        score={scores.atsCompliance.score}
        weight={scores.atsCompliance.weight}
        icon={<FileCheck className="h-4 w-4 text-primary" />}
        delay={0.2}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Keyword Placement:</span>
            <Badge 
              variant={breakdown.atsCompliance.keywordPlacement === 'good' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {breakdown.atsCompliance.keywordPlacement}
            </Badge>
          </div>
          
          {(breakdown.atsCompliance.headerIssues?.length > 0 || breakdown.atsCompliance.formatIssues?.length > 0) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Issues Found</p>
              <ul className="text-xs space-y-1">
                {breakdown.atsCompliance.headerIssues?.slice(0, 2).map((issue, i) => (
                  <li key={`h-${i}`} className="flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
                {breakdown.atsCompliance.formatIssues?.slice(0, 2).map((issue, i) => (
                  <li key={`f-${i}`} className="flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ScoreCard>

      {/* Human Voice Card */}
      <ScoreCard
        title="Human Voice"
        score={scores.humanVoice.score}
        weight={scores.humanVoice.weight}
        icon={<User className="h-4 w-4 text-primary" />}
        delay={0.3}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">AI Detection Risk:</span>
            <Badge 
              variant={breakdown.humanVoice.aiProbability < 30 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {breakdown.humanVoice.aiProbability}%
            </Badge>
          </div>
          
          {breakdown.humanVoice.concerns?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Concerns</p>
              <ul className="text-xs space-y-1">
                {breakdown.humanVoice.concerns.slice(0, 3).map((concern, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {breakdown.humanVoice.humanElements?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Human Elements</p>
              <ul className="text-xs space-y-1">
                {breakdown.humanVoice.humanElements.slice(0, 2).map((element, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{element}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ScoreCard>
    </div>
  );
}
