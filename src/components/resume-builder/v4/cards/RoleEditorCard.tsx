/**
 * RoleEditorCard - Container for one role's bullets in Experience section
 * 
 * Features:
 * - Header with company/title/dates and relevance chips
 * - Shows top 4-6 bullets initially, sorted by severity + confidence
 * - Collapsible "Show more" for lower-priority bullets
 * - Role-level progress tracking
 * - Empty states for sparse data or no original bullets
 */

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { BulletSuggestion, RoleData, ConfidenceLevel } from "../types/builderV2Types";
import { BulletComparisonCard } from "./BulletComparisonCard";
import { BUILDER_RULES } from "../config/resumeBuilderRules";
import { EXPERIENCE_EMPTY_STATES } from "../config/emptyStates";
import { BUTTON_LABELS, DISCLAIMERS } from "../config/uiCopy";
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  Calendar,
  Zap,
  Info
} from "lucide-react";

interface RoleEditorCardProps {
  role: RoleData;
  suggestions: BulletSuggestion[];
  acceptedCount: number;
  relevantCompetencies: string[];
  hasOriginalBullets: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onBulletAction: (bulletId: string, action: 'accept' | 'reject' | 'edit' | 'useOriginal', editedText?: string) => void;
  onApproveAllHighConfidence: () => void;
  onSkipRole?: () => void;
}

