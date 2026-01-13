// =====================================================
// STEP 3: Candidate Interview
// =====================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { useResumeBuilderV3Store, OptimizedResume } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Lightbulb,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { LoadingSkeletonV3 } from "./LoadingSkeletonV3";
import { useResumeBuilderApi } from "./hooks/useResumeBuilderApi";
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
    setFinalResume,
    setStep,
    setLoading,
    isLoading,
  } = useResumeBuilderV3Store();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [localAnswer, setLocalAnswer] = useState("");
  
  // CRITICAL: All hooks must be called before any conditional returns (React Rules of Hooks)
  const { callApi, isRetrying, currentAttempt, cancel, maxAttempts } = useResumeBuilderApi();
  
  // Debounce timer ref for store updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sync local answer when question changes and clear pending timer
  useEffect(() => {
    // Clear any pending debounce timer when question changes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    const currentQuestion = questions?.questions?.[currentQuestionIndex];
    if (currentQuestion) {
      setLocalAnswer(interviewAnswers[currentQuestion.id] || "");
    }
  }, [currentQuestionIndex, questions?.questions, interviewAnswers]);
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Computed values for empty questions state
  const hasNoQuestions = !questions || !questions.questions || questions.questions.length === 0;

  // Handle empty questions case after all hooks are called
  if (hasNoQuestions) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold">No Interview Questions</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We couldn't generate interview questions. This might happen if your resume already matches the job description well, or there was an issue with the analysis.
        </p>
        <Button variant="outline" onClick={() => setStep(2)}>
          Go Back to Analysis
        </Button>
      </div>
    );
  }

  // Show loading skeleton when generating resume
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

  const currentQuestion = questions.questions[currentQuestionIndex];
  const answeredCount = Object.keys(interviewAnswers).filter(
    (key) => interviewAnswers[key]?.trim().length > 0
  ).length;
  const totalQuestions = questions.questions.length;

  // Count unanswered high-priority questions
  const unansweredHighPriority = questions.questions.filter(
    (q) => q.priority === "high" && !interviewAnswers[q.id]?.trim()
  ).length;

  // Debounced answer handler - updates local state immediately, debounces store update
  const handleAnswerChange = useCallback((answer: string) => {
    setLocalAnswer(answer);
    
    if (currentQuestion) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Debounce store update by 300ms
      debounceTimerRef.current = setTimeout(() => {
        setInterviewAnswer(currentQuestion.id, answer);
      }, 300);
    }
  }, [currentQuestion, setInterviewAnswer]);

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

  // Sanitize interview answers to prevent prompt injection
  const sanitizeAnswer = (answer: string): string => {
    return answer
      .replace(/\[INST\]/gi, '')
      .replace(/\[\/INST\]/gi, '')
      .replace(/<<SYS>>/gi, '')
      .replace(/<\|.*?\|>/gi, '')
      .replace(/```/g, '')
      .trim();
  };

  const handleGenerate = async () => {
    setLoading(true);

    // Sanitize all answers before sending to AI
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
      setStep(4);
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

  const handleSkipConfirm = () => {
    setShowSkipDialog(false);
    handleGenerate();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
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
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Let's Fill the Gaps</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Answer a few questions to help us create the best possible resume for you.
        </p>
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground hidden xs:inline">•</span>
          <span className="text-xs sm:text-sm text-green-600">
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
                  ? "bg-green-500"
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
        <Card>
          <CardHeader className="pb-3 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
              <CardTitle className="text-base sm:text-lg flex items-start gap-2">
                <MessageCircle className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                {currentQuestion.question}
              </CardTitle>
              <div className="flex items-center gap-2 self-start">
                <Badge className={getPriorityColor(currentQuestion.priority)}>
                  {currentQuestion.priority}
                </Badge>
                <HelpTooltip content={HELP_CONTENT.questionPriority} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <div>
                <p className="font-medium">Why we're asking:</p>
                <p>{currentQuestion.purpose}</p>
                <p className="mt-1 text-xs">
                  Addresses: {currentQuestion.gap_addressed}
                </p>
              </div>
            </div>

            {currentQuestion.example_answer && (
              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <p className="font-medium">Example answer:</p>
                <p className="italic">"{currentQuestion.example_answer}"</p>
              </div>
            )}

            <div className="space-y-1">
              <Textarea
                placeholder="Type your answer here... Be specific with numbers and details!"
                value={localAnswer}
                onChange={(e) => {
                  // Enforce character limit
                  if (e.target.value.length <= MAX_ANSWER_LENGTH) {
                    handleAnswerChange(e.target.value);
                  }
                }}
                className="min-h-[120px]"
                maxLength={MAX_ANSWER_LENGTH}
              />
              <div className="flex items-center justify-between text-xs">
                <span className={localAnswer.length > MAX_ANSWER_LENGTH * 0.9 ? "text-amber-600" : "text-muted-foreground"}>
                  {localAnswer.length}/{MAX_ANSWER_LENGTH} characters
                </span>
                {localAnswer.trim() && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="h-3 w-3" />
                    Saved
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
              className="flex-1 xs:flex-none bg-green-600 hover:bg-green-700"
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
            <span className="ml-1 text-amber-600">
              ({unansweredHighPriority} high-priority)
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
