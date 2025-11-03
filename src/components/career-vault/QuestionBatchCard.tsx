import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, HelpCircle, SkipForward } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Question {
  id: string;
  type: string;
  category: string;
  question: string;
  inputType: string;
  options?: any[];
  followUp?: string;
  why: string;
  impactScore: number;
}

interface QuestionBatchProps {
  batch: {
    category: string;
    questions: Question[];
    totalImpact: number;
  };
  onComplete: (responses: any[]) => void;
  onSkip: () => void;
}

export const QuestionBatchCard = ({ batch, onComplete, onSkip }: QuestionBatchProps) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setSkipped(prev => {
      const newSkipped = { ...prev };
      delete newSkipped[questionId];
      return newSkipped;
    });
  };

  const handleSkipQuestion = (questionId: string) => {
    setSkipped(prev => ({ ...prev, [questionId]: true }));
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
  };

  const handleSubmit = () => {
    const responses = batch.questions.map(q => ({
      questionId: q.id,
      questionType: q.type,
      category: q.category,
      question: q.question,
      answer: answers[q.id],
      skipped: skipped[q.id] || false,
      impactScore: q.impactScore
    }));
    onComplete(responses);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = batch.questions.length;
  const canSubmit = answeredCount > 0 || Object.keys(skipped).length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg capitalize">
              {batch.category.replace(/_/g, ' ')}
            </CardTitle>
            <CardDescription>
              {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'} • 
              Answer what you can, skip what doesn't apply
            </CardDescription>
          </div>
          <Badge variant="secondary">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {answeredCount}/{totalQuestions}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {batch.questions.map((question, index) => (
          <div 
            key={question.id} 
            className={`p-4 border rounded-lg space-y-3 transition-all ${
              answers[question.id] ? 'border-primary bg-accent/20 text-accent-foreground' : 
              skipped[question.id] ? 'border-muted bg-muted/20 text-muted-foreground' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="flex-shrink-0 mt-1">
                {index + 1}
              </Badge>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-medium text-foreground">{question.question}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{question.why}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Render input based on type */}
                {question.inputType === 'multiple_choice' && question.options && (
                  <RadioGroup
                    value={answers[question.id]}
                    onValueChange={(value) => handleAnswer(question.id, value)}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {question.options.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2 p-3 border rounded bg-card hover:bg-accent transition-colors cursor-pointer group">
                          <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                          <Label htmlFor={`${question.id}-${option.value}`} className="cursor-pointer flex items-center gap-2 flex-1 text-card-foreground group-hover:text-accent-foreground">
                            {option.icon && <span>{option.icon}</span>}
                            <span>{option.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {question.inputType === 'checkbox_grid' && question.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {question.options.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2 p-3 border rounded bg-card hover:bg-accent transition-colors group">
                        <Checkbox
                          id={`${question.id}-${option.value}`}
                          checked={answers[question.id]?.includes(option.value)}
                          onCheckedChange={(checked) => {
                            const current = answers[question.id] || [];
                            const updated = checked
                              ? [...current, option.value]
                              : current.filter((v: string) => v !== option.value);
                            handleAnswer(question.id, updated);
                          }}
                        />
                        <Label htmlFor={`${question.id}-${option.value}`} className="cursor-pointer flex items-center gap-2 flex-1 text-card-foreground group-hover:text-accent-foreground">
                          {option.icon && <span>{option.icon}</span>}
                          <span className="text-sm">{option.label}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {question.inputType === 'textarea' && (
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    placeholder="Share your experience..."
                    className="min-h-[100px]"
                  />
                )}

                {question.inputType === 'yes_no_expand' && (
                  <div className="space-y-3">
                    <RadioGroup
                      value={answers[question.id]?.response}
                      onValueChange={(value) => handleAnswer(question.id, { ...answers[question.id], response: value })}
                    >
                      <div className="flex gap-3">
                        <div className="flex items-center space-x-2 p-3 border rounded bg-card hover:bg-accent transition-colors cursor-pointer flex-1 group">
                          <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                          <Label htmlFor={`${question.id}-yes`} className="cursor-pointer flex-1 text-card-foreground group-hover:text-accent-foreground">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded bg-card hover:bg-accent transition-colors cursor-pointer flex-1 group">
                          <RadioGroupItem value="no" id={`${question.id}-no`} />
                          <Label htmlFor={`${question.id}-no`} className="cursor-pointer flex-1 text-card-foreground group-hover:text-accent-foreground">No</Label>
                        </div>
                      </div>
                    </RadioGroup>
                    {answers[question.id]?.response === 'yes' && (
                      <Textarea
                        value={answers[question.id]?.details || ''}
                        onChange={(e) => handleAnswer(question.id, { ...answers[question.id], details: e.target.value })}
                        placeholder={question.followUp || "Please provide details..."}
                        className="min-h-[80px]"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  {answers[question.id] && (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Answered
                    </Badge>
                  )}
                  {skipped[question.id] && (
                    <Badge variant="secondary" className="text-xs">
                      Skipped
                    </Badge>
                  )}
                  {!answers[question.id] && !skipped[question.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSkipQuestion(question.id)}
                      className="text-xs"
                    >
                      <SkipForward className="w-3 h-3 mr-1" />
                      Not applicable
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onSkip}>
            Skip Entire Section
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
