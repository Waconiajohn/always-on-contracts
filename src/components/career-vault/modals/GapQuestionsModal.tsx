// Gap Questions Modal - AI-generated smart questions to fill strategic gaps
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SmartQuestion {
  question: string;
  category: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
  targetTable: string;
}

interface GapQuestionsModalProps {
  open: boolean;
  questions: SmartQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export function GapQuestionsModal({ open, questions, onSubmit, onSkip }: GapQuestionsModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Send answers to backend for processing
      await onSubmit(answers);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Generated Strategic Questions
          </DialogTitle>
          <DialogDescription>
            Answer these questions to unlock deeper career intelligence. You can skip any question.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-700">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-slate-500">
                {answeredCount} answered
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 space-y-4 border border-purple-200">
            {/* Category and Impact */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {currentQuestion.category}
              </Badge>
              <Badge variant="outline" className={getImpactColor(currentQuestion.impact)}>
                {currentQuestion.impact} impact
              </Badge>
            </div>

            {/* Question */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <p className="text-lg font-medium text-slate-900">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-white/50 rounded-md p-3 border border-purple-200/50">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">Why this matters:</span> {currentQuestion.reasoning}
              </p>
            </div>

            {/* Answer Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Your Answer
              </label>
              <Textarea
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Share your experience, achievements, or insights..."
                className="min-h-[120px] bg-white"
                autoFocus
              />
              <p className="text-xs text-slate-500">
                This will enhance: {currentQuestion.targetTable.replace('vault_', '').replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentQuestionIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onSkip}
                disabled={isSubmitting}
              >
                Skip All
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finish
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Next Question
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Question List Preview */}
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">ALL QUESTIONS</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  disabled={isSubmitting}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    idx === currentQuestionIndex
                      ? 'bg-indigo-600 text-white'
                      : answers[idx]
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
