import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Target,
  TrendingUp,
  Code,
  Crown,
  Hash,
  Calendar,
  Building,
  AlertCircle,
  Check,
  Eye
} from "lucide-react";
import { useEnhanceBullet } from "@/hooks/useEnhanceBullet";
import { SwapEvidenceDialog } from "./SwapEvidenceDialog";
import { PositionMigrationDialog } from "./PositionMigrationDialog";
import { EvidenceMatch } from "@/lib/resumeModel";

interface RequirementEvidenceReviewProps {
  evidenceMatrix: EvidenceMatch[];
  onComplete: (results: any[]) => void;
  onCancel: () => void;
}

type Step = 'requirement' | 'evidence' | 'enhance' | 'finalize';

export function RequirementEvidenceReview({
  evidenceMatrix,
  onComplete,
  onCancel
}: RequirementEvidenceReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<Step>('requirement');
  const [results, setResults] = useState<any[]>([]);
  
  const [workingBullet, setWorkingBullet] = useState<string>('');
  const [customGuidance, setCustomGuidance] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);

  const currentMatch = evidenceMatrix[currentIndex];
  const totalRequirements = evidenceMatrix.length;
  const overallProgress = ((currentIndex + (currentStep === 'finalize' ? 1 : 0)) / totalRequirements) * 100;

  const { enhance, isEnhancing } = useEnhanceBullet({
    originalBullet: currentMatch?.originalBullet || '',
    currentBullet: workingBullet,
    requirement: currentMatch?.requirementText || '',
    jobContext: currentMatch?.originalSource?.jobTitle,
    onSuccess: (enhanced) => setWorkingBullet(enhanced)
  });

  const getStepNumber = (): number => {
    const steps: Step[] = ['requirement', 'evidence', 'enhance', 'finalize'];
    return steps.indexOf(currentStep) + 1;
  };

  const isOldExperience = (dateRange: string): boolean => {
    const yearMatch = dateRange.match(/(\d{4})/);
    if (!yearMatch) return false;
    const year = parseInt(yearMatch[1]);
    const currentYear = new Date().getFullYear();
    return (currentYear - year) > 2;
  };

  const handleNextStep = () => {
    if (currentStep === 'requirement') {
      setCurrentStep('evidence');
      setWorkingBullet(currentMatch.enhancedBullet || currentMatch.originalBullet || '');
    } else if (currentStep === 'evidence') {
      setCurrentStep('enhance');
    } else if (currentStep === 'enhance') {
      setCurrentStep('finalize');
    } else if (currentStep === 'finalize') {
      // Save result
      const newResult = {
        requirementId: currentMatch.requirementId,
        requirementText: currentMatch.requirementText,
        selectedBullet: workingBullet,
        source: {
          milestoneId: currentMatch.milestoneId,
          workPositionId: currentMatch.originalSource?.workPositionId,
          originalBullet: currentMatch.originalBullet
        }
      };
      setResults([...results, newResult]);
      
      // Move to next requirement or complete
      if (currentIndex < totalRequirements - 1) {
        setCurrentIndex(currentIndex + 1);
        setCurrentStep('requirement');
        setWorkingBullet('');
        setCustomGuidance('');
        setShowOriginal(false);
      } else {
        onComplete([...results, newResult]);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'requirement') {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setCurrentStep('finalize');
      }
    } else if (currentStep === 'evidence') {
      setCurrentStep('requirement');
    } else if (currentStep === 'enhance') {
      setCurrentStep('evidence');
    } else if (currentStep === 'finalize') {
      setCurrentStep('enhance');
    }
  };

  const handleSwapComplete = (newEvidence: any) => {
    setWorkingBullet(newEvidence.bullet);
    currentMatch.originalBullet = newEvidence.bullet;
    currentMatch.enhancedBullet = newEvidence.bullet;
    currentMatch.originalSource = {
      jobTitle: newEvidence.source.jobTitle,
      company: newEvidence.source.company,
      dateRange: newEvidence.source.dateRange
    };
  };

  const handleMigrationComplete = (newEvidence: any) => {
    handleSwapComplete(newEvidence);
  };

  const insertKeyword = (keyword: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) {
      // Fallback: append to end if textarea not found
      setWorkingBullet(prev => `${prev} ${keyword}`);
      return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = workingBullet;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const newText = `${before} ${keyword}${after}`;
    setWorkingBullet(newText);
    
    // Focus back on textarea after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + keyword.length + 1, start + keyword.length + 1);
    }, 0);
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          Requirement {currentIndex + 1} of {totalRequirements} • Step {getStepNumber()} of 4
        </div>
        <Badge variant="outline">{Math.round(overallProgress)}% Complete</Badge>
      </div>
      <Progress value={overallProgress} className="h-2" />
    </div>
  );

  const renderRequirementStep = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>Review the Requirement</CardTitle>
        </div>
        <CardDescription>Understand what the job is looking for</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold">{currentMatch.requirementText}</h3>
            <Badge className="ml-4">
              {currentMatch.requirementCategory === 'required' ? 'Required' : 
               currentMatch.requirementCategory === 'preferred' ? 'Preferred' : 'Nice to Have'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Badge variant="secondary" className={
              currentMatch.matchScore >= 80 
                ? "bg-green-100 text-green-800" 
                : currentMatch.matchScore >= 60 
                  ? "bg-yellow-100 text-yellow-800" 
                  : "bg-orange-100 text-orange-800"
            }>
              {Math.round(currentMatch.matchScore)}% Match Quality
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentMatch.matchScore >= 80 
                ? "Strong match found" 
                : currentMatch.matchScore >= 60 
                  ? "Good match found" 
                  : "Weak match - consider enhancing"}
            </span>
          </div>
        </div>

        {currentMatch.atsKeywords && currentMatch.atsKeywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              ATS Keywords to Include:
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentMatch.atsKeywords.map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleNextStep} className="w-full" size="lg">
          Review Your Evidence
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderEvidenceStep = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-5 w-5 text-primary" />
          <CardTitle>Review Your Evidence</CardTitle>
        </div>
        <CardDescription>Examine the matched experience from your vault</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <>
          <div className="p-6 bg-muted/50 rounded-lg border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{currentMatch.originalSource.jobTitle}</span>
                  <span className="text-muted-foreground">at</span>
                  <span className="font-medium">{currentMatch.originalSource.company}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {currentMatch.originalSource.dateRange}
                </div>
              </div>
              <Badge variant="secondary" className={
                currentMatch.matchScore >= 80 
                  ? "bg-green-100 text-green-800" 
                  : currentMatch.matchScore >= 60 
                    ? "bg-yellow-100 text-yellow-800" 
                    : "bg-orange-100 text-orange-800"
              }>
                {Math.round(currentMatch.matchScore)}% Match
              </Badge>
            </div>
            
            <p className="text-base leading-relaxed mb-4">
              {currentMatch.originalBullet}
            </p>

            {currentMatch.matchReasons && currentMatch.matchReasons.length > 0 && (
              <div className="pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Why this matches:</h5>
                <ul className="space-y-1">
                  {currentMatch.matchReasons.map((reason: string, idx: number) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {isOldExperience(currentMatch.originalSource.dateRange || '') && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  This experience is from {currentMatch.originalSource.dateRange}
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  Do you have similar experience in a more recent role?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMigrationDialogOpen(true)}
                  className="bg-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Add to Recent Position
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setSwapDialogOpen(true)} className="flex-1">
              Swap Evidence
            </Button>
            <Button onClick={handleNextStep} className="flex-1">
              Use This Evidence
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      </CardContent>
    </Card>
  );

  const renderEnhanceStep = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Enhance & Refine</CardTitle>
        </div>
        <CardDescription>Polish your bullet with AI assistance and keywords</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Your Resume Bullet:</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOriginal(!showOriginal)}
            >
              {showOriginal ? 'Hide' : 'Show'} Original
            </Button>
          </div>
          <Textarea
            value={workingBullet}
            onChange={(e) => setWorkingBullet(e.target.value)}
            rows={8}
            className="text-base resize-none"
            placeholder="Your enhanced bullet will appear here..."
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">
              {workingBullet.length} characters
            </span>
          </div>
        </div>

        {showOriginal && (
          <div className="p-4 bg-muted/50 rounded-lg border">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Original:</h5>
            <p className="text-sm">{currentMatch.originalBullet}</p>
          </div>
        )}

        {currentMatch.atsKeywords && currentMatch.atsKeywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Click to Insert Keywords:
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentMatch.atsKeywords.map((keyword, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => insertKeyword(keyword)}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Quick AI Enhancements:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => enhance('quantifiable')}
              disabled={isEnhancing}
              className="justify-start"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              More Quantifiable
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => enhance('technical')}
              disabled={isEnhancing}
              className="justify-start"
            >
              <Code className="h-4 w-4 mr-2" />
              More Technical
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => enhance('leadership')}
              disabled={isEnhancing}
              className="justify-start"
            >
              <Crown className="h-4 w-4 mr-2" />
              More Leadership
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => enhance('keywords')}
              disabled={isEnhancing}
              className="justify-start"
            >
              <Hash className="h-4 w-4 mr-2" />
              Add Keywords
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Custom Enhancement:</h4>
          <div className="flex gap-2">
            <Textarea
              value={customGuidance}
              onChange={(e) => setCustomGuidance(e.target.value)}
              rows={2}
              placeholder="Type your custom instructions here..."
              className="resize-none"
            />
            <Button
              onClick={() => {
                enhance(`Custom: ${customGuidance}`);
                setCustomGuidance('');
              }}
              disabled={!customGuidance.trim() || isEnhancing}
              size="sm"
              className="self-end"
            >
              Apply
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handlePrevStep}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNextStep} className="flex-1" disabled={!workingBullet.trim()}>
            Finalize & Review
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderFinalizeStep = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Check className="h-5 w-5 text-primary" />
          <CardTitle>Final Review</CardTitle>
        </div>
        <CardDescription>Confirm your enhanced bullet before moving on</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Addresses Requirement:</h4>
          <p className="text-base font-semibold mb-4">{currentMatch.requirementText}</p>
        </div>

        <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 mb-3">Final Bullet:</h4>
          <p className="text-base leading-relaxed">{workingBullet}</p>
        </div>

        <div className="text-sm text-muted-foreground">
          <h5 className="font-medium mb-1">Source:</h5>
          <p>
            {currentMatch.originalSource.jobTitle} at {currentMatch.originalSource.company} • {currentMatch.originalSource.dateRange}
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handlePrevStep}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Edit Again
          </Button>
          <Button onClick={handleNextStep} className="flex-1">
            {currentIndex < totalRequirements - 1 ? (
              <>
                Confirm & Next Requirement
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Confirm & Complete
                <Check className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (!currentMatch) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderStepIndicator()}
      
      {currentStep === 'requirement' && renderRequirementStep()}
      {currentStep === 'evidence' && renderEvidenceStep()}
      {currentStep === 'enhance' && renderEnhanceStep()}
      {currentStep === 'finalize' && renderFinalizeStep()}

      <div className="mt-6 flex justify-between items-center">
        <Button variant="ghost" onClick={onCancel}>
          Cancel Review
        </Button>
        <div className="text-sm text-muted-foreground">
          {results.length} of {totalRequirements} requirements completed
        </div>
      </div>

      <SwapEvidenceDialog
        open={swapDialogOpen}
        onOpenChange={setSwapDialogOpen}
        requirementId={currentMatch.requirementId}
        requirementText={currentMatch.requirementText}
        currentEvidenceId={currentMatch.milestoneId}
        onSwapComplete={handleSwapComplete}
      />

      <PositionMigrationDialog
        open={migrationDialogOpen}
        onOpenChange={setMigrationDialogOpen}
        currentBullet={currentMatch.originalBullet}
        currentPosition={{
          jobTitle: currentMatch.originalSource.jobTitle,
          company: currentMatch.originalSource.company,
          dateRange: currentMatch.originalSource.dateRange
        }}
        requirement={currentMatch.requirementText}
        onMigrationComplete={handleMigrationComplete}
      />
    </div>
  );
}
