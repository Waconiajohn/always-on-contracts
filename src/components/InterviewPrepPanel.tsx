import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  GenerateInterviewQuestionSchema, 
  ValidateInterviewResponseSchema,
  safeValidateInput,
  invokeEdgeFunction 
} from '@/lib/edgeFunction';

interface InterviewPrepPanelProps {
  jobDescription?: string;
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
}

interface ValidationResult {
  isStrong: boolean;
  overallScore: number;
  recommendations: string[];
  verifiedClaims: string[];
  unverifiedStatements: string[];
}

export const InterviewPrepPanel = ({ jobDescription }: InterviewPrepPanelProps) => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateQuestions();
  }, [jobDescription]);

  const generateQuestions = async () => {
    if (!jobDescription) return;
    
    setIsGenerating(true);
    try {
      const validation = safeValidateInput(GenerateInterviewQuestionSchema, {
        jobDescription,
        count: 5,
        includeSTAR: true
      });

      if (!validation.success) {
        setIsGenerating(false);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'generate-interview-question',
        validation.data
      );

      if (error) return;

      if (data.questions) {
        setQuestions(data.questions);
        setCurrentQuestionIndex(0);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const validateAnswer = async () => {
    if (!answer.trim() || !questions[currentQuestionIndex]) return;

    setIsValidating(true);
    try {
      const validation = safeValidateInput(ValidateInterviewResponseSchema, {
        question: questions[currentQuestionIndex].question,
        response: answer,
        context: undefined
      });

      if (!validation.success) {
        setIsValidating(false);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'validate-interview-response',
        validation.data
      );

      if (error) return;

      setValidationResult({
        isStrong: data.isStrong,
        overallScore: data.overallScore || 0,
        recommendations: data.recommendations || [],
        verifiedClaims: data.verifiedClaims || [],
        unverifiedStatements: data.unverifiedStatements || []
      });

      toast({
        title: data.isStrong ? "Strong Answer!" : "Needs Improvement",
        description: data.isStrong 
          ? "Great job! Your answer demonstrates solid STAR methodology."
          : "Review the recommendations to strengthen your response.",
        variant: data.isStrong ? "default" : "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswer("");
      setValidationResult(null);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating personalized interview questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!jobDescription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Prep</CardTitle>
          <CardDescription>Add a job description to generate personalized interview questions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Interview Question Practice</CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {questions.length}
              </CardDescription>
            </div>
            {currentQuestion && (
              <div className="flex gap-2">
                <Badge variant="outline">{currentQuestion.category}</Badge>
                <Badge variant={currentQuestion.difficulty === 'hard' ? 'destructive' : 'secondary'}>
                  {currentQuestion.difficulty}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion && (
            <>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium text-lg">{currentQuestion.question}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Answer (use STAR method)</label>
                <Textarea
                  placeholder="Situation: Describe the context...&#10;Task: Explain your responsibility...&#10;Action: Detail what you did...&#10;Result: Share the outcome..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={validateAnswer} 
                  disabled={!answer.trim() || isValidating}
                  className="flex-1"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Validate Answer
                    </>
                  )}
                </Button>
                {currentQuestionIndex < questions.length - 1 && (
                  <Button onClick={handleNextQuestion} variant="outline">
                    Next Question →
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {validationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {validationResult.isStrong ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-500" />
              )}
              <CardTitle>
                Analysis Score: {validationResult.overallScore}/100
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">💡 Recommendations</h4>
                <ul className="space-y-2">
                  {validationResult.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                      <span>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.verifiedClaims.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-green-600">✓ Verified Strengths</h4>
                <ul className="space-y-1">
                  {validationResult.verifiedClaims.map((claim, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">• {claim}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.unverifiedStatements.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-yellow-600">⚠ Needs Evidence</h4>
                <ul className="space-y-1">
                  {validationResult.unverifiedStatements.map((stmt, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">• {stmt}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
