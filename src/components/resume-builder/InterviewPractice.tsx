import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  CheckCircle2,
  Target,
  Sparkles,
  Clock,
  Mic,
  MicOff,
  ThumbsUp,
  AlertCircle,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InterviewQuestion {
  question: string;
  type: 'behavioral' | 'technical' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  why_asked: string;
  good_answer_elements: string[];
  related_requirement?: string;
}

interface AnswerFeedback {
  is_sufficient: boolean;
  quality_score: number;
  missing_elements: string[];
  follow_up_prompt: string;
  strengths?: string[];
  guided_prompts?: Record<string, { question: string; options: string[] }>;
}

interface InterviewPracticeProps {
  projectId: string;
}

type QuestionType = 'behavioral' | 'technical' | 'situational' | 'mixed';
type Difficulty = 'entry' | 'mid' | 'senior';

export function InterviewPractice({ projectId }: InterviewPracticeProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questionType, setQuestionType] = useState<QuestionType>('mixed');
  const [difficulty, setDifficulty] = useState<Difficulty>('mid');
  const [roleContext, setRoleContext] = useState<{
    common_interview_format?: string;
    key_competencies_tested?: string[];
  } | null>(null);
  const [preparationTips, setPreparationTips] = useState<string[]>([]);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, AnswerFeedback>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await supabase.functions.invoke('rb-interview-practice', {
        body: {
          project_id: projectId,
          question_type: questionType,
          difficulty,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setRoleContext(data.role_context || null);
        setPreparationTips(data.preparation_tips || []);
        setCurrentQuestionIndex(0);
        setCompletedQuestions(new Set());
        setUserAnswer('');
        setFeedback({});
        toast.success(`Generated ${data.questions.length} interview questions`);
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast.error('Failed to generate questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setCompletedQuestions(prev => new Set([...prev, currentQuestionIndex]));
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setShowHints(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setUserAnswer('');
      setShowHints(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.info('Recording stopped');
    } else {
      setIsRecording(true);
      toast.info('Recording started - speak your answer');
      // In a real implementation, this would use the Web Speech API
    }
  };

  const evaluateAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim()) {
      toast.error('Please write an answer first');
      return;
    }

    setIsEvaluating(true);
    try {
      const response = await supabase.functions.invoke('validate-interview-response', {
        body: {
          question: currentQuestion.question,
          answer: userAnswer,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const feedbackData = response.data as AnswerFeedback;
      setFeedback(prev => ({
        ...prev,
        [currentQuestionIndex]: feedbackData,
      }));

      if (feedbackData.is_sufficient) {
        toast.success('Great answer!');
      } else {
        toast.info('Feedback received - check the suggestions below');
      }
    } catch (error) {
      console.error('Failed to evaluate answer:', error);
      toast.error('Failed to evaluate answer');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
    if (score >= 60) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((completedQuestions.size / questions.length) * 100) : 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'behavioral': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'technical': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
      case 'situational': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return '';
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Interview Practice</CardTitle>
            </div>
            {questions.length > 0 && (
              <Badge variant="outline">
                {completedQuestions.size} / {questions.length} completed
              </Badge>
            )}
          </div>
          <CardDescription>
            Practice answering questions tailored to your resume and target role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Settings Row */}
          <div className="flex items-center gap-3">
            <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed Questions</SelectItem>
                <SelectItem value="behavioral">Behavioral Only</SelectItem>
                <SelectItem value="technical">Technical Only</SelectItem>
                <SelectItem value="situational">Situational Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={generateQuestions}
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Generating...
                </>
              ) : questions.length > 0 ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Questions
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Practice
                </>
              )}
            </Button>
          </div>

          {/* Progress */}
          {questions.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preparation Tips */}
      {preparationTips.length > 0 && questions.length > 0 && (
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-sm">Preparation Tips</CardTitle>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ul className="space-y-1.5">
                  {preparationTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                {roleContext?.common_interview_format && (
                  <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium">Typical Interview Format</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {roleContext.common_interview_format}
                    </p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Current Question */}
      {currentQuestion && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </Badge>
                  <Badge className={`text-xs ${getTypeColor(currentQuestion.type)}`}>
                    {currentQuestion.type}
                  </Badge>
                  <Badge className={`text-xs ${getDifficultyColor(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
              </div>
              {completedQuestions.has(currentQuestionIndex) && (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              )}
            </div>

            {currentQuestion.related_requirement && (
              <div className="flex items-center gap-1.5 mt-2">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Tests: {currentQuestion.related_requirement}
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Answer Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Your Answer</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleRecording}
                  className={isRecording ? 'text-red-600' : ''}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4 mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-1" />
                      Record
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type or record your answer here. Use the STAR method for behavioral questions: Situation, Task, Action, Result."
                className="min-h-[150px] resize-none"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Aim for 1-2 minutes when speaking
                </span>
                <span>{userAnswer.split(/\s+/).filter(Boolean).length} words</span>
              </div>

              {/* Get Feedback Button */}
              <Button
                onClick={evaluateAnswer}
                disabled={isEvaluating || !userAnswer.trim()}
                variant="secondary"
                className="w-full"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Feedback
                  </>
                )}
              </Button>
            </div>

            {/* Feedback Display */}
            {feedback[currentQuestionIndex] && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                {/* Score Header */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Answer Analysis
                  </h4>
                  <Badge className={getScoreColor(feedback[currentQuestionIndex].quality_score)}>
                    {feedback[currentQuestionIndex].quality_score}/100
                  </Badge>
                </div>

                {/* Feedback Message */}
                <p className="text-sm text-muted-foreground">
                  {feedback[currentQuestionIndex].follow_up_prompt}
                </p>

                {/* Strengths */}
                {feedback[currentQuestionIndex].strengths && feedback[currentQuestionIndex].strengths!.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      Strengths
                    </p>
                    <ul className="space-y-1">
                      {feedback[currentQuestionIndex].strengths!.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Elements */}
                {feedback[currentQuestionIndex].missing_elements.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Areas to Improve
                    </p>
                    <ul className="space-y-1">
                      {feedback[currentQuestionIndex].missing_elements.map((element, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{element}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Guided Prompts for Improvement */}
                {feedback[currentQuestionIndex].guided_prompts && Object.keys(feedback[currentQuestionIndex].guided_prompts!).length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-amber-500" />
                      Consider adding:
                    </p>
                    <div className="grid gap-2">
                      {Object.entries(feedback[currentQuestionIndex].guided_prompts!).map(([key, prompt]) => (
                        <div key={key} className="text-sm p-2 bg-background rounded border">
                          <p className="font-medium text-xs mb-1">{prompt.question}</p>
                          <div className="flex flex-wrap gap-1">
                            {prompt.options.slice(0, 4).map((option, i) => (
                              <Badge key={i} variant="outline" className="text-xs font-normal">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hints Toggle */}
            <Collapsible open={showHints} onOpenChange={setShowHints}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm">
                      {showHints ? 'Hide hints' : 'Show hints for a strong answer'}
                    </span>
                  </span>
                  {showHints ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                {/* Why Asked */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Why interviewers ask this
                  </p>
                  <p className="text-sm">{currentQuestion.why_asked}</p>
                </div>

                {/* Good Answer Elements */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Strong answers include
                  </p>
                  <ul className="space-y-1.5">
                    {currentQuestion.good_answer_elements.map((element, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{element}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1 && completedQuestions.has(currentQuestionIndex)}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next Question'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Question Navigator */}
      {questions.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground mr-2">Jump to:</span>
              {questions.map((q, i) => (
                <Button
                  key={i}
                  variant={i === currentQuestionIndex ? 'default' : completedQuestions.has(i) ? 'secondary' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => {
                    setCurrentQuestionIndex(i);
                    setUserAnswer('');
                    setShowHints(false);
                  }}
                >
                  {completedQuestions.has(i) ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    i + 1
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {questions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg mb-2">Ready to Practice?</CardTitle>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Generate interview questions tailored to your resume and the job description.
              Practice answering to build confidence for your real interview.
            </p>
            <Button onClick={generateQuestions} disabled={isLoading}>
              <Play className="h-4 w-4 mr-2" />
              Generate Questions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
