import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Phase4Props {
  vaultId: string;
  onProgress: (progress: number) => void;
  onTimeEstimate: (estimate: string) => void;
  onComplete: () => void;
}

interface Gap {
  id: string;
  gap_id: string;
  gap_type: string | null;
  gap_description: string | null;
  status: string | null;
  questions_generated: any;
  questions_answered: number | null;
  total_questions: number | null;
}

export const Phase4_GapFillingInterview = ({
  vaultId,
  onProgress,
  onTimeEstimate,
  onComplete
}: Phase4Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [currentGapIndex, setCurrentGapIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);

  useEffect(() => {
    loadGaps();
  }, [vaultId]);

  const loadGaps = async () => {
    setIsLoading(true);
    onProgress(10);

    try {
      const { data: gapsData, error } = await supabase
        .from('vault_gap_progress')
        .select('*')
        .eq('vault_id', vaultId)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      setGaps(gapsData || []);
      onProgress(100);
      
      const totalQuestions = (gapsData || []).reduce((sum, gap) => 
        sum + (gap.total_questions || 0), 0
      );
      onTimeEstimate(`~${Math.ceil(totalQuestions * 1.5)} minutes to complete`);
    } catch (error) {
      console.error('Error loading gaps:', error);
      toast.error('Failed to load interview questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIEnhance = async () => {
    if (!answer.trim()) return;
    
    setIsProcessingAnswer(true);
    try {
      const currentGap = gaps[currentGapIndex];
      const currentQuestion = currentGap.questions_generated[currentQuestionIndex];

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          mode: 'improve',
          originalText: answer,
          context: {
            question: currentQuestion.question,
            gapType: currentGap.gap_type,
            requirement: currentGap.gap_description
          }
        }
      });

      if (error) throw error;
      
      if (data?.suggestion) {
        setAnswer(data.suggestion.text);
        toast.success('Answer enhanced by AI');
      }
    } catch (error) {
      console.error('Error enhancing answer:', error);
      toast.error('Failed to enhance answer');
    } finally {
      setIsProcessingAnswer(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setIsProcessingAnswer(true);
    try {
      const currentGap = gaps[currentGapIndex];
      
      // Update questions_answered count
      const { error: updateError } = await supabase
        .from('vault_gap_progress')
        .update({
          questions_answered: (currentGap.questions_answered || 0) + 1,
          status: (currentGap.questions_answered || 0) + 1 >= (currentGap.total_questions || 0)
            ? 'resolved' 
            : 'in_progress'
        })
        .eq('id', currentGap.id);

      if (updateError) throw updateError;

      // Move to next question or gap
      if (currentQuestionIndex + 1 < currentGap.questions_generated.length) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setAnswer("");
      } else if (currentGapIndex + 1 < gaps.length) {
        setCurrentGapIndex(currentGapIndex + 1);
        setCurrentQuestionIndex(0);
        setAnswer("");
      } else {
        // All questions answered
        onComplete();
        return;
      }

      // Update progress
      const totalAnswered = gaps.reduce((sum, gap, idx) => {
        if (idx < currentGapIndex) return sum + (gap.total_questions || 0);
        if (idx === currentGapIndex) return sum + currentQuestionIndex + 1;
        return sum;
      }, 0);
      
      const totalQuestions = gaps.reduce((sum, gap) => sum + (gap.total_questions || 0), 0);
      onProgress((totalAnswered / totalQuestions) * 100);

      toast.success('Answer saved');
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to save answer');
    } finally {
      setIsProcessingAnswer(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading interview questions...</p>
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-lg font-semibold">No gaps to address!</p>
        <p className="text-muted-foreground">Your profile is market-ready</p>
        <Button onClick={onComplete} size="lg">
          Continue to Library
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  const currentGap = gaps[currentGapIndex];
  const currentQuestion = currentGap.questions_generated?.[currentQuestionIndex];
  const totalAnswered = gaps.reduce((sum, gap, idx) => {
    if (idx < currentGapIndex) return sum + (gap.total_questions || 0);
    if (idx === currentGapIndex) return sum + currentQuestionIndex;
    return sum;
  }, 0);
  const totalQuestions = gaps.reduce((sum, gap) => sum + (gap.total_questions || 0), 0);
  const progressPercentage = (totalAnswered / totalQuestions) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Gap-Filling Interview</h2>
        <p className="text-lg text-muted-foreground">
          Answer these questions to unlock your hidden strengths
        </p>
      </div>

      {/* Progress */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {totalAnswered + 1} of {totalQuestions}
          </span>
          <span className="font-semibold">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </Card>

      {/* Current Gap */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{currentGap.gap_type}</Badge>
          <p className="text-sm text-muted-foreground">{currentGap.gap_description}</p>
        </div>
      </Card>

      {/* Question */}
      <Card className="p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">{currentQuestion.question}</h3>
          {currentQuestion.hint && (
            <p className="text-sm text-muted-foreground">{currentQuestion.hint}</p>
          )}
        </div>

        {/* Answer Input */}
        <div className="space-y-4">
          <Textarea
            placeholder="Share your experience here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={6}
            className="resize-none"
          />

          {/* AI Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIEnhance}
              disabled={!answer.trim() || isProcessingAnswer}
            >
              {isProcessingAnswer ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Enhance with AI
            </Button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitAnswer}
            disabled={!answer.trim() || isProcessingAnswer}
            size="lg"
          >
            {currentQuestionIndex + 1 < currentGap.questions_generated.length ||
            currentGapIndex + 1 < gaps.length
              ? 'Next Question'
              : 'Complete Interview'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Question Counter for Current Gap */}
      <div className="text-center text-sm text-muted-foreground">
        Gap {currentGapIndex + 1} of {gaps.length} • Question{' '}
        {currentQuestionIndex + 1} of {currentGap.questions_generated.length}
      </div>
    </div>
  );
};
