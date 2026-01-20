import { AlertTriangle, CheckCircle, Info, XCircle, Shield } from 'lucide-react';
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
  const clientIssues = useMemo(() => checkATSCompliance(resumeText), [resumeText]);
  const clientScore = useMemo(() => calculateATSScore(clientIssues), [clientIssues]);
  const displayScore = apiScore ?? clientScore;

  const allIssues: ClientATSIssue[] = useMemo(() => {
    const combined = [...clientIssues];
    
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

  const getIcon = (type: ClientATSIssue['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
      case 'info':
        return <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
    }
  };

  if (!resumeText || resumeText.length < 50) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          ATS Compliance
        </div>
        <p className="text-xs text-muted-foreground">
          Add resume text to check ATS compatibility
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          ATS Compliance
        </div>
        <Badge 
          variant={displayScore >= 80 ? 'default' : displayScore >= 60 ? 'secondary' : 'destructive'}
          className="text-xs font-normal"
        >
          {displayScore}%
        </Badge>
      </div>
      
      {/* Score bar */}
      <div className="space-y-1">
        <Progress value={displayScore} className="h-1.5" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{allIssues.length === 0 ? 'No issues' : `${allIssues.length} issue${allIssues.length > 1 ? 's' : ''}`}</span>
          <span className={cn(
            displayScore >= 80 ? 'text-primary' : ''
          )}>
            {displayScore >= 80 ? 'ATS Ready' : displayScore >= 60 ? 'Needs Work' : 'At Risk'}
          </span>
        </div>
      </div>

      {/* Issues */}
      {allIssues.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {errors.length > 0 && (
              <Badge variant="destructive" className="text-xs font-normal">
                {errors.length} Error{errors.length > 1 ? 's' : ''}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="secondary" className="text-xs font-normal">
                {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
              </Badge>
            )}
            {infos.length > 0 && (
              <Badge variant="outline" className="text-xs font-normal">
                {infos.length} Tip{infos.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
            {[...errors, ...warnings, ...infos].slice(0, 5).map((issue, i) => (
              <div 
                key={i}
                className="flex items-start gap-2 text-xs py-1.5 px-2 rounded bg-muted/50"
              >
                {getIcon(issue.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{issue.issue}</p>
                  <p className="text-muted-foreground truncate">{issue.fix}</p>
                </div>
              </div>
            ))}
            {allIssues.length > 5 && (
              <p className="text-xs text-center text-muted-foreground">
                +{allIssues.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* All good */}
      {allIssues.length === 0 && (
        <div className="flex items-center gap-2 py-2 text-xs">
          <CheckCircle className="h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">ATS Ready</p>
            <p className="text-muted-foreground">Your resume format looks compatible</p>
          </div>
        </div>
      )}
    </div>
  );
}
