import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { MissingBulletPlan } from '../types';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft, Check, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Step3AnswerAssistant() {
  const { toast } = useToast();
  
  const fitBlueprint = useOptimizerStore(state => state.fitBlueprint);
  const missingBulletResponses = useOptimizerStore(state => state.missingBulletResponses);
  const addMissingBulletResponse = useOptimizerStore(state => state.addMissingBulletResponse);
  const goToNextStep = useOptimizerStore(state => state.goToNextStep);
  const goToPrevStep = useOptimizerStore(state => state.goToPrevStep);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  
  const missingBullets = fitBlueprint?.missingBulletPlan || [];
  const currentBullet = missingBullets[currentIndex] as MissingBulletPlan | undefined;
  
  const answeredCount = Object.keys(missingBulletResponses).length;
  const progress = missingBullets.length > 0 ? (answeredCount / missingBullets.length) * 100 : 0;
  
  const handleSaveAndNext = () => {
    if (currentBullet && currentResponse.trim()) {
      addMissingBulletResponse(currentBullet.id, currentResponse.trim());
      toast({ title: 'Response saved!' });
    }
    
    if (currentIndex < missingBullets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextBullet = missingBullets[currentIndex + 1] as MissingBulletPlan;
      setCurrentResponse(missingBulletResponses[nextBullet?.id] || '');
    } else {
      goToNextStep();
    }
  };
  
  const handleSkip = () => {
    if (currentIndex < missingBullets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextBullet = missingBullets[currentIndex + 1] as MissingBulletPlan;
      setCurrentResponse(missingBulletResponses[nextBullet?.id] || '');
    } else {
      goToNextStep();
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      const prevBullet = missingBullets[currentIndex - 1] as MissingBulletPlan;
      setCurrentResponse(missingBulletResponses[prevBullet?.id] || '');
    } else {
      goToPrevStep();
    }
  };

  if (missingBullets.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Check className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="font-medium text-lg">Your Profile is Complete!</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
              The Fit Blueprint didn't identify any missing information. You can proceed to customize your resume.
            </p>
            <Button onClick={goToNextStep} className="mt-6 gap-2">
              Continue to Customization
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentIndex + 1} of {missingBullets.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {answeredCount} answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Question */}
      {currentBullet && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">What we need from you</CardTitle>
                <CardDescription className="mt-2">
                  {currentBullet.whatToAskCandidate}
                </CardDescription>
              </div>
              {missingBulletResponses[currentBullet.id] && (
                <Badge variant="default" className="shrink-0">
                  <Check className="h-3 w-3 mr-1" />
                  Answered
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Requirements addressed */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">This helps address:</p>
              <div className="flex flex-wrap gap-1">
                {currentBullet.targetRequirementIds.map((reqId: string) => {
                  const req = fitBlueprint?.requirements.find(r => r.id === reqId);
                  return (
                    <Badge key={reqId} variant="outline" className="text-xs">
                      {req?.requirement?.substring(0, 40) || reqId}...
                    </Badge>
                  );
                })}
              </div>
            </div>
            
            {/* Template bullet hint */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Template format:</p>
              <p className="text-sm italic">{currentBullet.templateBullet}</p>
            </div>
            
            {/* Response input */}
            <div>
              <Textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Provide specific details, metrics, or examples..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Where this goes: {currentBullet.whereToPlace}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {currentIndex === 0 ? 'Back to Fit Blueprint' : 'Previous'}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSkip} className="gap-2">
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
          <Button onClick={handleSaveAndNext} className="gap-2">
            {currentIndex === missingBullets.length - 1 ? 'Continue to Customization' : 'Save & Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
