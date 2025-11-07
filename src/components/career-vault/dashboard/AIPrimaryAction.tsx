import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Mail
} from 'lucide-react';

export type ActionType = 'fix_blocker' | 'review_items' | 'quick_win' | 'ready';

export interface PrimaryAction {
  type: ActionType;
  message: string;
  description?: string;
  impact?: string;
  action?: string;
  actions?: Array<{ label: string; route: string; variant?: 'default' | 'outline' }>;
  route?: string;
  estimatedTime?: string;
}

interface AIPrimaryActionProps {
  action: PrimaryAction;
  onActionClick: (route: string) => void;
}

/**
 * AI-Powered Primary Action - The ONE thing user should do next
 *
 * Design principles:
 * - Single, clear call-to-action
 * - AI-determined priority (critical → high → medium → ready)
 * - Visual hierarchy (icon, message, impact, CTA)
 * - Context-aware (knows user's journey stage)
 */
export function AIPrimaryAction({ action, onActionClick }: AIPrimaryActionProps) {
  // Icon based on action type
  const getIcon = () => {
    switch (action.type) {
      case 'fix_blocker':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      case 'review_items':
        return <TrendingUp className="h-8 w-8 text-blue-500" />;
      case 'quick_win':
        return <Lightbulb className="h-8 w-8 text-amber-500" />;
      case 'ready':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      default:
        return <Lightbulb className="h-8 w-8 text-primary" />;
    }
  };

  // Card styling based on action type
  const getCardStyle = () => {
    switch (action.type) {
      case 'fix_blocker':
        return 'border-red-200 bg-red-50/50';
      case 'review_items':
        return 'border-blue-200 bg-blue-50/50';
      case 'quick_win':
        return 'border-amber-200 bg-amber-50/50';
      case 'ready':
        return 'border-green-200 bg-green-50/50';
      default:
        return 'border-primary/20 bg-primary/5';
    }
  };

  // Button variant based on action type
  const getButtonVariant = (): 'default' | 'destructive' | 'outline' => {
    switch (action.type) {
      case 'fix_blocker':
        return 'destructive';
      case 'ready':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`border-2 shadow-md mb-6 ${getCardStyle()}`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 p-3 rounded-full bg-white border-2">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-semibold mb-1">
              {action.message}
            </h3>

            {action.description && (
              <p className="text-sm md:text-base text-muted-foreground mb-2">
                {action.description}
              </p>
            )}

            {action.impact && (
              <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
                <TrendingUp className="h-4 w-4" />
                <span>Impact: {action.impact}</span>
              </div>
            )}

            {action.estimatedTime && (
              <p className="text-xs text-muted-foreground mb-3">
                ⏱️ Estimated time: {action.estimatedTime}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-2">
            {action.actions ? (
              // Multiple actions (for "ready" state)
              action.actions.map((a, idx) => (
                <Button
                  key={idx}
                  size="lg"
                  variant={a.variant || 'default'}
                  onClick={() => onActionClick(a.route)}
                  className="min-w-[140px]"
                >
                  {a.label === 'Create Resume' && <FileText className="mr-2 h-4 w-4" />}
                  {a.label === 'Create Cover Letter' && <Mail className="mr-2 h-4 w-4" />}
                  {a.label}
                </Button>
              ))
            ) : (
              // Single action
              <Button
                size="lg"
                variant={getButtonVariant()}
                onClick={() => action.route && onActionClick(action.route)}
                className="min-w-[140px]"
              >
                {action.action} →
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Determines the primary action based on vault state
 *
 * Priority logic:
 * 1. CRITICAL: Blockers present → Fix blocker
 * 2. HIGH: Items need review (>10 unverified) → Review items
 * 3. MEDIUM: Quick wins available → Do quick win
 * 4. LOW: Vault optimized → Ready to use
 */
export function determinePrimaryAction(vaultState: {
  hasBlockers: boolean;
  blockerMessage?: string;
  blockerRoute?: string;
  unverifiedItems: number;
  quickWins: Array<{ title: string; actionLabel: string; route: string; impact?: string }>;
  score: number;
}): PrimaryAction {
  // 1. CRITICAL: Blockers present
  if (vaultState.hasBlockers && vaultState.blockerMessage && vaultState.blockerRoute) {
    return {
      type: 'fix_blocker',
      message: 'Critical Blocker Detected',
      description: vaultState.blockerMessage,
      impact: 'Preventing job applications',
      action: 'Fix This Now',
      route: vaultState.blockerRoute,
      estimatedTime: '10-15 minutes',
    };
  }

  // 2. HIGH: Items need review (>10 unverified)
  if (vaultState.unverifiedItems > 10) {
    const estimatedBoost = Math.min(Math.floor(vaultState.unverifiedItems * 0.5), 15);
    return {
      type: 'review_items',
      message: `Review ${vaultState.unverifiedItems} AI-extracted items`,
      description: 'Quick review and approval can significantly boost your vault strength',
      impact: `Estimated +${estimatedBoost} points to vault score`,
      action: 'Start Review',
      route: '#vault-tabs',
      estimatedTime: `${Math.ceil(vaultState.unverifiedItems / 5)} minutes`,
    };
  }

  // 3. MEDIUM: Quick wins available
  if (vaultState.quickWins.length > 0) {
    const topWin = vaultState.quickWins[0];
    return {
      type: 'quick_win',
      message: topWin.title,
      description: 'Low-effort, high-impact improvement opportunity',
      impact: topWin.impact || 'Improves vault quality',
      action: topWin.actionLabel,
      route: topWin.route,
      estimatedTime: '5-10 minutes',
    };
  }

  // 4. LOW: Vault optimized, ready to use
  return {
    type: 'ready',
    message: 'Vault Optimized! 🎉',
    description: 'Your career vault is production-ready and optimized for your target roles',
    impact: undefined,
    actions: [
      { label: 'Create Resume', route: '/documents/resume', variant: 'default' },
      { label: 'Create Cover Letter', route: '/documents/cover-letter', variant: 'outline' },
    ],
  };
}
