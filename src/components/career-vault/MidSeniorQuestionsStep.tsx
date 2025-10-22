import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, Users, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MidSeniorQuestion {
  id: string;
  category: string;
  questionText: string;
  questionType: 'multiple_choice' | 'text';
  options?: Array<{ value: string; label: string; }>;
  icon: any;
}

interface MidSeniorQuestionsStepProps {
  vaultId: string;
  onComplete: () => void;
}

const QUESTIONS: MidSeniorQuestion[] = [
  {
    id: 'mid_promotion_trajectory',
    category: 'career_progression',
    questionText: 'How many times have you been promoted in the last 5 years?',
    questionType: 'multiple_choice',
    icon: TrendingUp,
    options: [
      { value: '3_plus', label: '3+ promotions (fast track)' },
      { value: '2', label: '2 promotions (strong growth)' },
      { value: '1', label: '1 promotion (steady progress)' },
      { value: '0_responsibilities', label: 'No promotions, but expanded responsibilities' },
      { value: '0_none', label: 'No promotions or scope changes' }
    ]
  },
  {
    id: 'mid_major_projects_delivered',
    category: 'execution',
    questionText: 'How many major projects have you led or significantly contributed to?',
    questionType: 'multiple_choice',
    icon: Award,
    options: [
      { value: '10_plus', label: '10+ major projects' },
      { value: '5_to_9', label: '5-9 major projects' },
      { value: '3_to_4', label: '3-4 major projects' },
      { value: '1_to_2', label: '1-2 major projects' },
      { value: '0', label: 'No major projects yet' }
    ]
  },
  {
    id: 'mid_peer_recognition',
    category: 'impact',
    questionText: 'Have you received formal recognition (awards, spotlight, peer nominations)?',
    questionType: 'multiple_choice',
    icon: Users,
    options: [
      { value: 'multiple_company', label: 'Multiple company-wide awards' },
      { value: 'one_company', label: 'One company-wide award or recognition' },
      { value: 'team_dept', label: 'Team/department recognition' },
      { value: 'informal', label: 'Informal praise, no formal awards' },
      { value: 'none', label: 'No formal recognition yet' }
    ]
  },
  {
    id: 'mid_scope_expansion',
    category: 'scope',
    questionText: 'Describe your scope of responsibility (team size, budget, systems)',
    questionType: 'text',
    icon: Target
  },
  {
    id: 'mid_technical_leadership',
    category: 'technical_depth',
    questionText: 'What technical leadership have you provided (architecture, mentoring, standards)?',
    questionType: 'text',
    icon: Zap
  }
];

export const MidSeniorQuestionsStep = ({ vaultId, onComplete }: MidSeniorQuestionsStepProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;
  const IconComponent = currentQuestion.icon;

  const handleAnswer = async (answer: string) => {
    const newResponses = new Map(responses);
    newResponses.set(currentQuestion.id, answer);
    setResponses(newResponses);

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Store response using RPC function
      const { error } = await supabase.rpc('store_mid_senior_response' as any, {
        p_user_id: user.id,
        p_vault_id: vaultId,
        p_question_id: currentQuestion.id,
        p_response: answer
      });

      if (error) throw error;

      // Move to next question or complete
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        toast({
          title: 'Career Progression Questions Complete!',
          description: 'Your responses help us understand your seniority level.',
        });
        onComplete();
      }
    } catch (error: any) {
      console.error('Error saving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100">
              <IconComponent className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{currentQuestion.questionText}</CardTitle>
              <CardDescription className="mt-1">
                This helps us understand your career level and progression
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options ? (
            <RadioGroup
              onValueChange={(value) => handleAnswer(value)}
              disabled={loading}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Share details about your scope, team size, budget, systems, or technical leadership..."
                rows={6}
                className="resize-none"
                onChange={(e) => {
                  const newResponses = new Map(responses);
                  newResponses.set(currentQuestion.id, e.target.value);
                  setResponses(newResponses);
                }}
                value={responses.get(currentQuestion.id) || ''}
              />
              <Button
                onClick={() => {
                  const answer = responses.get(currentQuestion.id);
                  if (answer && answer.trim().length >= 20) {
                    handleAnswer(answer);
                  } else {
                    toast({
                      title: 'Please provide more detail',
                      description: 'We need at least 20 characters to understand your experience.',
                      variant: 'destructive'
                    });
                  }
                }}
                disabled={loading || !responses.get(currentQuestion.id) || (responses.get(currentQuestion.id)?.trim().length ?? 0) < 20}
                className="w-full"
              >
                {loading ? 'Saving...' : currentQuestionIndex < QUESTIONS.length - 1 ? 'Next Question' : 'Complete'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {currentQuestionIndex > 0 && (
        <Button
          variant="ghost"
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
          disabled={loading}
          className="w-full"
        >
          Back to Previous Question
        </Button>
      )}
    </div>
  );
};
