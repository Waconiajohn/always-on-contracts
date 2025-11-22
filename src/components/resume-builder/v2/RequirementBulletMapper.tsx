import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface EvidenceMatch {
  requirementId: string;
  requirementText: string;
  requirementCategory: string;
  
  milestoneId: string;
  originalBullet: string;
  originalSource: {
    jobTitle: string;
    company: string;
    dateRange: string;
  };
  
  matchScore: number;
  matchReasons: string[];
  matchConfidence: number;
  
  enhancedBullet: string;
  atsKeywords: string[];
  suggestedKeywords: string[];
  enhancementReasoning: string;
}

interface RequirementBulletMapperProps {
  evidenceMatrix: EvidenceMatch[];
  unmatchedRequirements?: any[];
  onSelectionChange: (requirementId: string, selection: 'original' | 'enhanced' | 'custom', customText?: string) => void;
  onSwapEvidence?: (requirementId: string) => void;
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export function RequirementBulletMapper({
  evidenceMatrix,
  unmatchedRequirements = [],
  onSelectionChange,
  onSwapEvidence,
  currentIndex = 0,
  onNavigate
}: RequirementBulletMapperProps) {
  const [editingRequirement, setEditingRequirement] = useState<string | null>(null);
  const [customEdits, setCustomEdits] = useState<Record<string, string>>({});
  const [selectedVersions, setSelectedVersions] = useState<Record<string, 'original' | 'enhanced' | 'custom'>>({});

  const totalItems = evidenceMatrix.length + unmatchedRequirements.length;
  const currentMatch = evidenceMatrix[currentIndex];
  const isUnmatched = currentIndex >= evidenceMatrix.length;

  const handleSelectVersion = (requirementId: string, version: 'original' | 'enhanced' | 'custom') => {
    setSelectedVersions(prev => ({ ...prev, [requirementId]: version }));
    const customText = version === 'custom' ? customEdits[requirementId] : undefined;
    onSelectionChange(requirementId, version, customText);
  };

  const handleEditCustom = (requirementId: string, text: string) => {
    setCustomEdits(prev => ({ ...prev, [requirementId]: text }));
  };

  const handleSaveCustom = (requirementId: string) => {
    handleSelectVersion(requirementId, 'custom');
    setEditingRequirement(null);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      required: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      preferred: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      nice_to_have: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    };
    return colors[category as keyof typeof colors] || colors.nice_to_have;
  };

  if (evidenceMatrix.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Evidence Matches Found</h3>
        <p className="text-muted-foreground">
          No suitable evidence was found in your career vault to address the job requirements.
          Please add more work history or manually create content.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      {totalItems > 1 && onNavigate && (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Requirement {currentIndex + 1} of {totalItems}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(Math.min(totalItems - 1, currentIndex + 1))}
            disabled={currentIndex === totalItems - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {!isUnmatched && currentMatch && (
        <Card className="p-6">
          {/* Requirement Header */}
          <div className="mb-6 pb-4 border-b">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{currentMatch.requirementText}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getCategoryBadge(currentMatch.requirementCategory)}>
                    {currentMatch.requirementCategory.replace('_', ' ')}
                  </Badge>
                  <Badge className={getMatchScoreColor(currentMatch.matchScore)}>
                    Match: {currentMatch.matchScore}%
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Match Reasons */}
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Why this matches:</p>
              {currentMatch.matchReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: The Ask */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                The Ask
              </h4>
              <Card className="p-4 bg-muted/30 border-dashed">
                <p className="text-sm mb-3">{currentMatch.requirementText}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Required Skills/Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {currentMatch.atsKeywords.map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Column 2: Your Proof */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Your Proof
              </h4>
              <Card className="p-4 border-2 border-primary/20">
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Original:</p>
                  <p className="text-sm">{currentMatch.originalBullet}</p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-3 border-t">
                  <p><span className="font-medium">Source:</span> {currentMatch.originalSource.jobTitle}</p>
                  <p><span className="font-medium">Company:</span> {currentMatch.originalSource.company}</p>
                  <p><span className="font-medium">Period:</span> {currentMatch.originalSource.dateRange}</p>
                </div>
                {onSwapEvidence && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => onSwapEvidence(currentMatch.requirementId)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Swap Evidence
                  </Button>
                )}
              </Card>
            </div>

            {/* Column 3: Resume Bullet */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Resume Bullet
              </h4>
              <div className="space-y-2">
                {/* Enhanced Version */}
                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedVersions[currentMatch.requirementId] === 'enhanced'
                      ? 'border-primary border-2 bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectVersion(currentMatch.requirementId, 'enhanced')}
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm">{currentMatch.enhancedBullet}</p>
                      <div className="flex flex-wrap gap-1">
                        {currentMatch.atsKeywords.map((kw, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            +{kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Original Version */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleSelectVersion(currentMatch.requirementId, 'original')}
                >
                  {selectedVersions[currentMatch.requirementId] === 'original' && (
                    <CheckCircle2 className="h-3 w-3 mr-2 text-primary" />
                  )}
                  Keep Original
                </Button>

                {/* Custom Edit */}
                {editingRequirement === currentMatch.requirementId ? (
                  <div className="space-y-2">
                    <Textarea
                      value={customEdits[currentMatch.requirementId] || currentMatch.enhancedBullet}
                      onChange={(e) => handleEditCustom(currentMatch.requirementId, e.target.value)}
                      className="min-h-[100px] text-sm"
                      placeholder="Write your custom version..."
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRequirement(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveCustom(currentMatch.requirementId)}
                      >
                        Save Custom
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setEditingRequirement(currentMatch.requirementId);
                      if (!customEdits[currentMatch.requirementId]) {
                        handleEditCustom(currentMatch.requirementId, currentMatch.enhancedBullet);
                      }
                    }}
                  >
                    <Edit3 className="h-3 w-3 mr-2" />
                    Edit Further
                  </Button>
                )}
              </div>

              {/* Enhancement Reasoning */}
              {currentMatch.enhancementReasoning && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
                  <p className="font-medium mb-1">Why this enhancement works:</p>
                  <p>{currentMatch.enhancementReasoning}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Unmatched Requirements */}
      {isUnmatched && unmatchedRequirements.length > 0 && (
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">No Match Found</h3>
              <p className="text-sm text-muted-foreground">
                {unmatchedRequirements[currentIndex - evidenceMatrix.length]?.text}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            No suitable evidence was found in your career vault for this requirement. 
            You can either add new work history or manually create content for this.
          </p>
          <Button variant="outline" className="w-full">
            Manually Add Content
          </Button>
        </Card>
      )}
    </div>
  );
}