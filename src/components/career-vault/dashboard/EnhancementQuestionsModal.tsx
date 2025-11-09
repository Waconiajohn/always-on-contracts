import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sparkles,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle2,
  Loader2,
  Brain
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { EnhancementQuestionsSkeleton } from './EnhancementQuestionsSkeleton';
import { validateInput, invokeEdgeFunction, GenerateGapFillingQuestionsSchema, ProcessGapFillingResponsesSchema } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

interface EnhancementQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  currentScore: number;
  targetRoles?: string[];
  targetIndustries?: string[];
  onComplete: (newScore: number) => void;
}

interface Question {
  uniqueId: string;
  text: string;
  type: 'multiple_choice' | 'yes_no' | 'number' | 'text' | 'checkbox' | 'scale';
  category: string;
  whyItMatters?: string;
  impactScore: number;
  options?: string[];
  placeholder?: string;
}

interface Batch {
  title: string;
  description: string;
  estimatedTime: string;
  totalImpact: number;
  questions: Question[];
}

/**
 * Enhancement Questions Modal
 *
 * Opens when user clicks "Enhance Intelligence" on dashboard
 * Shows gap-filling questions to extract deeper career intelligence
 *
 * Focus: Going BEYOND the resume with targeted questions about:
 * - Budget amounts
 * - Team sizes
 * - Business outcomes
 * - Leadership scope
 * - Technical depth
 */
