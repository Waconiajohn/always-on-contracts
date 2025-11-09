import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, Users, CheckCircle2, Loader2, Info, TrendingUp } from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LeadershipApproachQuestionnaireProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  onComplete: (newScore: number) => void;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice';
  whyItMatters: string;
  impactScore: number;
  options?: string[];
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'philosophy-statement',
    text: 'Describe your leadership philosophy in 1-2 sentences',
    type: 'text',
    whyItMatters: 'Your leadership philosophy reveals your core values and approach. Modern leaders emphasize empowerment, data-driven decisions, and growth mindset.',
    impactScore: 4,
    placeholder: 'Example: I lead by empowering teams with clear goals and removing blockers, while using data to make decisions and celebrating both wins and learning moments.',
  },
  {
    id: 'management-style',
    text: 'What is your primary management style?',
    type: 'multiple_choice',
    whyItMatters: 'Your management style affects team performance. Transformational and servant leadership styles are highly valued in modern organizations.',
    impactScore: 3,
    options: [
      'Transformational (Inspire and motivate toward shared vision)',
      'Servant Leadership (Support and develop team members)',
      'Democratic (Collaborative decision-making)',
      'Coaching (Develop individual strengths)',
      'Situational (Adapt style to context)',
    ],
  },
  {
    id: 'conflict-resolution',
    text: 'How do you handle conflict on your team?',
    type: 'text',
    whyItMatters: 'Conflict resolution skills are critical for senior roles. Strong leaders address issues directly, seek root causes, and find win-win solutions.',
    impactScore: 4,
    placeholder: 'Example: I address conflicts early by bringing parties together, listening to all perspectives, and facilitating discussions to find solutions that serve the team and company goals.',
  },
  {
    id: 'decision-making',
    text: 'How do you make decisions with incomplete information?',
    type: 'multiple_choice',
    whyItMatters: 'Senior roles require making tough calls with ambiguity. Your decision-making framework signals your strategic thinking ability.',
    impactScore: 4,
    options: [
      'Gather minimum viable data, then decide quickly',
      'Use frameworks (e.g., risk/reward, decision trees)',
      'Consult trusted advisors before deciding',
      'Test with small experiments first',
      'Rely on experience and intuition',
    ],
  },
  {
    id: 'coaching-underperformers',
    text: 'Describe your approach to coaching underperformers',
    type: 'text',
    whyItMatters: 'How you handle underperformance reveals your leadership maturity. Strong leaders balance accountability with support.',
    impactScore: 3,
    placeholder: 'Example: I start with clear performance expectations, identify root causes (skills gap vs. motivation), provide coaching and resources, then make tough decisions if no improvement.',
  },
  {
    id: 'team-development',
    text: 'How do you develop your team members?',
    type: 'text',
    whyItMatters: 'Top leaders prioritize people development. Growing your team is a key indicator of leadership effectiveness.',
    impactScore: 4,
    placeholder: 'Example: I hold regular 1-on-1s focused on career goals, delegate stretch assignments, sponsor training, and advocate for promotions when earned.',
  },
  {
    id: 'management-scope',
    text: 'What is the largest team you have managed?',
    type: 'multiple_choice',
    whyItMatters: 'Team size signals your leadership scale. Managing managers (15+ people) is a critical threshold for senior roles.',
    impactScore: 4,
    options: [
      '1-5 people (individual contributors)',
      '6-10 people (small team)',
      '11-20 people (medium team)',
      '21-50 people (large team, likely managing managers)',
      '50+ people (organization-level leadership)',
    ],
  },
];

export function LeadershipApproachQuestionnaire({
  open,
  onOpenChange,
  vaultId,
  onComplete,
}: LeadershipApproachQuestionnaireProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Get user_id for database insert
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert leadership philosophy data
      const { error: insertError } = await supabase
        .from('vault_leadership_philosophy')
        .insert({
          vault_id: vaultId,
          user_id: user.id,
          philosophy_statement: responses['philosophy-statement'] || '',
          leadership_style: responses['management-style'] || null,
          quality_tier: 'silver',
          ai_confidence: 0.9,
          confidence_score: 90,
        });

      if (insertError) throw insertError;

      // Calculate impact (estimated +20 points from architecture doc)
      const estimatedNewScore = 20;

      toast({
        title: '🎉 Leadership Approach Documented!',
        description: 'Your executive intelligence has been enhanced',
      });

      onComplete(estimatedNewScore);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Submit error:', err);
      toast({
        title: 'Submission Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const answeredCount = Object.keys(responses).length;
  const progressPercentage = (answeredCount / QUESTIONS.length) * 100;
  const totalImpact = QUESTIONS.reduce((sum, q) => sum + q.impactScore, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Leadership Approach
          </DialogTitle>
          <DialogDescription>
            Help us understand your leadership philosophy and management style
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Marketing Message */}
          <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong className="text-blue-700">Why this matters:</strong> Leadership approach powers your 
              executive presence. This intelligence feeds your LinkedIn About section, cover letters, and 
              interview prep. <strong>7-10 minutes to complete, +{totalImpact} points potential.</strong>
            </AlertDescription>
          </Alert>

          {/* Progress */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <Badge variant="outline">{answeredCount}/{QUESTIONS.length}</Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current Question */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">Q{currentQuestionIndex + 1}</Badge>
                <div className="flex-1">
                  <h4 className="font-medium text-lg mb-3">{currentQuestion.text}</h4>

                  {/* Why It Matters */}
                  <div className="flex items-start gap-2 bg-blue-50 rounded p-3 mb-4">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900">{currentQuestion.whyItMatters}</p>
                  </div>

                  {/* Input Field */}
                  {currentQuestion.type === 'text' && (
                    <Textarea
                      value={responses[currentQuestion.id] || ''}
                      onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      rows={4}
                      className="w-full"
                    />
                  )}

                  {currentQuestion.type === 'multiple_choice' && (
                    <RadioGroup
                      value={responses[currentQuestion.id]}
                      onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
                    >
                      <div className="space-y-2">
                        {currentQuestion.options?.map((option) => (
                          <div 
                            key={option} 
                            className="flex items-center space-x-3 p-3 border rounded hover:bg-accent transition-colors cursor-pointer"
                          >
                            <RadioGroupItem value={option} id={`${currentQuestion.id}-${option}`} />
                            <Label 
                              htmlFor={`${currentQuestion.id}-${option}`} 
                              className="cursor-pointer flex-1"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}

                  {/* Impact Badge */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    Impact: +{currentQuestion.impactScore} points
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {QUESTIONS.length}
            </span>

            {currentQuestionIndex < QUESTIONS.length - 1 ? (
              <Button onClick={handleNext}>
                Next Question
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
