// =====================================================
// STEP 3: Candidate Interview
// =====================================================

import { useState } from "react";
import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  MessageCircle,
  Lightbulb,
  Check,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  if (!questions) return null;

  const currentQuestion = questions.questions[currentQuestionIndex];
  const answeredCount = Object.keys(interviewAnswers).length;
  const totalQuestions = questions.questions.length;
  const currentAnswer = interviewAnswers[currentQuestion?.id] || "";

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

    try {
      const { data, error } = await supabase.functions.invoke("resume-builder-v3", {
        body: {
          step: "generate_resume",
          resumeText,
          jobDescription,
          fitAnalysis,
          standards,
          interviewAnswers,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Resume generation failed");

      setFinalResume(data.data);
      setStep(4);
      toast.success("Resume generated!");
    } catch (error) {
      console.error("Generate error:", error);
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
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
            {answeredCount} answered
          </span>
        </div>
      </div>

      {/* Question navigation dots */}
      <div className="flex justify-center gap-2">
        {questions.questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              index === currentQuestionIndex
                ? "bg-primary"
                : interviewAnswers[q.id]
                ? "bg-green-500"
                : "bg-muted-foreground/30"
            }`}
            title={`Question ${index + 1}`}
          />
        ))}
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

            {currentAnswer && (
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
          onClick={handleGenerate}
          disabled={isLoading}
        >
          Skip remaining questions and generate resume
        </Button>
      </div>
    </div>
  );
}
