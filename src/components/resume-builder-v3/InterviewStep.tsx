// =====================================================
// STEP 3: Candidate Interview
// =====================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { useResumeBuilderV3Store, OptimizedResume, QuestionsResult } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  MessageCircle,
  Check,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { LoadingSkeletonV3 } from "./LoadingSkeletonV3";
import { useResumeBuilderApi } from "./hooks/useResumeBuilderApi";
import { useInterviewAIAssist } from "./hooks/useInterviewAIAssist";
import { HelpTooltip, HELP_CONTENT } from "./components/HelpTooltip";
import { MAX_ANSWER_LENGTH } from "./constants";

export function InterviewStep() {
  const {
    questions,
    fitAnalysis,
    standards,
    resumeText,
    jobDescription,
    interviewAnswers,
    setInterviewAnswer,
    setQuestions,
    setFinalResume,
    setStep,
    setLoading,
    isLoading,
  } = useResumeBuilderV3Store();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [localAnswer, setLocalAnswer] = useState("");
  
  const { callApi, isRetrying, currentAttempt, cancel, maxAttempts } = useResumeBuilderApi();
  const { generateAnswer, isGenerating } = useInterviewAIAssist();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    const currentQuestion = questions?.questions?.[currentQuestionIndex];
    if (currentQuestion) {
      setLocalAnswer(interviewAnswers[currentQuestion.id] || "");
    }
  }, [currentQuestionIndex, questions?.questions, interviewAnswers]);
  
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasNoQuestions = !questions || !questions.questions || questions.questions.length === 0;
  const questionsList = questions?.questions || [];
  const currentQuestion = questionsList[currentQuestionIndex];
  const totalQuestions = questionsList.length;
  
  const validQuestionIds = new Set(questionsList.map(q => q.id));
  const answeredCount = Object.keys(interviewAnswers).filter(
    (key) => validQuestionIds.has(key) && interviewAnswers[key]?.trim().length > 0
  ).length;

  const unansweredHighPriority = questionsList.filter(
    (q) => q.priority === "high" && !interviewAnswers[q.id]?.trim()
  ).length;

  const handleAnswerChange = useCallback((answer: string) => {
    setLocalAnswer(answer);
    
    if (currentQuestion) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        setInterviewAnswer(currentQuestion.id, answer);
      }, 300);
    }
  }, [currentQuestion, setInterviewAnswer]);

  const sanitizeAnswer = useCallback((answer: string): string => {
    return answer
      .replace(/\[INST\]/gi, '')
      .replace(/\[\/INST\]/gi, '')
      .replace(/<<SYS>>/gi, '')
      .replace(/<\|.*?\|>/gi, '')
      .replace(/```/g, '')
      .trim();
  }, []);

  const handleRegenerateQuestions = useCallback(async () => {
    setLoading(true);
    const result = await callApi<QuestionsResult>({
      step: "questions",
      body: { resumeText, jobDescription, fitAnalysis, standards },
      successMessage: "Questions generated!",
    });
    if (result) {
      setQuestions(result);
    }
    setLoading(false);
  }, [callApi, resumeText, jobDescription, fitAnalysis, standards, setQuestions, setLoading]);

  if (hasNoQuestions) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Questions Not Loaded</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The interview questions weren't loaded properly. This can happen if your session was interrupted. Let's regenerate them.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setStep(1)}>
            Go Back
          </Button>
          <Button onClick={handleRegenerateQuestions} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              "Regenerate Questions"
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Generating your optimized resume">
        <LoadingSkeletonV3 
          type="generate" 
          message={isRetrying ? `Retrying... (Attempt ${currentAttempt}/${maxAttempts})` : "Crafting your optimized resume based on your answers..."} 
          onCancel={() => {
            cancel();
            setLoading(false);
          }}
        />
      </div>
    );
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);

    const sanitizedAnswers = Object.fromEntries(
      Object.entries(interviewAnswers).map(([key, value]) => [key, sanitizeAnswer(value)])
    );

    const result = await callApi<OptimizedResume>({
      step: "generate_resume",
      body: {
        resumeText,
        jobDescription,
        fitAnalysis,
        standards,
        interviewAnswers: sanitizedAnswers,
      },
      successMessage: "Resume generated!",
    });

    if (result) {
      setFinalResume(result);
      setStep(3);
    }
    
    setLoading(false);
  };

  const handleSkipClick = () => {
    if (unansweredHighPriority > 0) {
      setShowSkipDialog(true);
    } else {
      handleGenerate();
    }
  };

  const handleAIAssist = async () => {
    if (!currentQuestion) return;
    
    const result = await generateAnswer({
      question: currentQuestion.question,
      purpose: currentQuestion.purpose,
      gapAddressed: currentQuestion.gap_addressed,
      resumeText,
      jobDescription,
    });

    if (result?.suggestedAnswer) {
      // If there's existing text, append; otherwise replace
      const newAnswer = localAnswer.trim() 
        ? `${localAnswer}\n\n${result.suggestedAnswer}`
        : result.suggestedAnswer;
      
      // Truncate if too long
      const truncated = newAnswer.slice(0, MAX_ANSWER_LENGTH);
      handleAnswerChange(truncated);
    }
  };

  const handleSkipConfirm = () => {
    setShowSkipDialog(false);
    handleGenerate();
  };

  return (
    <div className="space-y-8">
      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Skip Remaining Questions?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have <strong>{unansweredHighPriority} high-priority question{unansweredHighPriority !== 1 ? 's' : ''}</strong> unanswered. 
              These questions help address key gaps in your resume. Skipping them may result in a less optimized resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back to Questions</AlertDialogCancel>
            <AlertDialogAction onClick={handleSkipConfirm}>
              Generate Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Let's Fill the Gaps</h2>
        <p className="text-muted-foreground">
          Answer a few questions to help us create the best possible resume for you.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-primary">
            {answeredCount}/{totalQuestions} answered
          </span>
        </div>
      </div>

      {/* Question navigation dots */}
      <div className="flex justify-center gap-2" role="navigation" aria-label="Question navigation">
        {questions.questions.map((q, index) => {
          const isAnswered = !!interviewAnswers[q.id]?.trim();
          const isCurrent = index === currentQuestionIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`h-2.5 w-2.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isCurrent
                  ? "bg-primary"
                  : isAnswered
                  ? "bg-primary/50"
                  : "bg-muted-foreground/30"
              }`}
              aria-label={`Question ${index + 1}${isAnswered ? ' (answered)' : ''}${isCurrent ? ' (current)' : ''}`}
              aria-current={isCurrent ? "step" : undefined}
            />
          );
        })}
      </div>

      {/* Current question */}
      {currentQuestion && (
        <div className="border border-border rounded-lg">
          {/* Question header */}
          <div className="p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">{currentQuestion.question}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground capitalize">
                      {currentQuestion.priority} priority
                    </span>
                    <HelpTooltip content={HELP_CONTENT.questionPriority} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purpose and example */}
          <div className="p-4 sm:p-6 space-y-4 bg-muted/30">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Why we're asking:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.purpose}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Addresses: {currentQuestion.gap_addressed}
              </p>
            </div>

            {currentQuestion.example_answer && (
              <div className="space-y-1 pt-2 border-t border-border/50">
                <p className="text-sm font-medium text-foreground">Example answer:</p>
                <p className="text-sm text-muted-foreground italic">"{currentQuestion.example_answer}"</p>
              </div>
            )}
          </div>

          {/* AI Assist Button */}
          <div className="px-4 sm:px-6 py-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIAssist}
              disabled={isGenerating || !resumeText}
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating suggestion...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Help me answer
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-1.5">
              Generate a draft based on your resume
            </p>
          </div>

          {/* Answer input */}
          <div className="p-4 sm:p-6 space-y-2">
            <Textarea
              placeholder="Type your answer here... Be specific with numbers and details!"
              value={localAnswer}
              onChange={(e) => {
                if (e.target.value.length <= MAX_ANSWER_LENGTH) {
                  handleAnswerChange(e.target.value);
                }
              }}
              className="min-h-[120px] border-border"
              maxLength={MAX_ANSWER_LENGTH}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={localAnswer.length > MAX_ANSWER_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"}>
                {localAnswer.length}/{MAX_ANSWER_LENGTH} characters
              </span>
              {localAnswer.trim() && (
                <div className="flex items-center gap-1 text-primary">
                  <Check className="h-3 w-3" />
                  Saved
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="order-2 xs:order-1"
        >
          Previous
        </Button>

        <div className="flex gap-2 order-1 xs:order-2">
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button onClick={handleNext} className="flex-1 xs:flex-none">
              Next Question
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1 xs:flex-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden xs:inline">Generating...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : (
                <>
                  <span className="hidden xs:inline">Generate Resume</span>
                  <span className="xs:hidden">Generate</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Skip option */}
      <div className="text-center">
        <Button
          variant="link"
          className="text-muted-foreground text-xs sm:text-sm"
          onClick={handleSkipClick}
          disabled={isLoading}
        >
          <span className="hidden sm:inline">Skip remaining questions and generate resume</span>
          <span className="sm:hidden">Skip & generate</span>
          {unansweredHighPriority > 0 && (
            <span className="ml-1 text-muted-foreground">
              ({unansweredHighPriority} high-priority)
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
