// =====================================================
// GAP FILLING QUESTIONS FLOW - Career Vault 2.0
// =====================================================
// TARGETED GAP-FILLING QUESTIONS
//
// This component asks intelligent questions to fill gaps
// identified by comparing vault against industry benchmarks.
//
// MARKETING MESSAGE:
// "We ask only questions that matter—each one designed to
// fill a specific gap and boost your vault strength. 5-15
// minutes to reach 85%+ and unlock elite profile status."
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sparkles, ChevronRight, Target, Zap, Loader2, Info, CheckCircle2, TrendingUp } from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Auto-detect correct question type based on text (runtime fallback)
function normalizeQuestionType(question: any): any {
  const textLower = question.text.toLowerCase();
  if ((textLower.includes('select all that apply') || 
       (textLower.includes('which of the following') && question.options?.length > 2)) && 
      question.type !== 'checkbox') {
    console.log(`[RUNTIME-FIX] Changed question type to checkbox: "${question.text}"`);
    return { ...question, type: 'checkbox' };
  }
  return question;
}

interface GapFillingQuestionsFlowProps {
  vaultId: string;
  currentVaultStrength: number; // Still required by parent component
  industryResearch?: any;
  onComplete: (data: { newVaultStrength: number }) => void;
  onSkip: () => void;
}

