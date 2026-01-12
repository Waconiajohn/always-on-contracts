// =====================================================
// STEP 3: Candidate Interview
// =====================================================

import { useState } from "react";
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

  if (!questions) return null;

  const { callApi, isRetrying, currentAttempt } = useResumeBuilderApi();

  // Show loading skeleton when generating resume
  if (isLoading) {
    return (
      <LoadingSkeletonV3 
        type="generate" 
        message={isRetrying ? `Retrying... (Attempt ${currentAttempt}/3)` : "Crafting your optimized resume based on your answers..."} 
      />
    );
  }

  const currentQuestion = questions.questions[currentQuestionIndex];
  const answeredCount = Object.keys(interviewAnswers).filter(
    (key) => interviewAnswers[key]?.trim().length > 0
  ).length;
  const totalQuestions = questions.questions.length;
  const currentAnswer = interviewAnswers[currentQuestion?.id] || "";

  // Count unanswered high-priority questions
  const unansweredHighPriority = questions.questions.filter(
    (q) => q.priority === "high" && !interviewAnswers[q.id]?.trim()
  ).length;

  const handleAnswerChange = (answer: string) => {
    if (currentQuestion) {
      setInterviewAnswer(currentQuestion.id, answer);
    }
  };

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

    const result = await callApi<OptimizedResume>({
      step: "generate_resume",
      body: {
        resumeText,
        jobDescription,
        fitAnalysis,
        standards,
        interviewAnswers,
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
        <h2 className="text-xl font-semibold mb-2">Let's Fill the Gaps</h2>
        <p className="text-muted-foreground">
          Answer a few questions to help us create the best possible resume for you.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-sm text-muted-foreground">•</span>
          <span className="text-sm text-green-600">
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
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
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
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg flex items-start gap-2">
                <MessageCircle className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                {currentQuestion.question}
              </CardTitle>
              <Badge className={getPriorityColor(currentQuestion.priority)}>
                {currentQuestion.priority} priority
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Textarea
              placeholder="Type your answer here... Be specific with numbers and details!"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="min-h-[120px]"
            />

            {currentAnswer.trim() && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Answer saved
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button onClick={handleNext}>
              Next Question
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Resume...
                </>
              ) : (
                <>
                  Generate Resume
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
          className="text-muted-foreground"
          onClick={handleSkipClick}
          disabled={isLoading}
        >
          Skip remaining questions and generate resume
          {unansweredHighPriority > 0 && (
            <span className="ml-1 text-amber-600">
              ({unansweredHighPriority} high-priority unanswered)
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
