import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleHelp,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  competency_name: string;
  category: string;
  question_text: string;
  question_type: 'yes_no' | 'scale' | 'numeric' | 'multiple_choice' | 'multi_select' | 'text_input';
  answer_options?: any;
  scoring_rubric?: any;
  required_percentage?: number;
  differentiator_weight?: number;
  ats_keywords?: string[];
  help_text?: string;
  link_to_milestone?: boolean;
  display_order: number;
}

interface QuizAnswer {
  question_id: string;
  answer_value: any;
  answer_text?: string;
  linked_milestone_id?: string;
}

interface CompetencyQuizEngineProps {
  vaultId: string;
  role: string;
  industry?: string;
  experienceLevel?: number;
  resumeMilestones?: any[];
  onComplete: (results: QuizResults) => void;
}

interface QuizResults {
  totalQuestions: number;
  questionsAnswered: number;
  completionPercentage: number;
  coverageScore: number;
  competenciesIdentified: number;
}

export const CompetencyQuizEngine = ({
  vaultId,
  role,
  industry = 'technology',
  experienceLevel = 5,
  resumeMilestones = [],
  onComplete
}: CompetencyQuizEngineProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuizAnswer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0;
  const answeredCount = answers.size;

  // Load questions based on role, industry, experience
  useEffect(() => {
    loadQuestions();
  }, [role, industry, experienceLevel]);

  const loadQuestions = async () => {
    try {
      setLoading(true);

      // 1. Load universal questions (applicable_roles contains '*')
      const { data: universalData, error: universalError } = await supabase
        .from('competency_questions' as any)
        .select('*')
        .contains('applicable_roles', ['*'])
        .lte('experience_level_min', experienceLevel)
        .gte('experience_level_max', experienceLevel)
        .order('display_order', { ascending: true});

      if (universalError) throw universalError;

      const universalQuestions = universalData || [];

      // 2. Generate dynamic skill verification questions from resume
      const { data: { user } } = await supabase.auth.getUser();
      let dynamicQuestions: QuizQuestion[] = [];

      if (user) {
        const { data: skillData, error: skillError } = await supabase.functions.invoke(
          'generate-skill-verification-questions',
          {
            body: {
              vault_id: vaultId,
              user_id: user.id
            }
          }
        );

        if (!skillError && skillData?.success) {
          dynamicQuestions = skillData.skill_questions || [];
          console.log(`Loaded ${dynamicQuestions.length} dynamic skill questions`);
        }
      }

      // 3. Combine universal + dynamic questions
      const allQuestions = [
        ...universalQuestions,
        ...dynamicQuestions
      ] as QuizQuestion[];

      setQuestions(allQuestions);

      toast.success(
        `Loaded ${universalQuestions.length} universal + ${dynamicQuestions.length} skill verification questions`
      );
    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: QuizAnswer) => {
    setAnswers(new Map(answers.set(currentQuestion.id, answer)));
  };

  const handleNext = async () => {
    // Save current answer
    const currentAnswer = answers.get(currentQuestion.id);
    if (currentAnswer) {
      await saveAnswer(currentAnswer);
    }

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowHelp(false);
    } else {
      // Quiz complete!
      await completeQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowHelp(false);
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowHelp(false);
    }
  };

  const saveAnswer = async (answer: QuizAnswer) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_quiz_responses' as any)
        .upsert({
          user_id: user.id,
          vault_id: vaultId,
          question_id: answer.question_id,
          answer_value: answer.answer_value,
          answer_text: answer.answer_text,
          linked_milestone_id: answer.linked_milestone_id,
          confidence_score: 100,
          quality_tier: 'gold'
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving answer:', error);
    }
  };

  const completeQuiz = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark quiz as complete
      const { error: completionError } = await supabase
        .from('user_quiz_completions' as any)
        .upsert({
          user_id: user.id,
          vault_id: vaultId,
          role,
          industry,
          experience_level: experienceLevel,
          total_questions: questions.length,
          questions_answered: answers.size,
          completion_percentage: (answers.size / questions.length) * 100,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (completionError) throw completionError;

      // Build competency profile from answers
      await buildCompetencyProfile(user.id);

      toast.success('Quiz completed! Building your competency profile...');

      onComplete({
        totalQuestions: questions.length,
        questionsAnswered: answers.size,
        completionPercentage: (answers.size / questions.length) * 100,
        coverageScore: calculateCoverageScore(),
        competenciesIdentified: new Set(Array.from(answers.values()).map((a: any) => a.competency_name)).size
      });

    } catch (error: any) {
      console.error('Error completing quiz:', error);
      toast.error('Failed to complete quiz');
    } finally {
      setSaving(false);
    }
  };

  const buildCompetencyProfile = async (userId: string) => {
    // Group answers by competency
    const competencyMap = new Map<string, any>();

    for (const [questionId, answer] of answers.entries()) {
      const question = questions.find(q => q.id === questionId);
      if (!question) continue;

      if (!competencyMap.has(question.competency_name)) {
        competencyMap.set(question.competency_name, {
          competency_name: question.competency_name,
          category: question.category,
          required_percentage: question.required_percentage,
          differentiator_weight: question.differentiator_weight,
          ats_keywords: question.ats_keywords,
          answers: []
        });
      }

      competencyMap.get(question.competency_name).answers.push({
        question,
        answer
      });
    }

    // Save to user_competency_profile
    for (const [_competencyName, competencyData] of competencyMap.entries()) {
      const { error } = await supabase
        .from('user_competency_profile' as any)
        .upsert({
          user_id: userId,
          vault_id: vaultId,
          competency_name: competencyData.competency_name,
          category: competencyData.category,
          has_experience: true,
          quality_tier: 'gold',
          evidence_type: 'quiz_verified',
          required_percentage: competencyData.required_percentage,
          differentiator_weight: competencyData.differentiator_weight,
          source_question_ids: competencyData.answers.map((a: any) => a.question.id)
        });

      if (error) console.error('Error saving competency profile:', error);
    }
  };

  const calculateCoverageScore = (): number => {
    // Calculate what % of expected competencies are covered
    const highValueQuestions = questions.filter(q => (q.required_percentage || 0) >= 70);
    const highValueAnswered = Array.from(answers.keys()).filter(qid => {
      const q = questions.find(question => question.id === qid);
      return q && (q.required_percentage || 0) >= 70;
    });

    return highValueQuestions.length > 0
      ? (highValueAnswered.length / highValueQuestions.length) * 100
      : 0;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading personalized quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No questions available for this role.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Career Competency Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {answeredCount} answered
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">
                {currentQuestion.question_text}
              </CardTitle>
              {currentQuestion.required_percentage && currentQuestion.required_percentage >= 70 && (
                <Badge variant="secondary" className="mb-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Required by {currentQuestion.required_percentage}% of {role} roles
                </Badge>
              )}
              <CardDescription className="text-sm">
                {currentQuestion.category}
              </CardDescription>
            </div>
            {currentQuestion.help_text && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
            )}
          </div>
          {showHelp && currentQuestion.help_text && (
            <div className="mt-4 p-4 bg-muted rounded-md text-sm">
              {currentQuestion.help_text}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Render answer input based on question type */}
          <QuestionInput
            question={currentQuestion}
            currentAnswer={answers.get(currentQuestion.id)}
            resumeMilestones={resumeMilestones}
            onAnswer={handleAnswer}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Skip
            </Button>

            <Button
              onClick={handleNext}
              disabled={!answers.has(currentQuestion.id) && currentQuestionIndex === questions.length - 1}
            >
              {currentQuestionIndex === questions.length - 1 ? (
                saving ? 'Completing...' : 'Complete Quiz'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Sub-component for rendering different question types
const QuestionInput = ({
  question,
  currentAnswer,
  onAnswer
}: {
  question: QuizQuestion;
  currentAnswer?: QuizAnswer;
  resumeMilestones: any[];
  onAnswer: (answer: QuizAnswer) => void;
}) => {
  const [localValue, setLocalValue] = useState<any>(currentAnswer?.answer_value || null);
  const [textInput, setTextInput] = useState<string>(currentAnswer?.answer_text || '');

  useEffect(() => {
    if (localValue !== null) {
      onAnswer({
        question_id: question.id,
        answer_value: localValue,
        answer_text: textInput
      });
    }
  }, [localValue, textInput]);

  switch (question.question_type) {
    case 'multiple_choice':
      const options = question.answer_options || [];
      return (
        <RadioGroup value={localValue} onValueChange={setLocalValue}>
          {options.map((option: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted border border-border bg-secondary dark:bg-muted">
              <RadioGroupItem value={option.value} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-foreground">
                {option.label}
                {option.score && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({option.score} pts)
                  </span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'scale':
      const scaleOptions = question.answer_options || [];
      return (
        <div className="space-y-2">
          {scaleOptions.map((option: any) => (
            <Button
              key={option.value}
              variant={localValue === option.value ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setLocalValue(option.value)}
            >
              <span className="font-bold mr-3">{option.value}</span>
              {option.label}
            </Button>
          ))}
        </div>
      );

    case 'numeric':
      return (
        <div className="space-y-2">
          <Input
            type="number"
            value={localValue || ''}
            onChange={(e) => setLocalValue(parseInt(e.target.value))}
            placeholder="Enter a number"
            className="text-lg"
          />
        </div>
      );

    case 'multi_select':
      const multiOptions = question.answer_options || [];
      const selectedValues = localValue || [];
      return (
        <div className="space-y-2">
          {multiOptions.map((option: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted">
              <Checkbox
                checked={selectedValues.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setLocalValue([...selectedValues, option.value]);
                  } else {
                    setLocalValue(selectedValues.filter((v: string) => v !== option.value));
                  }
                }}
                id={`multi-${index}`}
              />
              <Label htmlFor={`multi-${index}`} className="flex-1 cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      );

    case 'text_input':
      return (
        <Textarea
          value={textInput}
          onChange={(e) => {
            setTextInput(e.target.value);
            setLocalValue(e.target.value);
          }}
          placeholder="Share your experience..."
          className="min-h-[120px]"
        />
      );

    default:
      return <p className="text-muted-foreground">Unsupported question type</p>;
  }
};
