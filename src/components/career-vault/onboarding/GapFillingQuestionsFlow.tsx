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
import { Sparkles, ChevronRight, Target, Zap, Loader2, Info, CheckCircle2, TrendingUp } from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface GapFillingQuestionsFlowProps {
  vaultId: string;
  currentVaultStrength: number;
  industryResearch?: any;
  onComplete: (data: { newVaultStrength: number }) => void;
  onSkip: () => void;
}

export default function GapFillingQuestionsFlow({
  vaultId,
  currentVaultStrength,
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
      // Fetch current vault data
      const { data: vaultData } = await supabase
        .from('career_vault')
        .select('target_roles, target_industries')
        .eq('id', vaultId)
        .single();

      // Fetch vault items for gap analysis
      const [powerPhrases, skills, competencies, softSkills] = await Promise.all([
        supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
        supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
        supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
        supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      ]);

      // Generate gap-filling questions
      const { data, error } = await supabase.functions.invoke('generate-gap-filling-questions', {
        body: {
          vaultId,
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

      setQuestionBatches(data.data.batches || []);
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

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
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
      const formattedResponses = Object.entries(responses).map(([questionId, answer]) => {
        const question = questionBatches
          .flatMap(b => b.questions)
          .find(q => q.id === questionId);

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
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-12 h-12 text-purple-600 mx-auto animate-spin" />
            <p className="text-slate-600">Analyzing gaps and generating questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || questionBatches.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle>Gap-Filling Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="text-center py-6">
            <p className="text-slate-600 mb-4">
              {error ? 'Unable to generate questions. ' : 'No gaps identified! '}
              Your vault is at {currentVaultStrength}%.
            </p>
            <Button onClick={onSkip}>Continue to Completion</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentBatch = questionBatches[currentBatchIndex];
  const totalQuestions = questionBatches.reduce((sum, b) => sum + b.questions.length, 0);
  const answeredQuestions = Object.keys(responses).length;
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-600" />
          Gap-Filling Questions
        </CardTitle>
        <CardDescription>
          Batch {currentBatchIndex + 1} of {questionBatches.length}: {currentBatch.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Marketing message */}
        <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm text-slate-700">
            <strong className="text-purple-700">Intelligent Questions:</strong> Each question fills
            a specific gap identified by comparing your profile against industry standards. Answer
            what you can—skip what doesn't apply. <strong className="text-pink-700">5-15 minutes
            to reach 85%+ vault strength.</strong>
          </AlertDescription>
        </Alert>

        {/* Progress */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Progress</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{answeredQuestions}/{totalQuestions} answered</Badge>
              <Badge className="bg-purple-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{currentBatch.totalImpact}%
              </Badge>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Batch description */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>{currentBatch.description}</strong> (Est. time: {currentBatch.estimatedTime})
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentBatch.questions.map((question: any, index: number) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              value={responses[question.id]}
              onChange={(value) => handleResponseChange(question.id, value)}
            />
          ))}
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
    <div className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <Badge variant="outline" className="mt-1">Q{index + 1}</Badge>
        <div className="flex-1">
          <h4 className="font-medium text-slate-900 mb-2">{question.text}</h4>
          {question.whyItMatters && (
            <div className="flex items-start gap-2 bg-blue-50 rounded p-2 mb-3">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">{question.whyItMatters}</p>
            </div>
          )}

          {/* Question Input Based on Type */}
          {question.type === 'multiple_choice' && (
            <RadioGroup value={value} onValueChange={onChange}>
              <div className="space-y-2">
                {question.options?.map((option: string) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                    <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {question.type === 'yes_no' && (
            <RadioGroup value={value} onValueChange={onChange}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                  <Label htmlFor={`${question.id}-yes`}>Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`${question.id}-no`} />
                  <Label htmlFor={`${question.id}-no`}>No</Label>
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
              {question.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${option}`}
                    checked={(value || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(value || []), option]
                        : (value || []).filter((v: string) => v !== option);
                      onChange(newValue);
                    }}
                  />
                  <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Impact indicator */}
          <div className="flex items-center gap-2 mt-3">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-slate-600">
              Impact: +{question.impactScore} vault strength points
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
