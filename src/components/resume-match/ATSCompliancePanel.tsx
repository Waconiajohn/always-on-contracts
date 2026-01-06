import { AlertTriangle, CheckCircle, Info, XCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ClientATSIssue } from './types';
import { checkATSCompliance, calculateATSScore } from '@/lib/clientATSChecker';
import { useMemo } from 'react';

interface ATSCompliancePanelProps {
  resumeText: string;
  apiIssues?: {
    headerIssues: string[];
    formatIssues: string[];
    keywordPlacement: string;
  };
  apiScore?: number;
}

export function ATSCompliancePanel({ 
  resumeText, 
  apiIssues,
  apiScore 
}: ATSCompliancePanelProps) {
  // Run client-side checks
  const clientIssues = useMemo(() => checkATSCompliance(resumeText), [resumeText]);
  const clientScore = useMemo(() => calculateATSScore(clientIssues), [clientIssues]);

  // Use API score if available, otherwise use client score
  const displayScore = apiScore ?? clientScore;

  // Combine issues from both sources
  const allIssues: ClientATSIssue[] = useMemo(() => {
    const combined = [...clientIssues];
    
    // Add API issues if available
    if (apiIssues) {
      apiIssues.headerIssues?.forEach(issue => {
        if (!combined.some(c => c.issue.toLowerCase().includes(issue.toLowerCase()))) {
          combined.push({
            type: 'warning',
            category: 'structure',
            issue: issue,
            fix: 'Review and fix header formatting'
          });
        }
      });
      
      apiIssues.formatIssues?.forEach(issue => {
        if (!combined.some(c => c.issue.toLowerCase().includes(issue.toLowerCase()))) {
          combined.push({
            type: 'warning',
            category: 'format',
            issue: issue,
            fix: 'Adjust formatting for better ATS compatibility'
          });
        }
      });
    }
    
    return combined;
  }, [clientIssues, apiIssues]);

  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');
  const infos = allIssues.filter(i => i.type === 'info');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getIcon = (type: ClientATSIssue['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
  };

  if (!resumeText || resumeText.length < 50) {
    return (
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            ATS Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            Add resume text to check ATS compatibility
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            ATS Compliance
          </span>
          <Badge 
            variant={displayScore >= 80 ? 'default' : displayScore >= 60 ? 'secondary' : 'destructive'}
          >
            {displayScore}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score bar */}
        <div className="space-y-1">
          <Progress 
            value={displayScore} 
            className={cn("h-2", displayScore >= 80 ? "[&>div]:bg-green-500" : displayScore >= 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500")} 
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{allIssues.length === 0 ? 'No issues found' : `${allIssues.length} issue${allIssues.length > 1 ? 's' : ''} found`}</span>
            <span className={getScoreColor(displayScore)}>
              {displayScore >= 80 ? 'ATS Ready' : displayScore >= 60 ? 'Needs Work' : 'At Risk'}
            </span>
          </div>
        </div>

        {/* Issues summary */}
        {allIssues.length > 0 && (
          <div className="space-y-2">
            {/* Summary badges */}
            <div className="flex gap-2 flex-wrap">
              {errors.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errors.length} Error{errors.length > 1 ? 's' : ''}
                </Badge>
              )}
              {warnings.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
                </Badge>
              )}
              {infos.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {infos.length} Tip{infos.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Issue list */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {[...errors, ...warnings, ...infos].slice(0, 6).map((issue, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-2 rounded-md text-xs",
                    issue.type === 'error' && "bg-red-50 dark:bg-red-950/30",
                    issue.type === 'warning' && "bg-amber-50 dark:bg-amber-950/30",
                    issue.type === 'info' && "bg-blue-50 dark:bg-blue-950/30"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {getIcon(issue.type)}
                    <div className="flex-1">
                      <p className="font-medium">{issue.issue}</p>
                      <p className="text-muted-foreground mt-0.5">{issue.fix}</p>
                    </div>
                  </div>
                </div>
              ))}
              {allIssues.length > 6 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{allIssues.length - 6} more issues
                </p>
              )}
            </div>
          </div>
        )}

        {/* All good message */}
        {allIssues.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">ATS Ready!</p>
              <p className="text-xs opacity-80">Your resume format looks compatible with ATS systems</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
