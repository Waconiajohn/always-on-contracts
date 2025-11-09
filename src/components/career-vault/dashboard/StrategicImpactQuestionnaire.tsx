import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, Target, CheckCircle2, Loader2, Info, TrendingUp } from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StrategicImpactQuestionnaireProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  onComplete: (newScore: number) => void;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'number' | 'multiple_choice';
  whyItMatters: string;
  impactScore: number;
  options?: string[];
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'biggest-business-win',
    text: 'What was your biggest business win? (Project, launch, transformation)',
    type: 'text',
    whyItMatters: 'Your biggest win reveals your strategic scope. Strong candidates have measurable impact on revenue, cost, or customer outcomes.',
    impactScore: 5,
    placeholder: 'Example: Led product launch that generated $5M ARR in year 1, acquired 200 enterprise customers',
  },
  {
    id: 'budget-managed',
    text: 'What is the largest budget you have managed or influenced?',
    type: 'number',
    whyItMatters: 'Budget responsibility signals P&L accountability. Senior roles require $500K+ budget experience; executive roles require $5M+.',
    impactScore: 5,
    placeholder: 'Enter dollar amount (e.g., 2000000 for $2M)',
  },
  {
    id: 'revenue-impact',
    text: 'Have you directly influenced revenue? If so, how much?',
    type: 'text',
    whyItMatters: 'Revenue impact is the ultimate business metric. Quantifying your revenue contribution positions you as a business driver, not just an operator.',
    impactScore: 5,
    placeholder: 'Example: Grew territory from $3M to $8M ARR (167% increase), directly managed $12M book of business',
  },
  {
    id: 'cost-savings',
    text: 'Have you delivered cost savings or efficiency improvements? Quantify the impact.',
    type: 'text',
    whyItMatters: 'Cost savings show you think like an owner. Strong candidates can quantify process improvements in dollars or time saved.',
    impactScore: 4,
    placeholder: 'Example: Automated manual process, saving 20 hours/week ($52K annually), reduced vendor costs by $150K',
  },
  {
    id: 'strategic-initiatives',
    text: 'Have you led or participated in strategic company initiatives?',
    type: 'multiple_choice',
    whyItMatters: 'Strategic involvement signals you operate at a higher level than your job title suggests.',
    impactScore: 4,
    options: [
      'Yes, led a strategic initiative (e.g., new market entry, digital transformation)',
      'Yes, participated as core team member',
      'Yes, contributed as subject matter expert',
      'No, focused on operational execution',
    ],
  },
  {
    id: 'cross-functional-influence',
    text: 'How many departments or teams have you influenced without direct authority?',
    type: 'multiple_choice',
    whyItMatters: 'Influence without authority is a key senior-level skill. Strong leaders impact beyond their direct reports.',
    impactScore: 4,
    options: [
      '1-2 teams (e.g., worked closely with one partner team)',
      '3-5 teams (cross-functional collaboration)',
      '6-10 teams (organization-wide influence)',
      '10+ teams (company-wide strategic influence)',
    ],
  },
  {
    id: 'market-expansion',
    text: 'Have you opened new markets, launched products, or entered new customer segments?',
    type: 'text',
    whyItMatters: 'Growth initiatives show entrepreneurial thinking. Launching something new is higher-risk and higher-value than maintaining existing business.',
    impactScore: 5,
    placeholder: 'Example: Launched enterprise tier (new segment), opened EMEA region, introduced first SaaS product',
  },
  {
    id: 'roi-example',
    text: 'Describe a project where you calculated and delivered ROI',
    type: 'text',
    whyItMatters: 'ROI thinking positions you as business-savvy. Strong candidates measure investment (time, money) against returns.',
    impactScore: 4,
    placeholder: 'Example: Invested $50K in automation tooling, delivered $200K savings over 2 years (300% ROI)',
  },
];

export function StrategicImpactQuestionnaire({
  open,
  onOpenChange,
  vaultId,
  onComplete,
}: StrategicImpactQuestionnaireProps) {
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

      // Create power phrases from strategic impact responses
      const strategicPhrases = [
        {
          vault_id: vaultId,
          user_id: user.id,
          category: 'strategic_impact',
          power_phrase: responses['biggest-business-win'] || '',
          source: 'user_added',
          quality_tier: 'gold',
          confidence_score: 95,
          impact_metrics: {
            business_win: true,
            strategic_impact: true,
          },
        },
        {
          vault_id: vaultId,
          user_id: user.id,
          category: 'revenue_impact',
          power_phrase: responses['revenue-impact'] || '',
          source: 'user_added',
          quality_tier: 'gold',
          confidence_score: 95,
          impact_metrics: {
            revenue_impact: true,
          },
        },
        {
          vault_id: vaultId,
          user_id: user.id,
          category: 'cost_savings',
          power_phrase: responses['cost-savings'] || '',
          source: 'user_added',
          quality_tier: 'gold',
          confidence_score: 95,
          impact_metrics: {
            cost_savings: true,
          },
        },
        {
          vault_id: vaultId,
          user_id: user.id,
          category: 'market_expansion',
          power_phrase: responses['market-expansion'] || '',
          source: 'user_added',
          quality_tier: 'gold',
          confidence_score: 95,
          impact_metrics: {
            market_expansion: true,
          },
        },
        {
          vault_id: vaultId,
          user_id: user.id,
          category: 'roi',
          power_phrase: responses['roi-example'] || '',
          source: 'user_added',
          quality_tier: 'gold',
          confidence_score: 95,
          impact_metrics: {
            roi_calculated: true,
          },
        },
      ].filter(phrase => phrase.power_phrase); // Only insert non-empty responses

      if (strategicPhrases.length > 0) {
        const { error: insertError } = await supabase
          .from('vault_power_phrases')
          .insert(strategicPhrases);

        if (insertError) throw insertError;
      }

      // Calculate impact (estimated +25 points from architecture doc)
      const estimatedNewScore = 25;

      toast({
        title: '🎉 Strategic Impact Documented!',
        description: `Added ${strategicPhrases.length} high-impact achievements to your vault`,
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
            <Target className="w-6 h-6 text-primary" />
            Strategic Impact
          </DialogTitle>
          <DialogDescription>
            Help us understand your business outcomes and strategic contributions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Marketing Message */}
          <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong className="text-blue-700">Why this matters:</strong> Strategic impact is what separates 
              operators from leaders. Quantifying your business outcomes positions you for senior roles. 
              <strong> 8-12 minutes to complete, +{totalImpact} points potential.</strong>
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
                      rows={3}
                      className="w-full"
                    />
                  )}

                  {currentQuestion.type === 'number' && (
                    <Input
                      type="number"
                      value={responses[currentQuestion.id] || ''}
                      onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                      placeholder={currentQuestion.placeholder}
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