export default function GapFillingQuestionsFlow({
  vaultId,
  currentVaultStrength: _currentVaultStrength, // Prefix with _ to mark as intentionally unused
  industryResearch,
  onComplete,
  onSkip,
}: GapFillingQuestionsFlowProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [questionBatches, setQuestionBatches] = useState<any[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [responses, setResponses] = useState<{[key: string]: any}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    loadGapFillingQuestions();
  }, []);

  const loadGapFillingQuestions = async () => {
    try {
      // Fetch current vault data INCLUDING resume text
      const { data: vaultData } = await supabase
        .from('career_vault')
        .select('target_roles, target_industries, resume_raw_text')
        .eq('id', vaultId)
        .single();

      // Fetch vault items for gap analysis
      const [powerPhrases, skills, competencies, softSkills] = await Promise.all([
        supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
        supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
        supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
        supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      ]);

      // Generate gap-filling questions with ACTUAL resume content
      const { data, error } = await supabase.functions.invoke('generate-gap-filling-questions', {
        body: {
          vaultId,
          resumeText: vaultData?.resume_raw_text || '',  // PASS THE ACTUAL RESUME
          vaultData: {
            powerPhrases: powerPhrases.data || [],
            transferableSkills: skills.data || [],
            hiddenCompetencies: competencies.data || [],
            softSkills: softSkills.data || [],
            targetRoles: vaultData?.target_roles || [],
            targetIndustries: vaultData?.target_industries || [],
          },
          industryResearch: industryResearch?.[0]?.results,
          targetRoles: vaultData?.target_roles || [],
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Add unique IDs to each question in each batch and normalize types
      const batchesWithIds = (data.data.batches || []).map((batch: any, batchIdx: number) => ({
        ...batch,
        questions: batch.questions.map((q: any, qIdx: number) => 
          normalizeQuestionType({
            ...q,
            uniqueId: `batch-${batchIdx}-q-${qIdx}` // Stable unique ID
          })
        )
      }));

      console.log('Gap-filling questions loaded:', 
        batchesWithIds.map((b: any) => ({
          title: b.title,
          questions: b.questions.map((q: any) => ({ 
            text: q.text.substring(0, 50) + '...', 
            type: q.type, 
            hasOptions: !!q.options,
            optionsCount: q.options?.length 
          }))
        }))
      );
      setQuestionBatches(batchesWithIds);
      setIsLoading(false);

      toast({
        title: '🎯 Questions Ready',
        description: data.meta?.message || 'Gap-filling questions generated',
      });
    } catch (err: any) {
      console.error('Load questions error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any, question: any) => {
    setResponses(prev => ({ 
      ...prev, 
      [questionId]: { 
        answer: value, 
        question: {
          text: question.text,
          type: question.type,
          category: question.category,
          uniqueId: questionId
        }
      } 
    }));
  };

  const handleNextBatch = () => {
    if (currentBatchIndex < questionBatches.length - 1) {
      setCurrentBatchIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Convert responses to format expected by backend
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

      const { data, error } = await supabase.functions.invoke('process-gap-filling-responses', {
        body: {
          vaultId,
          responses: formattedResponses,
          industryResearch: industryResearch?.[0]?.results,
          targetRoles: [],
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: '🎉 Gap-Filling Complete!',
        description: data.meta?.message || 'Vault strength updated',
      });

      onComplete({ newVaultStrength: data.data.newVaultStrength });
    } catch (err: any) {
      console.error('Submit error:', err);
      toast({
        title: 'Submission Failed',
        description: err.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card backdrop-blur-sm border-border shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Gap Analysis & Question Generation
          </CardTitle>
          <CardDescription>
            Identifying opportunities to strengthen your vault
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            {/* Animated pulsing loader with throbbing target */}
            <div className="relative mx-auto w-28 h-28">
              {/* Outer ping ring - slower, more visible throb */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-30 animate-ping"></div>
              {/* Middle pulse ring */}
              <div className="absolute inset-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full opacity-50 animate-pulse"></div>
              {/* Inner solid circle with TARGET icon */}
              <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full w-28 h-28 flex items-center justify-center shadow-2xl">
                <Target className="w-14 h-14 text-white animate-pulse" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Analyzing gaps and generating questions...
              </h3>
              <p className="text-muted-foreground">
                Comparing your vault against industry benchmarks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || questionBatches.length === 0) {
    return (
      <Card className="bg-card backdrop-blur-sm border-border shadow-xl">
        <CardHeader>
          <CardTitle>Gap-Filling Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error loading gap-filling questions:</strong> {error}
                <div className="mt-2 text-sm">
                  This usually resolves on retry. You can continue without gap-filling questions or try again.
                </div>
              </AlertDescription>
            </Alert>
          )}
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              {error 
                ? 'Gap analysis temporarily unavailable. Your vault is functional and ready to use.' 
                : 'No critical gaps identified! Your vault is strong.'}
            </p>
            <div className="flex gap-3 justify-center">
              {error && (
                <Button variant="outline" onClick={loadGapFillingQuestions}>
                  Retry Gap Analysis
                </Button>
              )}
              <Button onClick={onSkip}>Continue to Completion</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentBatch = questionBatches[currentBatchIndex];
  const totalQuestions = questionBatches.reduce((sum, b) => sum + b.questions.length, 0);
  const answeredQuestions = Object.values(responses).filter((r: any) => r?.answer !== undefined && r?.answer !== '').length;
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  return (
    <Card className="bg-card backdrop-blur-sm border-border shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Gap-Filling Questions
        </CardTitle>
        <CardDescription>
          Batch {currentBatchIndex + 1} of {questionBatches.length}: {currentBatch.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Marketing message */}
        <Alert className="border-primary/20 bg-primary/5">
          <Sparkles className="w-4 h-4 text-primary" />
          <AlertDescription className="text-sm text-foreground">
            <strong className="text-primary">Intelligent Questions:</strong> Each question fills
            a specific gap identified by comparing your profile against industry standards. Answer
            what you can—skip what doesn't apply. <strong className="text-primary">5-15 minutes
            to reach 85%+ vault strength.</strong>
          </AlertDescription>
        </Alert>

        {/* Progress */}
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{answeredQuestions}/{totalQuestions} answered</Badge>
              <Badge className="bg-primary">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{currentBatch.totalImpact}%
              </Badge>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Batch description */}
        <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
          <p className="text-sm text-foreground">
            <strong>{currentBatch.description}</strong> (Est. time: {currentBatch.estimatedTime})
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentBatch.questions.map((question: any, index: number) => {
            const questionId = question.uniqueId;
            const responseData = responses[questionId];
            const currentValue = responseData?.answer;
            
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

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isSubmitting}
          >
            Skip to Completion
          </Button>

          {currentBatchIndex < questionBatches.length - 1 ? (
            <Button
              onClick={handleNextBatch}
              className="flex-1"
              size="lg"
            >
              Next Batch
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Gap-Filling
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Question Card Component
function QuestionCard({
  question,
  index,
  value,
  onChange,
}: {
  question: any;
  index: number;
  value: any;
  onChange: (value: any) => void;
}) {
  return (
    <div className="border border-border rounded-lg p-5 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <Badge variant="outline" className="mt-1">Q{index + 1}</Badge>
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-2">{question.text}</h4>
          {question.whyItMatters && (
            <div className="flex items-start gap-2 bg-primary/10 rounded p-2 mb-3">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{question.whyItMatters}</p>
            </div>
          )}

          {/* Question Input Based on Type */}
          {question.type === 'multiple_choice' && (
            <RadioGroup value={value} onValueChange={onChange}>
              <div className="space-y-2">
                {question.options?.map((option: string) => (
                  <div key={option} className="flex items-center space-x-2 p-3 border border-border rounded bg-secondary dark:bg-muted hover:bg-accent transition-colors cursor-pointer">
            <RadioGroupItem value={option} id={`${question.uniqueId}-${option}`} />
            <Label htmlFor={`${question.uniqueId}-${option}`} className="cursor-pointer text-foreground flex-1">
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
                <div className="flex items-center space-x-2 p-3 border border-border rounded bg-secondary dark:bg-muted hover:bg-accent transition-colors cursor-pointer flex-1">
                  <RadioGroupItem value="yes" id={`${question.uniqueId}-yes`} />
                  <Label htmlFor={`${question.uniqueId}-yes`} className="cursor-pointer text-foreground flex-1">Yes</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border rounded bg-secondary dark:bg-muted hover:bg-accent transition-colors cursor-pointer flex-1">
                  <RadioGroupItem value="no" id={`${question.uniqueId}-no`} />
                  <Label htmlFor={`${question.uniqueId}-no`} className="cursor-pointer text-foreground flex-1">No</Label>
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
            <div className="space-y-3">
              <Badge variant="secondary" className="text-xs">
                Select all that apply
              </Badge>
              <div className="space-y-2">
                {question.options?.map((option: string) => (
                  <div key={option} className="flex items-center space-x-2 p-3 border border-border rounded bg-secondary dark:bg-muted hover:bg-accent transition-colors">
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
                    <Label htmlFor={`${question.uniqueId}-${option}`} className="cursor-pointer text-foreground flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.type === 'scale' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">1 (Low)</span>
                <Badge variant="outline" className="text-lg font-bold">
                  {value || 5}
                </Badge>
                <span className="text-sm text-muted-foreground">10 (High)</span>
              </div>
              <Slider
                value={[value || 5]}
                onValueChange={(vals) => onChange(vals[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <span key={num} className="w-6 text-center">{num}</span>
                ))}
              </div>
            </div>
          )}

          {/* Impact indicator */}
          <div className="flex items-center gap-2 mt-3">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-xs text-muted-foreground">
              Impact: +{question.impactScore} vault strength points
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
