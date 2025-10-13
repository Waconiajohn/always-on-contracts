import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Milestone {
  id: string;
  milestone_type: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string;
  questions_asked: number;
  questions_answered: number;
  intelligence_extracted: number;
}

interface QuestionQueueItem {
  milestoneId: string;
  milestoneContext: {
    jobTitle: string;
    company: string;
    dates: string;
  };
  questionNumber: number;
  totalForMilestone: number;
}

interface LinearCareerVaultInterviewProps {
  userId: string;
  milestones: Milestone[];
  onComplete: () => void;
  onMilestoneUpdate: () => void;
}

export const LinearCareerVaultInterview = ({
  userId,
  milestones,
  onComplete,
  onMilestoneUpdate
}: LinearCareerVaultInterviewProps) => {
  const [questionQueue, setQuestionQueue] = useState<QuestionQueueItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalIntelligence, setTotalIntelligence] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const { toast } = useToast();

  // Build question queue on mount
  useEffect(() => {
    const buildQueue = () => {
      const queue: QuestionQueueItem[] = [];
      milestones.forEach((milestone) => {
        for (let i = 0; i < milestone.questions_asked; i++) {
          queue.push({
            milestoneId: milestone.id,
            milestoneContext: {
              jobTitle: milestone.job_title,
              company: milestone.company_name,
              dates: `${milestone.start_date} - ${milestone.end_date}`
            },
            questionNumber: i + 1,
            totalForMilestone: milestone.questions_asked
          });
        }
      });
      setQuestionQueue(queue);
      
      // Calculate initial completed questions
      const completed = milestones.reduce((sum, m) => sum + (m.questions_answered || 0), 0);
      setCompletedQuestions(completed);
      
      // Calculate initial intelligence
      const intelligence = milestones.reduce((sum, m) => sum + (m.intelligence_extracted || 0), 0);
      setTotalIntelligence(intelligence);
      
      // Resume from last unanswered question
      setCurrentQuestionIndex(completed);
    };

    if (milestones.length > 0) {
      buildQueue();
    }
  }, [milestones]);

  // Fetch current question when index changes
  useEffect(() => {
    if (questionQueue.length > 0 && currentQuestionIndex < questionQueue.length) {
      fetchQuestion();
    } else if (currentQuestionIndex >= questionQueue.length && questionQueue.length > 0) {
      // All questions completed
      handleComplete();
    }
  }, [currentQuestionIndex, questionQueue]);

  const fetchQuestion = async () => {
    const queueItem = questionQueue[currentQuestionIndex];
    if (!queueItem) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-interview-question', {
        body: {
          userId,
          milestoneId: queueItem.milestoneId,
          phase: 'foundation',
          conversationHistory: []
        }
      });

      if (error) throw error;
      
      setCurrentQuestion(data);
      setUserInput('');
    } catch (error) {
      console.error('Error fetching question:', error);
      toast({
        title: 'Error',
        description: 'Failed to load question',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim() || !currentQuestion) return;

    const queueItem = questionQueue[currentQuestionIndex];
    setIsLoading(true);

    try {
      // Get vault_id for the response
      const { data: vaultData } = await supabase
        .from('career_vault')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vaultData) throw new Error('Vault not found');

      // Extract question text safely
      const questionText = typeof currentQuestion.question === 'string'
        ? currentQuestion.question
        : currentQuestion.question?.questionsToExpand?.[0]?.prompt || 
          currentQuestion.question?.prompt || 
          'Career vault question';

      // Save response
      await supabase
        .from('vault_interview_responses')
        .insert({
          question: questionText,
          response: userInput.trim(),
          phase: 'foundation',
          milestone_id: queueItem.milestoneId,
          vault_id: vaultData.id,
          user_id: userId
        });

      // Extract intelligence
      const { data: extracted } = await supabase.functions.invoke('extract-vault-intelligence', {
        body: {
          userId,
          questionText,
          responseText: userInput.trim()
        }
      });

      // Update milestone progress
      const { data: milestone } = await supabase
        .from('vault_resume_milestones')
        .select('questions_asked, questions_answered, intelligence_extracted')
        .eq('id', queueItem.milestoneId)
        .single();

      if (milestone && milestone.questions_asked) {
        const newAnswered = (milestone.questions_answered || 0) + 1;
        const newCompletion = Math.round((newAnswered / milestone.questions_asked) * 100);
        const extractedCount = extracted?.extracted ? 
          (extracted.extracted.powerPhrases || 0) +
          (extracted.extracted.transferableSkills || 0) +
          (extracted.extracted.hiddenCompetencies || 0) : 0;

        await supabase
          .from('vault_resume_milestones')
          .update({
            questions_answered: newAnswered,
            completion_percentage: newCompletion,
            intelligence_extracted: (milestone.intelligence_extracted || 0) + extractedCount
          })
          .eq('id', queueItem.milestoneId);

        // Update local state
        setCompletedQuestions(prev => prev + 1);
        setTotalIntelligence(prev => prev + extractedCount);

        if (extractedCount > 0) {
          toast({
            title: '✨ Intelligence Extracted',
            description: `+${extractedCount} items added to your vault`,
          });
        }
      }

      // Update overall vault completion
      const overallCompletion = Math.round(((completedQuestions + 1) / questionQueue.length) * 100);
      await supabase
        .from('career_vault')
        .update({ interview_completion_percentage: overallCompletion })
        .eq('user_id', userId);

      onMilestoneUpdate();

      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to save answer',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    await supabase
      .from('career_vault')
      .update({ interview_completion_percentage: 100 })
      .eq('user_id', userId);

    toast({
      title: '🎉 Career Vault Complete!',
      description: `Extracted ${totalIntelligence} intelligence items`,
    });

    onComplete();
  };

  if (questionQueue.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (currentQuestionIndex >= questionQueue.length) {
    return null; // Will trigger completion
  }

  const queueItem = questionQueue[currentQuestionIndex];
  const progress = Math.round((completedQuestions / questionQueue.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Career Intelligence Extraction</h3>
              <p className="text-muted-foreground">
                Question {completedQuestions + 1} of {questionQueue.length}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{totalIntelligence}</span>
              </div>
              <p className="text-sm text-muted-foreground">items extracted</p>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-muted-foreground">{completedQuestions} completed</span>
            <span className="font-medium">{progress}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Milestone Context */}
      <Card className="border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">
                Question {queueItem.questionNumber} of {queueItem.totalForMilestone}
              </Badge>
              <CardTitle className="text-xl">{queueItem.milestoneContext.jobTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {queueItem.milestoneContext.company} • {queueItem.milestoneContext.dates}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Question Card */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading question...</p>
          </CardContent>
        </Card>
      ) : currentQuestion ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {typeof currentQuestion.question === 'string' 
                ? currentQuestion.question
                : currentQuestion.question?.questionsToExpand?.[0]?.prompt || 
                  currentQuestion.question?.prompt || 
                  'Please describe this experience'}
            </CardTitle>
            {currentQuestion.question?.context && (
              <p className="text-sm text-muted-foreground mt-2">
                {currentQuestion.question.context}
              </p>
            )}
            {currentQuestion.question?.questionsToExpand?.[0]?.hint && (
              <p className="text-xs text-muted-foreground italic mt-1">
                💡 {currentQuestion.question.questionsToExpand[0].hint}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                currentQuestion.question?.questionsToExpand?.[0]?.placeholder ||
                "Share your experience with specific examples and metrics..."
              }
              rows={8}
              className="resize-none"
            />

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 || isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? 'Saving...' : (
                    <>
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">Question unavailable</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleSkip}>
                Skip This Question
              </Button>
              <Button onClick={fetchQuestion}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};