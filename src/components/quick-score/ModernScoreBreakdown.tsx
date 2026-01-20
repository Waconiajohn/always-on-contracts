/**
 * ModernScoreBreakdown - Clean expandable score categories
 * Typography and whitespace focused, no colored box backgrounds
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  Target, 
  Building, 
  FileCheck, 
  User,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ModernScoreBreakdownProps {
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

interface CategoryRowProps {
  title: string;
  score: number;
  weight: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CategoryRow({ title, score, weight, icon, children, defaultOpen = false }: CategoryRowProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border-b border-border last:border-b-0">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between py-4 hover:bg-muted/30 transition-colors px-1 -mx-1 rounded">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{icon}</span>
              <span className="font-medium text-sm">{title}</span>
              <span className="text-xs text-muted-foreground">({weight}% weight)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-lg font-semibold tabular-nums",
                  score >= 80 ? "text-primary" : score >= 60 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {score}%
                </span>
                <Progress value={score} className="w-16 h-1.5" />
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-90"
              )} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pb-4 pt-1 pl-9 pr-1 text-sm">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ModernScoreBreakdown({ scores, breakdown }: ModernScoreBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="border border-border rounded-lg bg-background"
    >
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Score Breakdown
        </h3>
      </div>
      
      <div className="px-4">
        {/* JD Match */}
        <CategoryRow
          title="Job Description Match"
          score={scores.jdMatch.score}
          weight={scores.jdMatch.weight}
          icon={<Target className="h-4 w-4" />}
        >
          <div className="space-y-3">
            {/* Missing Keywords */}
            {breakdown.jdMatch.missingKeywords?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Missing Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {breakdown.jdMatch.missingKeywords.slice(0, 6).map((kw, i) => (
                    <Badge 
                      key={i} 
                      variant={kw.priority === 'critical' ? 'destructive' : 'outline'}
                      className="text-xs font-normal"
                    >
                      {kw.keyword}
                    </Badge>
                  ))}
                  {breakdown.jdMatch.missingKeywords.length > 6 && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      +{breakdown.jdMatch.missingKeywords.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Skills & Experience */}
            <div className="flex gap-6 text-xs">
              <div>
                <span className="text-muted-foreground">Skills Match: </span>
                <span className="font-medium">{breakdown.jdMatch.skillsMatch}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Experience Match: </span>
                <span className="font-medium">{breakdown.jdMatch.experienceMatch}%</span>
              </div>
            </div>
          </div>
        </CategoryRow>

        {/* Industry Benchmark */}
        <CategoryRow
          title="Industry Benchmark"
          score={scores.industryBenchmark.score}
          weight={scores.industryBenchmark.weight}
          icon={<Building className="h-4 w-4" />}
        >
          <div className="space-y-3">
            {breakdown.industryBenchmark.competitiveRank && (
              <p className="text-xs">
                <span className="text-muted-foreground">Competitive Rank: </span>
                <span className="font-medium">{breakdown.industryBenchmark.competitiveRank}</span>
              </p>
            )}
            
            {breakdown.industryBenchmark.belowStandards?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Below Standards</p>
                <ul className="space-y-1">
                  {breakdown.industryBenchmark.belowStandards.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CategoryRow>

        {/* ATS Compliance */}
        <CategoryRow
          title="ATS Compliance"
          score={scores.atsCompliance.score}
          weight={scores.atsCompliance.weight}
          icon={<FileCheck className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <p className="text-xs">
              <span className="text-muted-foreground">Keyword Placement: </span>
              <span className={cn(
                "font-medium",
                breakdown.atsCompliance.keywordPlacement === 'good' ? 'text-primary' : ''
              )}>
                {breakdown.atsCompliance.keywordPlacement}
              </span>
            </p>
            
            {(breakdown.atsCompliance.headerIssues?.length > 0 || breakdown.atsCompliance.formatIssues?.length > 0) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Issues Found</p>
                <ul className="space-y-1">
                  {[...breakdown.atsCompliance.headerIssues.slice(0, 2), ...breakdown.atsCompliance.formatIssues.slice(0, 2)].map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CategoryRow>

        {/* Human Voice */}
        <CategoryRow
          title="Human Voice"
          score={scores.humanVoice.score}
          weight={scores.humanVoice.weight}
          icon={<User className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <p className="text-xs">
              <span className="text-muted-foreground">AI Detection Risk: </span>
              <span className={cn(
                "font-medium",
                breakdown.humanVoice.aiProbability < 30 ? 'text-primary' : ''
              )}>
                {breakdown.humanVoice.aiProbability}%
              </span>
            </p>
            
            {breakdown.humanVoice.concerns?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Concerns</p>
                <ul className="space-y-1">
                  {breakdown.humanVoice.concerns.slice(0, 2).map((concern, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {breakdown.humanVoice.humanElements?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Human Elements</p>
                <ul className="space-y-1">
                  {breakdown.humanVoice.humanElements.slice(0, 2).map((element, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{element}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CategoryRow>
      </div>
    </motion.div>
  );
}
