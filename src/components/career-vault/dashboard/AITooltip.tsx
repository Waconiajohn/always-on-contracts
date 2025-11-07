import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Info, Lightbulb, TrendingUp, Target } from 'lucide-react';

interface AITooltipProps {
  children: ReactNode;
  title: string;
  description: string;
  insight?: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'info' | 'insight' | 'recommendation' | 'goal';
}

/**
 * AI-Powered Contextual Tooltip
 *
 * Provides intelligent, context-aware help throughout the dashboard
 *
 * Features:
 * - Personalized to user's vault data
 * - Actionable (includes next steps when relevant)
 * - Educational (explains WHY, not just WHAT)
 * - Non-intrusive (tooltip, not modal)
 *
 * Types:
 * - info: General information
 * - insight: AI-generated insight from user's data
 * - recommendation: Suggested action
 * - goal: Progress toward a goal
 */
export function AITooltip({
  children,
  title,
  description,
  insight,
  actionLabel,
  onAction,
  type = 'info',
}: AITooltipProps) {
  const getIcon = () => {
    switch (type) {
      case 'insight':
        return <Lightbulb className="h-4 w-4 text-amber-500" />;
      case 'recommendation':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'goal':
        return <Target className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs p-4 bg-white dark:bg-gray-900 border-2 shadow-lg"
          sideOffset={8}
        >
          <div className="space-y-2">
            {/* Title with icon */}
            <div className="flex items-start gap-2">
              {getIcon()}
              <p className="font-semibold text-sm">{title}</p>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>

            {/* AI Insight (if provided) */}
            {insight && (
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>AI Insight:</strong> {insight}
                </p>
              </div>
            )}

            {/* Action button (if provided) */}
            {actionLabel && onAction && (
              <Button
                size="sm"
                onClick={onAction}
                className="w-full mt-2 text-xs"
              >
                {actionLabel} →
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Pre-configured AI Tooltips for common use cases
 */

// Vault Score Tooltip
export function VaultScoreTooltip({
  children,
  score,
  targetRole,
  industry,
  pointsToNextTier,
}: {
  children: ReactNode;
  score: number;
  targetRole?: string;
  industry?: string;
  pointsToNextTier?: number;
}) {
  const getTier = (score: number) => {
    if (score >= 90) return { name: 'Elite', description: 'Top 10% of professionals' };
    if (score >= 80) return { name: 'Excellent', description: 'Top 25% of professionals' };
    if (score >= 70) return { name: 'Strong', description: 'Above average' };
    if (score >= 60) return { name: 'Good', description: 'Competitive' };
    return { name: 'Developing', description: 'Room for improvement' };
  };

  const tier = getTier(score);
  const nextTier = score < 90 ? getTier(score + 10) : null;

  return (
    <AITooltip
      type="insight"
      title="Vault Score Explained"
      description={`Your score of ${score} means your vault is ${tier.name} (${tier.description}). This score measures your career intelligence strength across 6 categories: achievements, skills, competencies, leadership, quantification, and modern terminology.`}
      insight={
        nextTier && pointsToNextTier
          ? `You're ${pointsToNextTier} points away from ${nextTier.name} tier. ${targetRole ? `For ${targetRole} roles in ${industry || 'your industry'}, aim for 80+ to be highly competitive.` : ''}`
          : `You're in the ${tier.name} tier! ${targetRole ? `This is excellent for ${targetRole} roles.` : ''}`
      }
      actionLabel={pointsToNextTier ? 'Show me how to improve' : undefined}
      onAction={pointsToNextTier ? () => {
        // Scroll to quick wins or suggestions
        document.getElementById('vault-tabs')?.scrollIntoView({ behavior: 'smooth' });
      } : undefined}
    >
      {children}
    </AITooltip>
  );
}

// Market Rank Tooltip
export function MarketRankTooltip({
  children,
  percentile,
  targetRole,
}: {
  children: ReactNode;
  percentile: number;
  targetRole?: string;
}) {
  const getRankDescription = (p: number) => {
    if (p >= 90) return 'You outrank 90% of professionals targeting similar roles';
    if (p >= 75) return 'You outrank 75% of professionals targeting similar roles';
    if (p >= 50) return 'You outrank 50% of professionals targeting similar roles';
    return 'You have room to improve your market position';
  };

  return (
    <AITooltip
      type="goal"
      title="Market Position"
      description={getRankDescription(percentile)}
      insight={
        targetRole
          ? `For ${targetRole} positions, ${percentile >= 80 ? 'your profile stands out to recruiters and hiring managers' : 'aim for top 25% (80+ score) to stand out to recruiters'}.`
          : undefined
      }
    >
      {children}
    </AITooltip>
  );
}

// Items to Review Tooltip
export function ItemsToReviewTooltip({
  children,
  itemCount,
  estimatedTime,
  scoreImpact,
}: {
  children: ReactNode;
  itemCount: number;
  estimatedTime: string;
  scoreImpact: number;
}) {
  return (
    <AITooltip
      type="recommendation"
      title="AI-Extracted Items Need Review"
      description={`AI extracted ${itemCount} items from your resume that need your verification. This is a quick process where you approve, edit, or skip each item.`}
      insight={`Estimated time: ${estimatedTime}. Potential score boost: +${scoreImpact} points if all items are verified.`}
      actionLabel="Start review now"
      onAction={() => {
        document.getElementById('vault-tabs')?.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      {children}
    </AITooltip>
  );
}

// Career Level Tooltip
export function CareerLevelTooltip({
  children,
  level,
  score,
  leadershipItems,
}: {
  children: ReactNode;
  level: string;
  score: number;
  leadershipItems: number;
}) {
  const getLevelInsight = () => {
    if (level.includes('C-Suite')) {
      return 'Your vault demonstrates C-suite readiness with strong leadership evidence and comprehensive achievement documentation.';
    }
    if (level.includes('Senior Executive')) {
      return 'Your vault shows senior executive capabilities. Continue building P&L ownership and strategic leadership examples.';
    }
    if (level.includes('Director')) {
      return 'Your vault positions you for director-level roles. Add more team management and budget responsibility examples to reach executive tier.';
    }
    return 'Your vault is being optimized. Add quantified achievements and leadership examples to advance to senior levels.';
  };

  return (
    <AITooltip
      type="insight"
      title="Career Level Assessment"
      description={`Based on your vault strength (${score}/100) and ${leadershipItems} leadership items, you're positioned for ${level.toLowerCase()} opportunities.`}
      insight={getLevelInsight()}
    >
      {children}
    </AITooltip>
  );
}
