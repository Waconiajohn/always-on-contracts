import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateInput, invokeEdgeFunction, SubmitMicroAnswersSchema } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

interface MicroQuestion {
  id: string;
  vaultCategory: string;
  vaultItemId: string;
  currentTier: 'bronze' | 'silver' | 'assumed';
  targetTier: 'silver' | 'gold';
  question: string;
  questionType: 'numeric' | 'text' | 'yes_no' | 'multiple_choice';
  hint?: string;
  answerOptions?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    unit?: string;
  };
}

interface MicroQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  vaultId: string;
  triggerId: string;
  questions: MicroQuestion[];
  onComplete: () => void;
}

export const MicroQuestionsModal = ({
  open,
  onClose,
  triggerId,
  questions,
  onComplete
}: MicroQuestionsModalProps) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const tierIcons = {
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
    assumed: '💭'
  };

  const tierColors = {
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-500',
    silver: 'bg-gray-100 text-gray-800 border-gray-400'
  };

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const answerArray = Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId,
        userAnswer
      }));

      const validated = validateInput(SubmitMicroAnswersSchema, {
        triggerId,
        answers: answerArray
      });

      const { data, error } = await invokeEdgeFunction(
        'submit-micro-answers',
        validated
      );

      if (error || !data) {
        throw new Error(error?.message || 'Failed to submit answers');
      }

      const succeededCount = data.succeeded || 0;
      toast({
        title: 'Vault Upgraded! 🎉',
        description: `Successfully upgraded ${succeededCount} vault ${succeededCount === 1 ? 'item' : 'items'} to higher quality tiers.`
      });

      onComplete();
      onClose();

    } catch (error: any) {
      logger.error('[MICRO-QUESTIONS] Submit error', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Skipped',
      description: 'You can answer these questions later from your vault dashboard.'
    });
    onClose();
  };

  const isAnswered = answers[currentQuestion?.id] !== undefined;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <DialogTitle>Quick Questions to Improve Your Vault</DialogTitle>
          </div>
          <DialogDescription>
            Answer {questions.length} quick questions to upgrade your vault items to higher quality tiers.
            This only takes 1-2 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="font-medium">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Question */}
          {currentQuestion && (
            <div className="space-y-4">
              {/* Upgrade Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={tierColors[currentQuestion.currentTier as keyof typeof tierColors] || 'bg-slate-100'}>
                  {tierIcons[currentQuestion.currentTier]} {currentQuestion.currentTier}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className={tierColors[currentQuestion.targetTier]}>
                  {tierIcons[currentQuestion.targetTier]} {currentQuestion.targetTier}
                </Badge>
              </div>

              {/* Question */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">{currentQuestion.question}</Label>
                {currentQuestion.hint && (
                  <p className="text-sm text-muted-foreground">{currentQuestion.hint}</p>
                )}
              </div>

              {/* Answer Input */}
              <div className="space-y-3">
                {currentQuestion.questionType === 'numeric' && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min={currentQuestion.validation?.min}
                        max={currentQuestion.validation?.max}
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => handleAnswer(parseInt(e.target.value))}
                        placeholder="Enter number"
                        className="text-lg"
                      />
                    </div>
                    {currentQuestion.validation?.unit && (
                      <span className="text-sm text-muted-foreground pb-2">
                        {currentQuestion.validation.unit}
                      </span>
                    )}
                  </div>
                )}

                {currentQuestion.questionType === 'text' && (
                  <Input
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="Enter your answer"
                    className="text-lg"
                  />
                )}

                {currentQuestion.questionType === 'yes_no' && (
                  <div className="flex gap-3">
                    <Button
                      variant={answers[currentQuestion.id] === true ? 'default' : 'outline'}
                      onClick={() => handleAnswer(true)}
                      className="flex-1"
                    >
                      Yes
                    </Button>
                    <Button
                      variant={answers[currentQuestion.id] === false ? 'default' : 'outline'}
                      onClick={() => handleAnswer(false)}
                      className="flex-1"
                    >
                      No
                    </Button>
                  </div>
                )}

                {currentQuestion.questionType === 'multiple_choice' && currentQuestion.answerOptions && (
                  <div className="space-y-2">
                    {currentQuestion.answerOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={answers[currentQuestion.id] === option.value ? 'default' : 'outline'}
                        onClick={() => handleAnswer(option.value)}
                        className="w-full justify-start"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
              >
                Back
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
              >
                Skip for now
              </Button>
            </div>

            <Button
              onClick={handleNext}
              disabled={!isAnswered || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : currentQuestionIndex === questions.length - 1 ? (
                <>
                  <Award className="h-4 w-4" />
                  Upgrade Vault
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Benefits Reminder */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Why answer these questions?</p>
                <ul className="space-y-1 text-blue-700 dark:text-blue-200">
                  <li>• Higher quality tiers = better resume matching</li>
                  <li>• Upgraded items get prioritized in AI generation</li>
                  <li>• Improve your ATS scores and job match rates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
