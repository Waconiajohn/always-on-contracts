/**
 * SkillsStep - Step 4
 * 
 * Chip-based skill alignment for ATS optimization.
 * Features:
 * - Two-column layout: Existing skills vs Recommended
 * - Add/Skip actions for suggested skills
 * - ATS keyword priority badges
 * - Empty states for all skills covered
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { SKILLS_EMPTY_STATES } from "../config/emptyStates";
import { SECTION_LABELS, BUTTON_LABELS, TOOLTIPS } from "../config/uiCopy";
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus,
  X,
  CheckCircle2,
  Sparkles,
  Info,
  Search
} from "lucide-react";

interface SuggestedSkill {
  skill: string;
  reason: string;
  source: 'must_have' | 'competency' | 'ats_critical' | 'ats_important' | 'nice_to_have';
  status: 'pending' | 'accepted' | 'rejected';
}

interface SkillsStepProps {
  existingSkills: string[];
  suggestedSkills: SuggestedSkill[];
  onAcceptSkill: (skill: string) => void;
  onRejectSkill: (skill: string) => void;
  onAddCustomSkill: (skill: string) => void;
  onRemoveExistingSkill: (skill: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SkillsStep = ({
  existingSkills,
  suggestedSkills,
  onAcceptSkill,
  onRejectSkill,
  onAddCustomSkill,
  onRemoveExistingSkill,
  onNext,
  onBack,
}: SkillsStepProps) => {
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [filterText, setFilterText] = useState("");

  // Categorize suggested skills
  const pendingSkills = suggestedSkills.filter(s => s.status === 'pending');
  const acceptedSkills = suggestedSkills.filter(s => s.status === 'accepted');
  const rejectedSkills = suggestedSkills.filter(s => s.status === 'rejected');

  // Filter pending skills by search
  const filteredPendingSkills = filterText
    ? pendingSkills.filter(s => 
        s.skill.toLowerCase().includes(filterText.toLowerCase()) ||
        s.reason.toLowerCase().includes(filterText.toLowerCase())
      )
    : pendingSkills;

  // Group by source priority
  const criticalSkills = filteredPendingSkills.filter(s => 
    s.source === 'must_have' || s.source === 'ats_critical'
  );
  const importantSkills = filteredPendingSkills.filter(s => 
    s.source === 'competency' || s.source === 'ats_important'
  );
  const niceToHaveSkills = filteredPendingSkills.filter(s => 
    s.source === 'nice_to_have'
  );

  // Combined final skills list
  const finalSkillsList = [
    ...existingSkills,
    ...acceptedSkills.map(s => s.skill),
  ];

  // Handle custom skill add
  const handleAddCustom = () => {
    if (customSkillInput.trim()) {
      onAddCustomSkill(customSkillInput.trim());
      setCustomSkillInput("");
      setShowCustomInput(false);
    }
  };

  // Source badge styling
  const getSourceBadge = (source: SuggestedSkill['source']) => {
    switch (source) {
      case 'must_have':
        return <Badge variant="destructive" className="text-xs">Must Have</Badge>;
      case 'ats_critical':
        return <Badge className="bg-red-100 text-red-700 text-xs">ATS Critical</Badge>;
      case 'competency':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Core Competency</Badge>;
      case 'ats_important':
        return <Badge className="bg-amber-100 text-amber-700 text-xs">ATS Important</Badge>;
      case 'nice_to_have':
        return <Badge variant="secondary" className="text-xs">Nice to Have</Badge>;
      default:
        return null;
    }
  };

  // Check empty states
  const noSuggestions = suggestedSkills.length === 0;
  const allCovered = pendingSkills.length === 0 && existingSkills.length > 0;

  // All covered empty state
  if (allCovered && acceptedSkills.length === 0) {
    const emptyState = SKILLS_EMPTY_STATES.allCovered;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Badge variant="outline">Step 4 of 5</Badge>
            <span>{SECTION_LABELS.skills.title}</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{SECTION_LABELS.skills.title}</h1>
        </div>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">{emptyState.title}</h3>
            <p className="text-muted-foreground mb-4">{emptyState.message}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" onClick={() => setShowCustomInput(true)}>
                {emptyState.secondaryAction?.label || "Browse All Skills"}
              </Button>
              <Button onClick={onNext}>
                {emptyState.action?.label || "Continue to Review"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Still allow adding custom skills */}
        {showCustomInput && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Custom Skill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="Enter a skill..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                />
                <Button onClick={handleAddCustom}>{BUTTON_LABELS.addSkill}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Experience
          </Button>
          <Button onClick={onNext} className="gap-2">
            Continue to Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Badge variant="outline">Step 4 of 5</Badge>
          <span>{SECTION_LABELS.skills.title}</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{SECTION_LABELS.skills.title}</h1>
        <p className="text-muted-foreground">
          {SECTION_LABELS.skills.description}
        </p>
      </div>

      {/* Info alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          {TOOLTIPS.atsKeywords} Adding recommended skills improves your chances of passing ATS screening.
        </AlertDescription>
      </Alert>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Existing Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Your Current Skills ({finalSkillsList.length})
            </CardTitle>
            <CardDescription>
              Skills that will appear on your résumé
            </CardDescription>
          </CardHeader>
          <CardContent>
            {finalSkillsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {finalSkillsList.map((skill, idx) => (
                  <Badge
                    key={`${skill}-${idx}`}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {skill}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100 rounded-full"
                      onClick={() => onRemoveExistingSkill(skill)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No skills yet. Add from suggestions or create custom.
              </p>
            )}

            {/* Add custom skill */}
            <div className="mt-4 pt-4 border-t">
              {showCustomInput ? (
                <div className="flex gap-2">
                  <Input
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    placeholder="Enter a skill..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleAddCustom}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCustomInput(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setShowCustomInput(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Skill
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Suggested Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Recommended for This Job ({pendingSkills.length})
            </CardTitle>
            <CardDescription>
              Click to add to your skills section
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search filter */}
            {pendingSkills.length > 5 && (
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter skills..."
                  className="pl-8 text-sm"
                />
              </div>
            )}

            {pendingSkills.length > 0 ? (
              <div className="space-y-4">
                {/* Critical skills */}
                {criticalSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase mb-2">
                      Critical for ATS
                    </p>
                    <div className="space-y-2">
                      {criticalSkills.map(skill => (
                        <SkillSuggestionRow
                          key={skill.skill}
                          skill={skill}
                          sourceBadge={getSourceBadge(skill.source)}
                          onAccept={() => onAcceptSkill(skill.skill)}
                          onReject={() => onRejectSkill(skill.skill)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Important skills */}
                {importantSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                      Important
                    </p>
                    <div className="space-y-2">
                      {importantSkills.map(skill => (
                        <SkillSuggestionRow
                          key={skill.skill}
                          skill={skill}
                          sourceBadge={getSourceBadge(skill.source)}
                          onAccept={() => onAcceptSkill(skill.skill)}
                          onReject={() => onRejectSkill(skill.skill)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Nice to have */}
                {niceToHaveSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Nice to Have
                    </p>
                    <div className="space-y-2">
                      {niceToHaveSkills.map(skill => (
                        <SkillSuggestionRow
                          key={skill.skill}
                          skill={skill}
                          sourceBadge={getSourceBadge(skill.source)}
                          onAccept={() => onAcceptSkill(skill.skill)}
                          onReject={() => onRejectSkill(skill.skill)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : noSuggestions ? (
              <div className="text-center py-6">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {SKILLS_EMPTY_STATES.noRecommendations.message}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700">
                  All suggestions reviewed!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rejected skills - collapsed */}
      {rejectedSkills.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Skipped skills ({rejectedSkills.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {rejectedSkills.map(skill => (
                <Badge
                  key={skill.skill}
                  variant="outline"
                  className="text-muted-foreground cursor-pointer hover:bg-primary/10"
                  onClick={() => onAcceptSkill(skill.skill)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {skill.skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Experience
        </Button>
        <Button onClick={onNext} className="gap-2">
          Continue to Review
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-muted-foreground">
        {finalSkillsList.length > 0 ? (
          <span>
            {finalSkillsList.length} skill{finalSkillsList.length !== 1 ? 's' : ''} will appear in your résumé
          </span>
        ) : (
          <span>Add skills to strengthen your résumé</span>
        )}
      </div>
    </div>
  );
};

// Sub-component for skill suggestion row
interface SkillSuggestionRowProps {
  skill: SuggestedSkill;
  sourceBadge: React.ReactNode;
  onAccept: () => void;
  onReject: () => void;
}

const SkillSuggestionRow = ({ skill, sourceBadge, onAccept, onReject }: SkillSuggestionRowProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between p-2 rounded-md border bg-background hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-medium text-sm truncate">{skill.skill}</span>
              {sourceBadge}
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-700"
                onClick={onAccept}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700"
                onClick={onReject}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="text-sm">{skill.reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
