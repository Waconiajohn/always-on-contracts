import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  type ResumeStrengthResult, 
  getStrengthLabel, 
  formatStrengthScore 
} from '@/lib/resume-strength-analyzer';
import { cn } from '@/lib/utils';

interface ResumeStrengthIndicatorProps {
  strength: ResumeStrengthResult;
  onImprove?: () => void;
  compact?: boolean;
}

export function ResumeStrengthIndicator({
  strength,
  onImprove,
  compact = false,
}: ResumeStrengthIndicatorProps) {
  const { label, variant } = getStrengthLabel(strength.overallScore);

  const variantColors = {
    destructive: 'text-destructive',
    warning: 'text-amber-500',
    default: 'text-primary',
    secondary: 'text-primary',
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className={cn('text-sm font-medium', variantColors[variant])}>
                {formatStrengthScore(strength.overallScore)}
              </div>
              <Badge variant={variant}>
                {label}
              </Badge>
              {!strength.isStrongEnough && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-sm font-medium mb-1">Resume Strength: {label}</p>
            <p className="text-xs text-muted-foreground">
              {strength.isStrongEnough 
                ? 'Your resume has enough data for strong personalization.'
                : 'Add more achievements and metrics for better results.'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn(
      'border-2',
      !strength.isStrongEnough && 'border-amber-500/50 bg-amber-50/5'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {strength.isStrongEnough ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            <CardTitle className="text-base font-medium">
              Resume Strength
            </CardTitle>
          </div>
          <Badge variant={variant}>
            {label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Score</span>
            <span className={cn('font-semibold', variantColors[variant])}>
              {formatStrengthScore(strength.overallScore)}
            </span>
          </div>
          <Progress 
            value={strength.overallScore} 
            className="h-2" 
          />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {Object.entries(strength.breakdown).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-[200px]">
                      {getBreakdownDescription(key)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={value} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* Warning Message */}
        {!strength.isStrongEnough && (
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Limited Master Resume Data
                </p>
                <p className="text-xs text-muted-foreground">
                  Your personalized version may be generic. Consider adding more achievements with metrics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {strength.recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Quick Improvements
            </p>
            <ul className="space-y-1">
              {strength.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improve Button */}
        {onImprove && !strength.isStrongEnough && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onImprove}
          >
            Add More Achievements
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function getBreakdownDescription(key: string): string {
  const descriptions: Record<string, string> = {
    achievementDensity: 'Percentage of evidence containing quantified metrics',
    categoryDiversity: 'Coverage across different claim categories',
    confidenceQuality: 'Percentage of high-confidence claims',
    evidenceDepth: 'Total number of evidence points available',
  };
  return descriptions[key] || 'Score for this category';
}
