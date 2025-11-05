import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export interface CareerBlocker {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  category: string;
  title: string;
  description: string;
  targetRoles: string[];
  impact?: string;
  requiredItems?: number;
  currentItems?: number;
  actionLabel: string;
  actionRoute: string;
}

interface BlockerAlertProps {
  blocker: CareerBlocker;
  onAction: () => void;
  onDismiss?: () => void;
}

export function BlockerAlert({ blocker, onAction, onDismiss }: BlockerAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const getSeverityStyles = () => {
    switch (blocker.severity) {
      case 'critical':
        return 'border-red-600 bg-red-50 [&>svg]:text-red-600';
      case 'high':
        return 'border-amber-600 bg-amber-50 [&>svg]:text-amber-600';
      case 'medium':
        return 'border-yellow-600 bg-yellow-50 [&>svg]:text-yellow-600';
      default:
        return 'border-red-600 bg-red-50 [&>svg]:text-red-600';
    }
  };

  return (
    <Alert className={`mb-6 border-2 shadow-lg ${getSeverityStyles()}`}>
      <div className="flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 mt-1 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <AlertTitle className="text-lg font-bold mb-2">
                {blocker.severity === 'critical' && '🚨 '}
                {blocker.title}
              </AlertTitle>
              <AlertDescription className="text-base mb-3">
                {blocker.description}

                {blocker.requiredItems !== undefined && blocker.currentItems !== undefined && (
                  <div className="mt-2 text-sm font-medium">
                    Progress: {blocker.currentItems}/{blocker.requiredItems} required items
                  </div>
                )}

                {blocker.impact && (
                  <div className="mt-2 text-sm font-medium">
                    📊 Impact: {blocker.impact}
                  </div>
                )}

                {blocker.targetRoles.length > 0 && (
                  <div className="mt-2 text-sm">
                    Affects: <span className="font-medium">{blocker.targetRoles.join(', ')}</span>
                  </div>
                )}
              </AlertDescription>

              <div className="flex gap-3 mt-3">
                <Button
                  size="lg"
                  className={
                    blocker.severity === 'critical'
                      ? 'bg-red-600 hover:bg-red-700 text-white font-semibold'
                      : 'bg-amber-600 hover:bg-amber-700 text-white font-semibold'
                  }
                  onClick={onAction}
                >
                  {blocker.actionLabel}
                </Button>

                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600"
                    onClick={handleDismiss}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>

            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 w-8 p-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}

/**
 * Detects career blockers based on vault data and target roles
 * This is a frontend-only version - Phase 2 will move this to an edge function
 */
export function detectCareerBlockers(
  vaultData: {
    strengthScore: number;
    leadershipItems: number;
    budgetOwnership: boolean;
    targetRoles: string[];
  }
): CareerBlocker[] {
  const blockers: CareerBlocker[] = [];

  // Detect VP-level roles requiring management experience
  const vpRoles = vaultData.targetRoles.filter(
    (role) => role.toLowerCase().includes('vp') || role.toLowerCase().includes('vice president')
  );

  if (vpRoles.length > 0 && vaultData.leadershipItems < 5) {
    blockers.push({
      id: 'missing-management-vp',
      severity: 'critical',
      category: 'management_experience',
      title: 'Missing Management Experience for VP Roles',
      description: `You're targeting VP-level roles but only have ${vaultData.leadershipItems} of 5 required management items documented.`,
      targetRoles: vpRoles,
      impact: 'Blocks VP-level opportunities',
      requiredItems: 5,
      currentItems: vaultData.leadershipItems,
      actionLabel: 'Add Management Experience',
      actionRoute: '/career-vault-onboarding',
    });
  }

  // Detect C-suite roles requiring budget ownership
  const cSuiteRoles = vaultData.targetRoles.filter((role) =>
    /\b(ceo|cfo|cto|coo|cmo|ciso|chief)\b/i.test(role)
  );

  if (cSuiteRoles.length > 0 && !vaultData.budgetOwnership) {
    blockers.push({
      id: 'missing-budget-csuite',
      severity: 'critical',
      category: 'budget_ownership',
      title: 'Missing Budget/P&L Experience for C-Suite Roles',
      description: `You're targeting C-suite roles but haven't documented budget ownership or P&L responsibility.`,
      targetRoles: cSuiteRoles,
      impact: 'Blocks executive-level opportunities',
      actionLabel: 'Add Budget Experience',
      actionRoute: '/career-vault-onboarding',
    });
  }

  // Detect low vault score for target roles
  const directorPlusRoles = vaultData.targetRoles.filter((role) =>
    /\b(director|vp|vice president|chief|ceo|cfo|cto)\b/i.test(role)
  );

  if (directorPlusRoles.length > 0 && vaultData.strengthScore < 80) {
    blockers.push({
      id: 'low-score-senior-roles',
      severity: 'high',
      category: 'vault_strength',
      title: 'Vault Score Below Target for Senior Roles',
      description: `Your vault score is ${vaultData.strengthScore}/100. Senior leadership roles typically require 80+ to be competitive.`,
      targetRoles: directorPlusRoles,
      impact: `Need ${80 - vaultData.strengthScore} more points`,
      actionLabel: 'Improve Vault Score',
      actionRoute: '/career-vault-dashboard',
    });
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2 };
  return blockers.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
