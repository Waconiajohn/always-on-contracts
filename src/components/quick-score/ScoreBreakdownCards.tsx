import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getProgressColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getStatusIcon(score: number) {
  if (score >= 80) return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (score >= 60) return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

interface CardTheme {
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  iconClass: string;
}

const cardThemes: Record<string, CardTheme> = {
  jdMatch: {
    bgClass: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30',
    borderClass: 'border-l-4 border-l-blue-500 border-blue-200 dark:border-blue-800',
    iconBgClass: 'bg-blue-100 dark:bg-blue-900/50',
    iconClass: 'text-blue-600 dark:text-blue-400'
  },
  industryBenchmark: {
    bgClass: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30',
    borderClass: 'border-l-4 border-l-purple-500 border-purple-200 dark:border-purple-800',
    iconBgClass: 'bg-purple-100 dark:bg-purple-900/50',
    iconClass: 'text-purple-600 dark:text-purple-400'
  },
  atsCompliance: {
    bgClass: 'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/50 dark:to-cyan-900/30',
    borderClass: 'border-l-4 border-l-cyan-500 border-cyan-200 dark:border-cyan-800',
    iconBgClass: 'bg-cyan-100 dark:bg-cyan-900/50',
    iconClass: 'text-cyan-600 dark:text-cyan-400'
  },
  humanVoice: {
    bgClass: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30',
    borderClass: 'border-l-4 border-l-amber-500 border-amber-200 dark:border-amber-800',
    iconBgClass: 'bg-amber-100 dark:bg-amber-900/50',
    iconClass: 'text-amber-600 dark:text-amber-400'
  }
};

interface ScoreCardProps {
  title: string;
  score: number;
  weight: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  theme: CardTheme;
}

function ScoreCard({ title, score, weight, icon, children, delay = 0, theme }: ScoreCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="h-full"
    >
      <Card className={cn(
        'h-full overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg',
        theme.bgClass,
        theme.borderClass
      )}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-background/30 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', theme.iconBgClass)}>
                    {icon}
                  </div>
                  <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-background/50">
                    {weight}% weight
                  </Badge>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 mb-3">
              <span className={cn('text-4xl font-bold tabular-nums', getScoreColor(score))}>
                {score}%
              </span>
              {getStatusIcon(score)}
            </div>
            <div className="relative h-3 rounded-full bg-background/50 overflow-hidden">
              <motion.div
                className={cn('absolute inset-y-0 left-0 rounded-full', getProgressColor(score))}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            
            <CollapsibleContent className="mt-4 space-y-3">
              <div className="p-3 rounded-lg bg-background/60 backdrop-blur-sm">
                {children}
              </div>
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
        icon={<Target className={cn('h-5 w-5', cardThemes.jdMatch.iconClass)} />}
        delay={0}
        theme={cardThemes.jdMatch}
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Missing Keywords</p>
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
            <div className="p-2 rounded bg-background/50">
              <span className="text-muted-foreground block">Skills</span>
              <span className={cn('font-bold text-lg', getScoreColor(breakdown.jdMatch.skillsMatch))}>
                {breakdown.jdMatch.skillsMatch}%
              </span>
            </div>
            <div className="p-2 rounded bg-background/50">
              <span className="text-muted-foreground block">Experience</span>
              <span className={cn('font-bold text-lg', getScoreColor(breakdown.jdMatch.experienceMatch))}>
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
        icon={<Building className={cn('h-5 w-5', cardThemes.industryBenchmark.iconClass)} />}
        delay={0.1}
        theme={cardThemes.industryBenchmark}
      >
        <div className="space-y-3">
          {breakdown.industryBenchmark.competitiveRank && (
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500 hover:bg-purple-600 text-xs">
                {breakdown.industryBenchmark.competitiveRank}
              </Badge>
              <span className="text-xs text-muted-foreground">competitive rank</span>
            </div>
          )}
          {breakdown.industryBenchmark.belowStandards?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Below Standards</p>
              <ul className="text-xs space-y-1.5">
                {breakdown.industryBenchmark.belowStandards.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 p-1.5 rounded bg-red-50 dark:bg-red-950/30">
                    <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
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
        icon={<FileCheck className={cn('h-5 w-5', cardThemes.atsCompliance.iconClass)} />}
        delay={0.2}
        theme={cardThemes.atsCompliance}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Keyword Placement:</span>
            <Badge 
              className={cn(
                'text-xs',
                breakdown.atsCompliance.keywordPlacement === 'good' 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-amber-500 hover:bg-amber-600'
              )}
            >
              {breakdown.atsCompliance.keywordPlacement}
            </Badge>
          </div>
          
          {(breakdown.atsCompliance.headerIssues?.length > 0 || breakdown.atsCompliance.formatIssues?.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Issues Found</p>
              <ul className="text-xs space-y-1.5">
                {breakdown.atsCompliance.headerIssues?.slice(0, 2).map((issue, i) => (
                  <li key={`h-${i}`} className="flex items-start gap-2 p-1.5 rounded bg-amber-50 dark:bg-amber-950/30">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
                {breakdown.atsCompliance.formatIssues?.slice(0, 2).map((issue, i) => (
                  <li key={`f-${i}`} className="flex items-start gap-2 p-1.5 rounded bg-amber-50 dark:bg-amber-950/30">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
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
        icon={<User className={cn('h-5 w-5', cardThemes.humanVoice.iconClass)} />}
        delay={0.3}
        theme={cardThemes.humanVoice}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">AI Detection Risk:</span>
            <Badge 
              className={cn(
                'text-xs',
                breakdown.humanVoice.aiProbability < 30 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-red-500 hover:bg-red-600'
              )}
            >
              {breakdown.humanVoice.aiProbability}%
            </Badge>
          </div>
          
          {breakdown.humanVoice.concerns?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Concerns</p>
              <ul className="text-xs space-y-1.5">
                {breakdown.humanVoice.concerns.slice(0, 3).map((concern, i) => (
                  <li key={i} className="flex items-start gap-2 p-1.5 rounded bg-amber-50 dark:bg-amber-950/30">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {breakdown.humanVoice.humanElements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Human Elements</p>
              <ul className="text-xs space-y-1.5">
                {breakdown.humanVoice.humanElements.slice(0, 2).map((element, i) => (
                  <li key={i} className="flex items-start gap-2 p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
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
