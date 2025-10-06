import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GuidedPromptSelector } from './GuidedPromptSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, TrendingUp } from 'lucide-react';

interface ResponseReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responseId: string;
  warChestId: string;
  question: string;
  currentAnswer: string;
  currentScore: number;
  onSuccess: () => void;
}

interface ValidationResult {
  is_sufficient: boolean;
  quality_score: number;
  missing_elements: string[];
  follow_up_prompt: string;
  strengths: string[];
  guided_prompts?: any;
}

export function ResponseReviewModal({
  open,
  onOpenChange,
  responseId,
  warChestId,
  question,
  currentAnswer,
  currentScore,
  onSuccess,
}: ResponseReviewModalProps) {
  const [answer, setAnswer] = useState(currentAnswer);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const validateAnswer = async (answerText: string) => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-interview-response', {
        body: { question, answer: answerText }
      });

      if (error) throw error;
      setValidationResult(data);
      return data;
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyOptions = (selectedOptions: string[]) => {
    const optionsText = selectedOptions.join('; ');
    const enhancedAnswer = `${answer}\n\nAdditional details: ${optionsText}`;
    setAnswer(enhancedAnswer);
    setValidationResult(null);
  };

  const handleSave = async () => {
    // First validate the answer
    const validation = await validateAnswer(answer);
    if (!validation) return;

    // If quality improved or user wants to save anyway
    if (validation.quality_score >= currentScore || validation.is_sufficient) {
      setIsSaving(true);
      try {
        // Get current version first
        const { data: currentData } = await supabase
          .from('war_chest_interview_responses')
          .select('version')
          .eq('id', responseId)
          .single();

        // Update the response
        const { error: updateError } = await supabase
          .from('war_chest_interview_responses')
          .update({
            response: answer,
            quality_score: validation.quality_score,
            validation_feedback: validation,
            version: (currentData?.version || 1) + 1,
          })
          .eq('id', responseId);

        if (updateError) throw updateError;

        // Re-extract intelligence
        const { error: extractError } = await supabase.functions.invoke('extract-war-chest-intelligence', {
          body: {
            warChestId,
            question,
            userResponse: answer,
          }
        });

        if (extractError) {
          console.error('Intelligence extraction error:', extractError);
        }

        toast({
          title: 'Response enhanced!',
          description: `Quality score: ${validation.quality_score}/100`,
        });

        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        console.error('Save error:', error);
        toast({
          title: 'Failed to save',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCheckQuality = () => {
    validateAnswer(answer);
  };

  const scoreColor = validationResult
    ? validationResult.quality_score >= 90
      ? 'text-green-600 dark:text-green-400'
      : validationResult.quality_score >= 70
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-amber-600 dark:text-amber-400'
    : currentScore >= 90
    ? 'text-green-600 dark:text-green-400'
    : currentScore >= 70
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-amber-600 dark:text-amber-400';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enhance Your Response</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
            <p className="text-sm">{question}</p>
          </div>

          {/* Current Score */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Quality:</span>
            <Badge variant="outline" className={scoreColor}>
              {currentScore}/100
            </Badge>
          </div>

          {/* Answer Editor */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your Answer:</label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Edit your response..."
              rows={8}
              className="resize-none"
            />
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">New Quality Score:</span>
                </div>
                <div className={`text-2xl font-bold ${scoreColor}`}>
                  {validationResult.quality_score}/100
                </div>
              </div>

              {validationResult.strengths && validationResult.strengths.length > 0 && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-sm">
                    <strong>Strengths:</strong> {validationResult.strengths.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.guided_prompts && !validationResult.is_sufficient && (
                <GuidedPromptSelector
                  guidedPrompts={validationResult.guided_prompts}
                  onApply={handleApplyOptions}
                  onSkip={() => setValidationResult(null)}
                  skipAttempts={1}
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCheckQuality}
              disabled={isValidating || answer === currentAnswer}
              variant="outline"
              className="flex-1"
            >
              {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Quality
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || answer === currentAnswer || isValidating}
              className="flex-1"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Enhancement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
