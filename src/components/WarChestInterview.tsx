import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VoiceInput } from './VoiceInput';
import { PreFilledQuestion } from './PreFilledQuestion';

interface KnownDataItem {
  label: string;
  value: string | string[];
  source: 'resume' | 'previous_answer';
}

interface QuestionToExpand {
  prompt: string;
  placeholder: string;
  hint?: string;
}

interface QuestionData {
  context: string;
  knownData: KnownDataItem[];
  questionsToExpand: QuestionToExpand[];
  exampleAnswer: string;
}

interface InterviewResponse {
  question: QuestionData;
  phase: string;
  completionPercentage: number;
  isComplete: boolean;
}

interface ValidationResult {
  is_sufficient: boolean;
  quality_score: number;
  missing_elements: string[];
  follow_up_prompt: string;
  strengths: string[];
}

interface WarChestInterviewProps {
  onComplete: () => void;
}

export const WarChestInterview = ({ onComplete }: WarChestInterviewProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [currentSubQuestionIndex, setCurrentSubQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('discovery');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [warChestId, setWarChestId] = useState<string>('');
  const [intelligenceExtracted, setIntelligenceExtracted] = useState({
    powerPhrases: 0,
    transferableSkills: 0,
    hiddenCompetencies: 0
  });
  const { toast } = useToast();

  const phaseLabels: Record<string, string> = {
    discovery: '🔍 Discovery',
    deep_dive: '🎯 Deep Dive', 
    skills: '⚡ Skills & Strengths',
    future: '🚀 Future Goals'
  };

  useEffect(() => {
    startInterview();
  }, []);

  const startInterview = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get war chest ID
      const { data: warChest } = await supabase
        .from('career_war_chest')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (warChest) {
        setWarChestId(warChest.id);
      }

      const { data, error } = await supabase.functions.invoke('generate-interview-question', {
        body: { phase: 'discovery', isFirst: true }
      });

      if (error) throw error;

      if (data?.question) {
        setCurrentQuestion(data.question);
        setCurrentPhase(data.phase || 'discovery');
        setCompletionPercentage(data.completionPercentage || 0);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to start interview. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim() || isLoading || !currentQuestion) return;

    const currentSubQuestion = currentQuestion.questionsToExpand[currentSubQuestionIndex];
    
    setIsValidating(true);
    setValidationFeedback('');

    try {
      // Step 1: Validate response quality
      const { data: validation, error: validationError } = await supabase.functions.invoke(
        'validate-interview-response',
        {
          body: {
            question: currentSubQuestion.prompt,
            answer: userInput
          }
        }
      ) as { data: ValidationResult; error: any };

      if (validationError) throw validationError;

      setQualityScore(validation.quality_score);

      // If response is insufficient, show feedback and don't proceed
      if (!validation.is_sufficient) {
        setValidationFeedback(validation.follow_up_prompt);
        toast({
          title: 'Let\'s add more detail',
          description: 'Your response is good, but could be stronger with more specifics.',
          variant: 'default'
        });
        setIsValidating(false);
        return;
      }

      // Step 2: Extract intelligence in real-time
      if (warChestId) {
        const { data: extracted } = await supabase.functions.invoke(
          'extract-war-chest-intelligence',
          {
            body: {
              responseText: userInput,
              questionText: currentSubQuestion.prompt,
              warChestId
            }
          }
        );

        if (extracted?.extracted) {
          const newExtracted = {
            powerPhrases: intelligenceExtracted.powerPhrases + (extracted.extracted.powerPhrases || 0),
            transferableSkills: intelligenceExtracted.transferableSkills + (extracted.extracted.transferableSkills || 0),
            hiddenCompetencies: intelligenceExtracted.hiddenCompetencies + (extracted.extracted.hiddenCompetencies || 0)
          };
          setIntelligenceExtracted(newExtracted);

          if (extracted.extracted.powerPhrases > 0 || extracted.extracted.transferableSkills > 0) {
            toast({
              title: '✨ Intelligence Extracted',
              description: `Found ${extracted.extracted.powerPhrases} power phrases, ${extracted.extracted.transferableSkills} skills`,
            });
          }
        }
      }

      // Step 3: Check if we need to move to next sub-question or next main question
      if (currentSubQuestionIndex < currentQuestion.questionsToExpand.length - 1) {
        // Move to next sub-question
        setCurrentSubQuestionIndex(currentSubQuestionIndex + 1);
        setUserInput('');
        setValidationFeedback('');
        setIsValidating(false);
        return;
      }

      // All sub-questions answered, get next main question
      setIsLoading(true);
      setCurrentSubQuestionIndex(0);

      const { data, error } = await supabase.functions.invoke('generate-interview-question', {
        body: {
          phase: currentPhase,
          previousResponse: userInput,
        }
      });

      if (error) throw error;

      if (data?.isComplete) {
        setCompletionPercentage(100);
        toast({
          title: '🎉 Interview Complete!',
          description: 'Your War Chest has been built with rich career intelligence.'
        });
        setTimeout(onComplete, 2000);
        return;
      }

      if (data?.question) {
        setCurrentQuestion(data.question);
        setCurrentPhase(data.phase);
        setCompletionPercentage(data.completionPercentage);
        setUserInput('');
        setValidationFeedback('');
      }

    } catch (error) {
      console.error('Error processing response:', error);
      toast({
        title: 'Error',
        description: 'Failed to process response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setUserInput(prev => prev + ' ' + transcript);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  if (!currentQuestion) {
    return (
      <Card className="p-6 flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  const totalQuestions = currentQuestion.questionsToExpand.length;
  const currentQuestionNum = currentSubQuestionIndex + 1;

  return (
    <div className="space-y-4">
      {/* Header with phase and progress */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-base py-2 px-4">
          {phaseLabels[currentPhase] || 'In Progress'}
        </Badge>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            {completionPercentage}% Complete
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Question {currentQuestionNum} of {totalQuestions}
          </div>
        </div>
      </div>

      <Progress value={completionPercentage} className="h-2" />

      {/* Intelligence counter */}
      {(intelligenceExtracted.powerPhrases > 0 || intelligenceExtracted.transferableSkills > 0) && (
        <Alert className="bg-primary/5 border-primary/20">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {intelligenceExtracted.powerPhrases} Power Phrases
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {intelligenceExtracted.transferableSkills} Skills
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {intelligenceExtracted.hiddenCompetencies} Competencies
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Question display */}
      <Card className="p-6">
        <PreFilledQuestion
          context={currentQuestion.context}
          knownData={currentQuestion.knownData}
          singleQuestion={currentQuestion.questionsToExpand[currentSubQuestionIndex]}
          exampleAnswer={currentQuestion.exampleAnswer}
          questionNumber={currentQuestionNum}
          totalQuestions={totalQuestions}
        />

        {/* Validation feedback */}
        {validationFeedback && (
          <Alert className="mt-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertDescription className="text-sm">
              💡 {validationFeedback}
            </AlertDescription>
          </Alert>
        )}

        {/* Quality score */}
        {qualityScore > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Response quality: {qualityScore}/100
          </div>
        )}

        {/* Input area */}
        <div className="mt-6 space-y-3">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={currentQuestion.questionsToExpand[currentSubQuestionIndex].placeholder}
            className="min-h-[120px] resize-none"
            disabled={isLoading || isValidating}
          />

          <div className="flex gap-2 justify-end">
            <VoiceInput
              onTranscript={handleVoiceInput}
              isRecording={isRecording}
              onToggleRecording={toggleRecording}
              disabled={isLoading || isValidating}
            />
            <Button
              onClick={handleSubmit}
              disabled={!userInput.trim() || isLoading || isValidating}
              className="gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {currentSubQuestionIndex < totalQuestions - 1 ? 'Next' : 'Continue'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