export const RoleEditorCard = ({
  role,
  suggestions,
  acceptedCount,
  relevantCompetencies,
  hasOriginalBullets,
  isExpanded = true,
  onToggleExpand,
  onBulletAction,
  onApproveAllHighConfidence,
  onSkipRole,
}: RoleEditorCardProps) => {
  const [showMoreBullets, setShowMoreBullets] = useState(false);
  const [acknowledgedNoOriginal, setAcknowledgedNoOriginal] = useState(false);

  // Configuration
  const showInitially = BUILDER_RULES.experiencePerRole.showInitially;
  const { min: minRec, max: maxRec } = BUILDER_RULES.experiencePerRole.recommendedBullets;
  const fewThreshold = BUILDER_RULES.experiencePerRole.fewSuggestionsThreshold;

  // Sort suggestions: pending first, then by severity + confidence
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    // Pending first
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    
    // Then by severity (critical > important > nice-to-have)
    const severityOrder = { critical: 0, important: 1, 'nice-to-have': 2 };
    // For now, use confidence as proxy for severity
    const confOrder = { high: 0, medium: 1, low: 2 };
    return confOrder[a.confidence] - confOrder[b.confidence];
  });

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted' || s.status === 'edited');
  const highConfidencePending = pendingSuggestions.filter(s => s.confidence === 'high');

  // Split into initial and extra
  const initialBullets = sortedSuggestions.slice(0, showInitially);
  const extraBullets = sortedSuggestions.slice(showInitially);

  // Progress calculation
  const progressPercent = Math.min(100, (acceptedCount / minRec) * 100);
  const isComplete = acceptedCount >= minRec;
  const isOptimal = acceptedCount >= minRec && acceptedCount <= maxRec;

  // Empty state conditions
  const isFewSuggestions = suggestions.length <= fewThreshold && suggestions.length > 0;
  const isNoSuggestions = suggestions.length === 0;

  // Format dates
  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  const dateRange = `${formatDate(role.startDate)} – ${role.isCurrent ? 'Present' : formatDate(role.endDate)}`;

  // No original bullets warning
  if (!hasOriginalBullets && !acknowledgedNoOriginal && !isNoSuggestions) {
    const emptyState = EXPERIENCE_EMPTY_STATES.noOriginalBullets;
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{role.title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building className="h-3.5 w-3.5" />
                {role.company}
                <span className="text-gray-300">|</span>
                <Calendar className="h-3.5 w-3.5" />
                {dateRange}
              </p>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
              {emptyState.badge}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong className="block mb-1">{emptyState.title}</strong>
              {emptyState.message}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end">
            <Button 
              variant="secondary"
              onClick={() => setAcknowledgedNoOriginal(true)}
            >
              {emptyState.action?.label || "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Few suggestions empty state
  if (isFewSuggestions) {
    const emptyState = EXPERIENCE_EMPTY_STATES.fewSuggestions;
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{role.title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building className="h-3.5 w-3.5" />
                {role.company}
                <span className="text-gray-300">|</span>
                <Calendar className="h-3.5 w-3.5" />
                {dateRange}
              </p>
            </div>
            <Badge variant="outline" className="text-gray-500">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong className="block mb-1">{emptyState.title}</strong>
              {emptyState.message}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2 justify-end">
            {onSkipRole && (
              <Button variant="ghost" onClick={onSkipRole}>
                {emptyState.secondaryAction?.label || "Skip This Role"}
              </Button>
            )}
            <Button onClick={() => setShowMoreBullets(true)}>
              {emptyState.action?.label || "Review Suggestions"}
            </Button>
          </div>
          
          {/* Still show the bullets if user clicks "Review" */}
          {showMoreBullets && (
            <div className="mt-4 space-y-3">
              {sortedSuggestions.map((bullet, idx) => (
                <BulletComparisonCard
                  key={bullet.id}
                  suggestion={bullet}
                  bulletNumber={idx + 1}
                  onUseAI={() => onBulletAction(bullet.id, 'accept')}
                  onKeepOriginal={() => onBulletAction(bullet.id, 'useOriginal')}
                  onEdit={(text) => onBulletAction(bullet.id, 'edit', text)}
                  onRemove={() => onBulletAction(bullet.id, 'reject')}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // No suggestions at all
  if (isNoSuggestions) {
    return (
      <Card className="border-gray-200 bg-gray-50/50">
        <CardHeader className="pb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-500">{role.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Building className="h-3.5 w-3.5" />
              {role.company}
              <span className="text-gray-300">|</span>
              <Calendar className="h-3.5 w-3.5" />
              {dateRange}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            No suggestions available for this role. Consider adding more details to your Career Vault.
          </p>
          {onSkipRole && (
            <div className="flex justify-center">
              <Button variant="ghost" onClick={onSkipRole}>
                Skip to Next Role
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Main render: role with bullets
  return (
    <Card className={cn(
      "transition-all",
      isComplete && "border-green-200 bg-green-50/30"
    )}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{role.title}</h3>
              {isComplete && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
              <Building className="h-3.5 w-3.5" />
              {role.company}
              <span className="text-gray-300">|</span>
              <Calendar className="h-3.5 w-3.5" />
              {dateRange}
            </p>
            
            {/* Relevance chips */}
            {relevantCompetencies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs text-muted-foreground">Relevant for:</span>
                {relevantCompetencies.slice(0, 4).map((comp, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {comp}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="text-right">
            <p className={cn(
              "text-lg font-semibold",
              isOptimal ? "text-green-600" : isComplete ? "text-green-600" : "text-amber-600"
            )}>
              {acceptedCount}/{minRec}-{maxRec}
            </p>
            <p className="text-xs text-muted-foreground">bullets</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <Progress 
            value={progressPercent} 
            className={cn(
              "h-1.5",
              isComplete ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500"
            )}
          />
        </div>

        {/* Quick approve high confidence */}
        {highConfidencePending.length >= 2 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onApproveAllHighConfidence}
            className="mt-3 gap-2 w-full sm:w-auto"
          >
            <Zap className="h-4 w-4" />
            {BUTTON_LABELS.approveHighConfidence} ({highConfidencePending.length})
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Accepted bullets summary */}
        {acceptedSuggestions.length > 0 && pendingSuggestions.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm font-medium text-green-700 mb-2">
              {acceptedSuggestions.length} bullet{acceptedSuggestions.length !== 1 ? 's' : ''} accepted
            </p>
            <ul className="space-y-1">
              {acceptedSuggestions.slice(0, 3).map((b, i) => (
                <li key={b.id} className="text-xs text-green-700 flex items-start gap-1">
                  <span>✓</span>
                  <span className="line-clamp-1">{b.editedText || b.suggestedText}</span>
                </li>
              ))}
              {acceptedSuggestions.length > 3 && (
                <li className="text-xs text-green-600">
                  +{acceptedSuggestions.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Pending bullets - show initially */}
        {initialBullets.filter(b => b.status === 'pending').length > 0 && (
          <div className="space-y-3">
            {initialBullets
              .filter(b => b.status === 'pending')
              .map((bullet, idx) => (
                <BulletComparisonCard
                  key={bullet.id}
                  suggestion={bullet}
                  bulletNumber={idx + 1}
                  onUseAI={() => onBulletAction(bullet.id, 'accept')}
                  onKeepOriginal={() => onBulletAction(bullet.id, 'useOriginal')}
                  onEdit={(text) => onBulletAction(bullet.id, 'edit', text)}
                  onRemove={() => onBulletAction(bullet.id, 'reject')}
                />
              ))}
          </div>
        )}

        {/* Extra bullets - collapsible */}
        {extraBullets.filter(b => b.status === 'pending').length > 0 && (
          <Collapsible open={showMoreBullets} onOpenChange={setShowMoreBullets}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between gap-2">
                <span>
                  {showMoreBullets ? BUTTON_LABELS.showLess : `${BUTTON_LABELS.showMore} (${extraBullets.filter(b => b.status === 'pending').length})`}
                </span>
                {showMoreBullets ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {extraBullets
                .filter(b => b.status === 'pending')
                .map((bullet, idx) => (
                  <BulletComparisonCard
                    key={bullet.id}
                    suggestion={bullet}
                    bulletNumber={showInitially + idx + 1}
                    onUseAI={() => onBulletAction(bullet.id, 'accept')}
                    onKeepOriginal={() => onBulletAction(bullet.id, 'useOriginal')}
                    onEdit={(text) => onBulletAction(bullet.id, 'edit', text)}
                    onRemove={() => onBulletAction(bullet.id, 'reject')}
                  />
                ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* All done for this role */}
        {pendingSuggestions.length === 0 && acceptedSuggestions.length > 0 && (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">
              All suggestions reviewed for this role
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {acceptedSuggestions.length} bullet{acceptedSuggestions.length !== 1 ? 's' : ''} will appear in your résumé
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