export function EnhancementQuestionsModal({
  open,
  onOpenChange,
  vaultId,
  currentScore,
  targetRoles = [],
  targetIndustries = [],
  onComplete,
}: EnhancementQuestionsModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadEnhancementQuestions();
    }
  }, [open, vaultId]);

  const loadEnhancementQuestions = async () => {
    setIsLoading(true);
    try {
      // Fetch vault data including resume text
      const { data: vaultData } = await supabase
        .from('career_vault')
        .select('target_roles, target_industries, resume_raw_text')
        .eq('id', vaultId)
        .single();

      // Fetch vault items for context
      const [powerPhrases, skills, competencies, softSkills] = await Promise.all([
        supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
        supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
        supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
        supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      ]);

      // Generate gap-filling questions
      const validated = validateInput(GenerateGapFillingQuestionsSchema, {
        resumeText: vaultData?.resume_raw_text || '',
        vaultData: {
          vault_id: vaultId,
          powerPhrases: powerPhrases.data || [],
          transferableSkills: skills.data || [],
          hiddenCompetencies: competencies.data || [],
          softSkills: softSkills.data || [],
          targetRoles: vaultData?.target_roles || targetRoles,
          targetIndustries: vaultData?.target_industries || targetIndustries,
        },
        targetRoles: vaultData?.target_roles || targetRoles,
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'generate-gap-filling-questions',
        validated
      );

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to generate questions');
      }

      // Add unique IDs to questions
      const batchesWithIds = (data.data.batches || []).map((batch: any, batchIdx: number) => ({
        ...batch,
        questions: batch.questions.map((q: any, qIdx: number) => ({
          ...q,
          uniqueId: `batch-${batchIdx}-q-${qIdx}`,
        })),
      }));

      setBatches(batchesWithIds);
      setIsLoading(false);

      toast({
        title: '🎯 Questions Ready',
        description: `${batchesWithIds.length} batches of enhancement questions prepared`,
      });
    } catch (err: any) {
      logger.error('Load questions error', err);
      toast({
        title: 'Load Failed',
        description: err.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any, question: Question) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        answer: value,
        question: {
          text: question.text,
          type: question.type,
          category: question.category,
          uniqueId: questionId,
        },
      },
    }));
  };

  const handleNextBatch = () => {
    if (currentBatchIndex < batches.length - 1) {
      setCurrentBatchIndex(prev => prev + 1);
    }
  };

  const handlePreviousBatch = () => {
    if (currentBatchIndex > 0) {
      setCurrentBatchIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Format responses for backend
      const formattedResponses = Object.entries(responses).map(([questionId, responseData]: [string, any]) => {
        const { answer, question } = responseData;
        return {
          questionId,
          questionText: question?.text || '',
          questionType: question?.type || 'text',
          category: question?.category || 'general',
          answer,
        };
      });

      const validated = validateInput(ProcessGapFillingResponsesSchema, {
        vaultId,
        responses: formattedResponses,
        targetRoles,
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'process-gap-filling-responses',
        validated
      );

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to process responses');
      }

      const newScore = data.data.newVaultStrength;

      toast({
        title: '🎉 Intelligence Enhanced!',
        description: `Vault strength increased to ${newScore}%`,
      });

      onComplete(newScore);
      onOpenChange(false);
    } catch (err: any) {
      logger.error('Submit error', err);
      toast({
        title: 'Submission Failed',
        description: err.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const currentBatch = batches[currentBatchIndex];
  const totalQuestions = batches.reduce((sum, b) => sum + b.questions.length, 0);
  const answeredQuestions = Object.keys(responses).length;
  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Enhance Your Career Intelligence
          </DialogTitle>
          <DialogDescription>
            Answer targeted questions to unlock hidden achievements and deepen your vault
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <EnhancementQuestionsSkeleton />
        ) : batches.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No Gaps Identified!</h3>
              <p className="text-muted-foreground">Your vault is comprehensive and strong.</p>
            </div>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Marketing Message */}
            <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong className="text-blue-700">What makes this different:</strong> We ask intelligent
                questions that go deeper than your resume. Each question fills a specific gap to strengthen
                your competitive position. <strong>10-15 minutes to reach elite tier (85+).</strong>
              </AlertDescription>
            </Alert>

            {/* Progress */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{answeredQuestions}/{totalQuestions}</Badge>
                  <Badge className="bg-primary">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Current: {currentScore}%
                  </Badge>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Current Batch */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{currentBatch.title}</h3>
                  <p className="text-sm text-muted-foreground">{currentBatch.description}</p>
                </div>
                <Badge variant="secondary">
                  Batch {currentBatchIndex + 1} of {batches.length}
                </Badge>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {currentBatch.questions.map((question, index) => {
                  const questionId = question.uniqueId;
                  const currentValue = responses[questionId]?.answer;

                  return (
                    <QuestionCard
                      key={questionId}
                      question={question}
                      index={index}
                      value={currentValue}
                      onChange={(value) => handleResponseChange(questionId, value, question)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousBatch}
                disabled={currentBatchIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-muted-foreground">
                Est. time remaining: {currentBatch.estimatedTime}
              </div>

              {currentBatchIndex < batches.length - 1 ? (
                <Button onClick={handleNextBatch}>
                  Next Batch
                  <ChevronRight className="w-4 h-4 ml-2" />
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
                      Complete Enhancement
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Question Card Component
function QuestionCard({
  question,
  index,
  value,
  onChange,
}: {
  question: Question;
  index: number;
  value: any;
  onChange: (value: any) => void;
}) {
  return (
    <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Badge variant="outline" className="mt-1">Q{index + 1}</Badge>
        <div className="flex-1 space-y-3">
          <h4 className="font-medium">{question.text}</h4>

          {question.whyItMatters && (
            <div className="flex items-start gap-2 bg-blue-50 rounded p-2 text-sm">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900">{question.whyItMatters}</p>
            </div>
          )}

          {/* Question Input */}
          {question.type === 'multiple_choice' && (
            <RadioGroup value={value} onValueChange={onChange}>
              <div className="space-y-2">
                {question.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2 p-3 border rounded hover:bg-accent transition-colors cursor-pointer">
                    <RadioGroupItem value={option} id={`${question.uniqueId}-${option}`} />
                    <Label htmlFor={`${question.uniqueId}-${option}`} className="cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {question.type === 'yes_no' && (
            <RadioGroup value={value} onValueChange={onChange}>
              <div className="flex gap-3">
                <div className="flex items-center space-x-2 p-3 border rounded hover:bg-accent transition-colors cursor-pointer flex-1">
                  <RadioGroupItem value="yes" id={`${question.uniqueId}-yes`} />
                  <Label htmlFor={`${question.uniqueId}-yes`} className="cursor-pointer flex-1">Yes</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded hover:bg-accent transition-colors cursor-pointer flex-1">
                  <RadioGroupItem value="no" id={`${question.uniqueId}-no`} />
                  <Label htmlFor={`${question.uniqueId}-no`} className="cursor-pointer flex-1">No</Label>
                </div>
              </div>
            </RadioGroup>
          )}

          {question.type === 'number' && (
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.placeholder || 'Enter number...'}
              className="max-w-xs"
            />
          )}

          {question.type === 'text' && (
            <Textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.placeholder || 'Enter your response...'}
              rows={3}
            />
          )}

          {question.type === 'checkbox' && (
            <div className="space-y-2">
              {question.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2 p-3 border rounded hover:bg-accent transition-colors">
                  <Checkbox
                    id={`${question.uniqueId}-${option}`}
                    checked={(value || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(value || []), option]
                        : (value || []).filter((v: string) => v !== option);
                      onChange(newValue);
                    }}
                  />
                  <Label htmlFor={`${question.uniqueId}-${option}`} className="cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {question.type === 'scale' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">1 (Low)</span>
                <Badge variant="outline" className="text-lg font-bold">{value || 5}</Badge>
                <span className="text-sm text-muted-foreground">10 (High)</span>
              </div>
              <Slider
                value={[value || 5]}
                onValueChange={(vals) => onChange(vals[0])}
                min={1}
                max={10}
                step={1}
              />
            </div>
          )}

          {/* Impact */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 text-green-600" />
            Impact: +{question.impactScore} points
          </div>
        </div>
      </div>
    </div>
  );
}
