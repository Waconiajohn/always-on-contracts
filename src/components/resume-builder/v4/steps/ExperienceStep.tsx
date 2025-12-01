/**
 * ExperienceStep - Step 3
 * 
 * Role-by-role editing without overwhelm.
 * Features:
 * - Roles sorted by relevance to target job
 * - Step-level progress and gap resolution tracking
 * - Smooth navigation between roles
 * - Empty states for no roles or all complete
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { RoleData, BulletSuggestion, JobBlueprint, GapAnalysis } from "../types/builderV2Types";
import { RoleEditorCard } from "../cards/RoleEditorCard";
import { validateExperience } from "../config/resumeBuilderRules";
import { EXPERIENCE_EMPTY_STATES } from "../config/emptyStates";
import { SECTION_LABELS, PROGRESS_LABELS, DISCLAIMERS, BUTTON_LABELS } from "../config/uiCopy";
import { 
  ArrowLeft, 
  ArrowRight, 
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";

interface RoleSuggestions {
  role: RoleData;
  suggestions: BulletSuggestion[];
  acceptedCount: number;
  hasOriginalBullets: boolean;
  relevantCompetencies: string[];
}

interface ExperienceStepProps {
  roles: RoleSuggestions[];
  jobBlueprint: JobBlueprint;
  gaps: GapAnalysis[];
  gapStatus: {
    criticalTotal: number;
    criticalResolved: number;
    importantTotal: number;
    importantResolved: number;
  };
  totalAcceptedBullets: number;
  onBulletAction: (roleId: string, bulletId: string, action: 'accept' | 'reject' | 'edit' | 'useOriginal', editedText?: string) => void;
  onApproveAllHighConfidence: (roleId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ExperienceStep = ({
  roles,
  gapStatus,
  totalAcceptedBullets,
  onBulletAction,
  onApproveAllHighConfidence,
  onNext,
  onBack,
}: ExperienceStepProps) => {
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [showValidationWarning, setShowValidationWarning] = useState(false);

  // Get current role
  const currentRole = roles[currentRoleIndex];
  const isLastRole = currentRoleIndex === roles.length - 1;
  const isFirstRole = currentRoleIndex === 0;

  // Overall progress
  const totalPending = roles.reduce((sum, r) => 
    sum + r.suggestions.filter(s => s.status === 'pending').length, 0
  );
  const totalSuggestions = roles.reduce((sum, r) => sum + r.suggestions.length, 0);
  const totalReviewed = totalSuggestions - totalPending;
  const overallProgress = totalSuggestions > 0 ? (totalReviewed / totalSuggestions) * 100 : 0;

  // Count roles with bullets
  const rolesWithBullets = roles.filter(r => r.acceptedCount > 0).length;

  // Validation
  const validation = validateExperience(
    totalAcceptedBullets,
    rolesWithBullets,
    gapStatus.criticalTotal - gapStatus.criticalResolved
  );

  // Navigation handlers
  const handleNextRole = () => {
    if (isLastRole) {
      if (validation.type === 'block') {
        setShowValidationWarning(true);
        return;
      }
      if (validation.type === 'warning') {
        setShowValidationWarning(true);
        return;
      }
      onNext();
    } else {
      setCurrentRoleIndex(prev => prev + 1);
    }
  };

  const handlePrevRole = () => {
    if (isFirstRole) {
      onBack();
    } else {
      setCurrentRoleIndex(prev => prev - 1);
    }
  };

  const handleContinueAnyway = () => {
    setShowValidationWarning(false);
    onNext();
  };

  // No roles at all
  if (roles.length === 0) {
    const emptyState = EXPERIENCE_EMPTY_STATES.noRoles;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Badge variant="outline">Step 3 of 5</Badge>
            <span>{SECTION_LABELS.experience.title}</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{SECTION_LABELS.experience.title}</h1>
        </div>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{emptyState.title}</h3>
            <p className="text-muted-foreground mb-4">{emptyState.message}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={onBack}>
                {BUTTON_LABELS.back}
              </Button>
              <Button onClick={onNext}>
                Skip to Skills
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All roles reviewed - complete state
  const allRolesComplete = roles.every(r => 
    r.suggestions.filter(s => s.status === 'pending').length === 0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Badge variant="outline">Step 3 of 5</Badge>
          <span>{SECTION_LABELS.experience.title}</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{SECTION_LABELS.experience.title}</h1>
        <p className="text-muted-foreground">
          {SECTION_LABELS.experience.description}
        </p>
      </div>

      {/* Step-level progress bar */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Role {currentRoleIndex + 1} of {roles.length}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">
                {totalAcceptedBullets} bullets accepted
              </span>
            </div>
            <div className="text-sm">
              <span className={cn(
                "font-medium",
                gapStatus.criticalResolved === gapStatus.criticalTotal 
                  ? "text-green-600" 
                  : "text-amber-600"
              )}>
                {PROGRESS_LABELS.gapsResolved(gapStatus.criticalResolved, gapStatus.criticalTotal)}
              </span>
              <span className="text-muted-foreground ml-1">critical</span>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {totalReviewed} of {totalSuggestions} suggestions reviewed
          </p>
        </CardContent>
      </Card>

      {/* Section disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {DISCLAIMERS.sectionLevel}
        </AlertDescription>
      </Alert>

      {/* Role navigation tabs (if multiple roles) */}
      {roles.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {roles.map((roleSuggestion, idx) => {
            const isComplete = roleSuggestion.suggestions.filter(s => s.status === 'pending').length === 0;
            const hasAccepted = roleSuggestion.acceptedCount > 0;
            return (
              <Button
                key={roleSuggestion.role.id}
                variant={idx === currentRoleIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentRoleIndex(idx)}
                className={cn(
                  "gap-1.5",
                  isComplete && idx !== currentRoleIndex && "border-green-300 bg-green-50"
                )}
              >
                {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                <span className="truncate max-w-[150px]">{roleSuggestion.role.company}</span>
                {hasAccepted && !isComplete && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {roleSuggestion.acceptedCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {/* Current role editor */}
      {currentRole && (
        <RoleEditorCard
          role={currentRole.role}
          suggestions={currentRole.suggestions}
          acceptedCount={currentRole.acceptedCount}
          relevantCompetencies={currentRole.relevantCompetencies}
          hasOriginalBullets={currentRole.hasOriginalBullets}
          onBulletAction={(bulletId, action, text) => 
            onBulletAction(currentRole.role.id, bulletId, action, text)
          }
          onApproveAllHighConfidence={() => onApproveAllHighConfidence(currentRole.role.id)}
          onSkipRole={!isLastRole ? handleNextRole : undefined}
        />
      )}

      {/* Validation warning modal */}
      {showValidationWarning && validation.message && (
        <Card className={cn(
          "border-2",
          validation.type === 'block' ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
        )}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className={cn(
                "h-5 w-5 flex-shrink-0 mt-0.5",
                validation.type === 'block' ? "text-red-500" : "text-amber-500"
              )} />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{validation.message.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {validation.message.message}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowValidationWarning(false)}
                  >
                    Add More Content
                  </Button>
                  {validation.canProceed && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleContinueAnyway}
                    >
                      {validation.message.actionLabel || BUTTON_LABELS.continueAnyway}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All complete celebration */}
      {allRolesComplete && totalAcceptedBullets > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-700 mb-1">
              {EXPERIENCE_EMPTY_STATES.allRolesComplete.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-1">
              You've selected {totalAcceptedBullets} bullets across {rolesWithBullets} role{rolesWithBullets !== 1 ? 's' : ''}.
            </p>
            <p className="text-sm text-green-600">
              {gapStatus.criticalResolved}/{gapStatus.criticalTotal} critical gaps resolved
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={handlePrevRole} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {isFirstRole ? "Back to Highlights" : `Previous: ${roles[currentRoleIndex - 1]?.role.company}`}
        </Button>
        <Button 
          onClick={handleNextRole} 
          className="gap-2"
        >
          {isLastRole ? "Continue to Skills" : `Next: ${roles[currentRoleIndex + 1]?.role.company}`}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick summary */}
      <div className="text-center text-sm text-muted-foreground">
        {totalAcceptedBullets > 0 ? (
          <span>
            {totalAcceptedBullets} bullet{totalAcceptedBullets !== 1 ? 's' : ''} selected • 
            {' '}{rolesWithBullets} role{rolesWithBullets !== 1 ? 's' : ''} have content
          </span>
        ) : (
          <span>Select bullets to include in your résumé</span>
        )}
      </div>
    </div>
  );
};
