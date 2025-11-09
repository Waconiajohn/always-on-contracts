import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Info, ChevronDown, AlertCircle, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
// PreFilledQuestion component removed
import { VoiceInput } from "@/components/VoiceInput";

interface InterviewPhase {
  phase: string;
  title: string;
  description: string;
  questions: string[];
  currentQuestionIndex: number;
}

interface InterviewStepProps {
  interviewPhase: InterviewPhase;
  completionPercentage: number;
  aiTyping: boolean;
  currentQuestionData: any;
  currentSubQuestion: number;
  currentResponse: string;
  validationFeedback: any;
  isValidating: boolean;
  isRecording: boolean;
  onResponseChange: (text: string) => void;
  onSubmitResponse: () => void;
  onAcceptAnswer: () => void;
  onNextSubQuestion: () => void;
  onSkip: () => void;
  onVoiceTranscript: (text: string) => void;
  onToggleRecording: () => void;
}

export const InterviewStep = ({
  interviewPhase,
  completionPercentage,
  aiTyping,
  currentQuestionData,
  currentSubQuestion,
  currentResponse,
  validationFeedback,
  isValidating,
  isRecording,
  onResponseChange,
  onSubmitResponse,
  onAcceptAnswer,
  onNextSubQuestion,
  onSkip,
  onVoiceTranscript,
  onToggleRecording,
}: InterviewStepProps) => {
  const parseQuestion = (questionText: string) => {
    const contextMatch = questionText.match(/\*\*CONTEXT:\*\*([\s\S]*?)(?=\*\*PLEASE SHARE:\*\*|$)/);
    const shareMatch = questionText.match(/\*\*PLEASE SHARE:\*\*([\s\S]*?)(?=\*\*EXAMPLE|$)/);
    const exampleMatch = questionText.match(/\*\*EXAMPLE[^:]*:\*\*([\s\S]*?)$/);

    return {
      context: contextMatch?.[1]?.trim() || '',
      sharePoints: shareMatch?.[1]?.trim().split(/\n[-•]\s*/).filter(Boolean) || [],
      example: exampleMatch?.[1]?.trim() || '',
      fullText: questionText
    };
  };

  return (
    <Card className="p-8 animate-fade-in">
      <div className="mb-6">
        <Badge className="mb-2">{interviewPhase.title}</Badge>
        <h2 className="text-2xl font-semibold mb-2">{interviewPhase.description}</h2>
        <p className="text-muted-foreground text-sm">
          Question {Math.floor((completionPercentage / 100) * 25) + 1} of 25
        </p>
      </div>

      {aiTyping ? (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg mb-4 animate-pulse">
          <div>Assistant is typing...</div>
        </div>
      ) : (
        <>
          {/* Help Section */}
          <Collapsible className="mb-4">
            <Card className="p-4 bg-primary/10 border-primary/20">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  <span className="font-medium">How to Answer Well</span>
                </div>
                <ChevronDown className="w-4 h-4 text-primary" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 text-sm text-muted-foreground space-y-2">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Be specific with numbers and metrics (dollars, percentages, team sizes)</li>
                  <li>Include timeframes (months, years, quarters)</li>
                  <li>Name tools, technologies, and methodologies</li>
                  <li>Focus on YOUR contribution, not just team achievements</li>
                  <li>Think "what impact did I create?" not "what did I do?"</li>
                </ul>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Question Display */}
          {currentQuestionData?.context && currentQuestionData?.questionsToExpand ? (
            <div className="mb-6">
            <Card className="p-6 mb-6 bg-card border-2">
              <div className="space-y-4">
                {currentQuestionData?.context && (
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong>Context:</strong> {currentQuestionData.context}
                  </div>
                )}
                <div className="space-y-2">
                  <Badge variant="outline" className="mb-2">
                    Question {currentSubQuestion + 1} of {currentQuestionData?.questionsToExpand?.length || 1}
                  </Badge>
                  <p className="text-lg font-medium">
                    {currentQuestionData?.questionsToExpand?.[currentSubQuestion] || 'Loading question...'}
                  </p>
                </div>
                {currentQuestionData?.exampleAnswer && (
                  <Alert className="bg-muted/50">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Example:</strong> {currentQuestionData.exampleAnswer}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
            </div>
          ) : (
            <>
              {(() => {
                const parsed = parseQuestion(interviewPhase.questions[0]);
                return (
                  <div className="space-y-4 mb-6">
                    {parsed.context && (
                      <div className="flex gap-3 items-start p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-1">Why I'm asking this:</p>
                          <p className="text-muted-foreground">{parsed.context}</p>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-muted rounded-lg border">
                      <p className="font-semibold mb-3">Please share:</p>
                      {parsed.sharePoints.length > 0 ? (
                        <ul className="space-y-2">
                          {parsed.sharePoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>{parsed.fullText}</p>
                      )}
                    </div>

                    {parsed.example && (
                      <div className="p-4 bg-success/10 border-l-4 border-success rounded">
                        <div className="flex items-start gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-success flex-shrink-0" />
                          <p className="font-medium">Example of a strong answer:</p>
                        </div>
                        <p className="text-muted-foreground italic">{parsed.example}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          {/* Validation Feedback */}
          {validationFeedback && !validationFeedback.is_sufficient && (
            <Card className="p-4 mb-4 bg-warning/10 border-warning/20 animate-scale-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium mb-2">Your answer could be stronger</p>
                  <p className="text-sm text-muted-foreground mb-3">{validationFeedback.follow_up_prompt}</p>
                  {validationFeedback.missing_elements?.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Missing:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationFeedback.missing_elements.map((elem: string, idx: number) => (
                          <li key={idx}>{elem}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {validationFeedback && validationFeedback.is_sufficient && (
            <Card className="p-4 mb-4 bg-success/10 border-success/20 animate-scale-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <p>Great answer! Quality score: {validationFeedback.quality_score}/100</p>
              </div>
            </Card>
          )}

          {/* Answer Input */}
          <div className="flex items-start gap-3 mb-4">
            <Textarea
              value={currentResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              placeholder={
                currentQuestionData?.questionsToExpand?.[currentSubQuestion]?.placeholder || 
                "Share your experience here... Be specific with numbers, dates, and technologies."
              }
              className="min-h-[120px] flex-1"
              disabled={isValidating || isRecording}
            />
            <VoiceInput
              onTranscript={onVoiceTranscript}
              isRecording={isRecording}
              onToggleRecording={onToggleRecording}
              disabled={isValidating}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {validationFeedback && !validationFeedback.is_sufficient ? (
              <>
                <Button onClick={onSubmitResponse} size="lg" className="flex-1" disabled={isValidating}>
                  {isValidating ? "Validating..." : "Improve Answer"}
                </Button>
                <Button onClick={onAcceptAnswer} variant="outline" size="lg">
                  Submit Anyway
                </Button>
              </>
            ) : currentQuestionData?.questionsToExpand && 
               currentSubQuestion < currentQuestionData.questionsToExpand.length - 1 ? (
              <Button
                onClick={onNextSubQuestion}
                disabled={!currentResponse.trim() || isValidating}
                size="lg"
                className="flex-1"
              >
                Next Question
                <ArrowRight className="w-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button onClick={onSubmitResponse} size="lg" className="flex-1" disabled={isValidating}>
                  {isValidating ? "Validating..." : "Submit Answer"}
                </Button>
                <Button variant="outline" onClick={onSkip}>
                  Skip
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </Card>
  );
};
