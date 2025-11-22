import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Check, RefreshCw, Sparkles, CheckCircle2, Info } from "lucide-react";
import { SwapEvidenceDialog } from "./SwapEvidenceDialog";
import { FurtherEnhanceDialog } from "./FurtherEnhanceDialog";

interface EvidenceMatch {
  requirementId: string;
  requirementText: string;
  requirementCategory: 'required' | 'preferred' | 'nice_to_have';
  priority?: string;
  
  originalBullet: string;
  originalSource: {
    jobTitle: string;
    company: string;
    dateRange: string;
  };
  
  matchScore: number;
  matchReasons: string[];
  qualityScore?: string;
  
  enhancedBullet: string;
  atsKeywords: string[];
}

export interface RequirementBulletMapperProps {
  evidenceMatrix: EvidenceMatch[];
  onComplete: (selections: Record<string, any>) => void;
  onCancel: () => void;
}

export function RequirementBulletMapper({ evidenceMatrix, onComplete, onCancel }: RequirementBulletMapperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, 'original' | 'enhanced' | 'custom'>>({});
  const [customEdits, setCustomEdits] = useState<Record<string, string>>({});
  const [swappedEvidence, setSwappedEvidence] = useState<Record<string, any>>({});
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [furtherEnhanceOpen, setFurtherEnhanceOpen] = useState(false);
  const [enhancedBullets, setEnhancedBullets] = useState<Record<string, string>>({});

  const currentItem = evidenceMatrix[currentIndex];
  const isLast = currentIndex === evidenceMatrix.length - 1;
  const isFirst = currentIndex === 0;
  const currentSwapped = swappedEvidence[currentItem.requirementId];

  // Use swapped evidence if available, otherwise default
  const displayBullet = currentSwapped?.bullet || currentItem.originalBullet;
  const displaySource = currentSwapped?.source || currentItem.originalSource;
  const displayScore = currentSwapped?.matchScore || currentItem.matchScore;
  const displayEnhancedBullet = enhancedBullets[currentItem.requirementId] || currentItem.enhancedBullet;

  const handleFurtherEnhance = (newBullet: string) => {
    setEnhancedBullets(prev => ({
      ...prev,
      [currentItem.requirementId]: newBullet
    }));
    handleSelection('enhanced');
  };

  const handleSelection = (type: 'original' | 'enhanced' | 'custom') => {
    setSelections(prev => ({ ...prev, [currentItem.requirementId]: type }));
  };

  const handleCustomEdit = (text: string) => {
    setCustomEdits(prev => ({ ...prev, [currentItem.requirementId]: text }));
    handleSelection('custom');
  };
  
  const handleSwapComplete = (newEvidence: any) => {
    setSwappedEvidence(prev => ({
      ...prev,
      [currentItem.requirementId]: newEvidence
    }));
    // Reset selection to original (or enhanced if we regenerate, but for now original is safe)
    handleSelection('original');
  };

  const currentSelection = selections[currentItem.requirementId] || 'enhanced';
  const customText = customEdits[currentItem.requirementId] || displayEnhancedBullet;

  const handleNext = () => {
    if (isLast) {
      // Compile final results with proper structure
      const finalResults: Record<string, any> = {};
      evidenceMatrix.forEach(item => {
        const choice = selections[item.requirementId] || 'enhanced';
        const swapped = swappedEvidence[item.requirementId];
        
        finalResults[item.requirementId] = {
          version: choice,
          customText: choice === 'custom' ? (customEdits[item.requirementId] || item.enhancedBullet) : undefined,
          swappedEvidenceId: swapped?.id,
          swappedOriginalBullet: swapped?.bullet
        };
      });
      onComplete(finalResults);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review Evidence</h3>
          <p className="text-sm text-muted-foreground">
            Requirement {currentIndex + 1} of {evidenceMatrix.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={isFirst} onClick={() => setCurrentIndex(prev => prev - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled={isLast} onClick={() => setCurrentIndex(prev => prev + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Column 1: The Ask */}
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                📋 Job Requirement
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={
                      currentItem.priority === 'required' || currentItem.requirementCategory === 'required' ? 'destructive' : 
                      currentItem.priority === 'preferred' || currentItem.requirementCategory === 'preferred' ? 'default' : 
                      'secondary'
                    } className="text-xs capitalize">
                      <Info className="h-3 w-3 mr-1" />
                      {currentItem.priority || currentItem.requirementCategory.replace('_', ' ')}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">This shows the requirement's priority level from the job posting</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="font-medium text-sm">{currentItem.requirementText}</p>
            {currentItem.qualityScore && (
              <Badge variant="outline" className={`text-xs ${
                currentItem.qualityScore === 'strong' ? 'bg-green-50 text-green-700 border-green-200' :
                currentItem.qualityScore === 'good' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                {currentItem.qualityScore === 'strong' ? '💪 Strong Match' :
                 currentItem.qualityScore === 'good' ? '👍 Good Match' :
                 '⚠️ Weak Match'}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Column 2: The Proof */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="bg-slate-100 text-slate-700">
                ✅ Your Evidence
              </Badge>
              <span className={`text-xs font-bold ${
                displayScore >= 80 ? 'text-green-600' : 
                displayScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {displayScore}% Match
              </span>
            </div>
            
            <div className="p-3 bg-background rounded border text-sm text-muted-foreground italic">
              "{displayBullet}"
            </div>
            
            <div className="text-xs text-muted-foreground">
              Source: {displaySource.jobTitle} at {displaySource.company}
            </div>

            {currentSwapped && (
              <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Evidence swapped
              </div>
            )}

            {!currentSwapped && (
              <div className="space-y-1">
                {currentItem.matchReasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-green-700">
                    <Check className="h-3 w-3 mt-0.5" />
                    {reason}
                  </div>
                ))}
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={() => setSwapDialogOpen(true)}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Swap Evidence
            </Button>
          </CardContent>
        </Card>

        {/* Column 3: The Result */}
        <Card className={currentSelection === 'enhanced' ? 'border-primary ring-1 ring-primary/20' : ''}>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="default" className="bg-primary">
                📝 Resume Bullet Options
              </Badge>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>

            <div 
              className={`p-3 rounded border text-sm cursor-pointer transition-colors ${
                currentSelection === 'enhanced' ? 'bg-primary/5 border-primary/50' : 'hover:bg-muted/50'
              }`}
              onClick={() => handleSelection('enhanced')}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-xs text-primary">Enhanced Version (Recommended)</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFurtherEnhanceOpen(true);
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Further Enhance
                </Button>
              </div>
              {displayEnhancedBullet}
            </div>

            <div 
              className={`p-3 rounded border text-sm cursor-pointer transition-colors ${
                currentSelection === 'original' ? 'bg-slate-100 border-slate-400' : 'hover:bg-muted/50'
              }`}
              onClick={() => handleSelection('original')}
            >
              <p className="font-medium text-xs text-muted-foreground mb-1">Original Version</p>
              {displayBullet}
            </div>

            <div 
              className={`p-3 rounded border text-sm cursor-pointer transition-colors ${
                currentSelection === 'custom' ? 'bg-background border-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => handleSelection('custom')}
            >
              <p className="font-medium text-xs text-muted-foreground mb-1">Custom Edit</p>
              <Textarea 
                value={customText}
                onChange={(e) => handleCustomEdit(e.target.value)}
                className="text-xs min-h-[60px]"
                placeholder="Edit bullet..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button variant="ghost" onClick={onCancel} className="mr-auto">Cancel</Button>
        <Button onClick={handleNext}>
          {isLast ? "Approve All & Generate" : "Next Requirement"}
        </Button>
      </div>

      <SwapEvidenceDialog
        open={swapDialogOpen}
        onOpenChange={setSwapDialogOpen}
        requirementId={currentItem.requirementId}
        requirementText={currentItem.requirementText}
        currentEvidenceId={currentSwapped?.id}
        onSwapComplete={handleSwapComplete}
      />

      <FurtherEnhanceDialog
        open={furtherEnhanceOpen}
        onOpenChange={setFurtherEnhanceOpen}
        originalBullet={displayBullet}
        currentEnhancedBullet={displayEnhancedBullet}
        requirement={currentItem.requirementText}
        onEnhanced={handleFurtherEnhance}
      />
    </div>
  );
}
