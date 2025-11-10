import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Target,
  RefreshCw,
  Play
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { invokeEdgeFunction, GenerateInterviewPrepSchema, safeValidateInput } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

interface InterviewQuestion {
  id: string;
  category: 'behavioral' | 'technical' | 'situational' | 'leadership';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  context: string;
  tips: string[];
  starFramework?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

interface InterviewPrepProps {
  resumeContent?: string;
  jobTitle?: string;
  jobDescription?: string;
  onGenerate?: (questions: InterviewQuestion[]) => void;
  loading?: boolean;
}

export function InterviewPrep({
  resumeContent,
  jobTitle,
  jobDescription,
  onGenerate,
  loading = false
}: InterviewPrepProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [analyzingResponse, setAnalyzingResponse] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const mockQuestions: InterviewQuestion[] = [
    {
      id: '1',
      category: 'leadership',
      difficulty: 'hard',
      question: "Tell me about a time when you had to lead a team through a significant organizational change. What was your approach and what were the results?",
      context: "This question assesses your change management and leadership skills, which are critical for the role.",
      tips: [
        "Use the STAR method to structure your answer",
        "Quantify the scope of change (team size, budget, timeline)",
        "Highlight both the process and the people management aspects",
        "Emphasize measurable outcomes and lessons learned"
      ],
      starFramework: {
        situation: "Describe the organizational change context and why it was necessary",
        task: "Explain your role and responsibilities in leading the change",
        action: "Detail the specific steps you took to manage the transition",
        result: "Share quantifiable outcomes and long-term impact"
      }
    },
    {
      id: '2',
      category: 'behavioral',
      difficulty: 'medium',
      question: "Describe a situation where you had to make a difficult decision with incomplete information. How did you approach it?",
      context: "Tests decision-making skills and ability to work with ambiguity.",
      tips: [
        "Explain your decision-making framework",
        "Discuss how you gathered available data",
        "Show how you mitigated risks",
        "Reflect on the outcome and what you learned"
      ]
    },
    {
      id: '3',
      category: 'technical',
      difficulty: 'medium',
      question: "Walk me through your approach to developing and implementing a strategic plan. What frameworks or methodologies do you use?",
      context: "Evaluates strategic thinking and planning capabilities.",
      tips: [
        "Mention specific frameworks (e.g., OKRs, Balanced Scorecard)",
        "Discuss stakeholder engagement process",
        "Explain how you track progress and adjust",
        "Include examples from your experience"
      ]
    },
    {
      id: '4',
      category: 'situational',
      difficulty: 'hard',
      question: "If you joined our organization and discovered that your team was underperforming and morale was low, what would be your 30-60-90 day plan?",
      context: "Tests your ability to assess situations and create action plans.",
      tips: [
        "Show systematic approach to assessment",
        "Balance quick wins with long-term solutions",
        "Demonstrate people-first leadership",
        "Be specific about metrics and milestones"
      ]
    },
    {
      id: '5',
      category: 'behavioral',
      difficulty: 'medium',
      question: "Tell me about a time when you had to influence senior stakeholders who disagreed with your recommendation. How did you handle it?",
      context: "Assesses influencing skills and executive presence.",
      tips: [
        "Emphasize data-driven approach",
        "Show respect for different perspectives",
        "Demonstrate political savvy",
        "Highlight the importance of relationship-building"
      ]
    }
  ];

  const handleGenerateQuestions = async () => {
    if (!resumeContent || !jobDescription) {
      toast.error("Please provide resume and job description");
      return;
    }

    const validation = safeValidateInput(GenerateInterviewPrepSchema, {
      resumeContent,
      jobTitle,
      jobDescription
    });
    if (!validation.success) {
      return;
    }

    setGeneratingQuestions(true);
    
    try {
      const { data, error } = await invokeEdgeFunction(
        'generate-interview-prep',
        { resumeContent, jobTitle, jobDescription }
      );

      if (error) {
        logger.error('Interview prep failed', error);
        throw new Error(error.message);
      }

      if (!data?.success || !data?.questions) {
        throw new Error('Invalid response from interview prep service');
      }

      setQuestions(data.questions);
      onGenerate?.(data.questions);
      toast.success(`Generated ${data.questions.length} interview questions!`);
    } catch (error: any) {
      logger.error('Failed to generate questions', error);
      toast.error(error.message || 'Failed to generate questions. Please try again.');
      // Fallback to mock questions if AI fails
      setQuestions(mockQuestions);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleAnalyzeResponse = async () => {
    if (!userResponse.trim()) {
      toast.error("Please provide your response first");
      return;
    }

    setAnalyzingResponse(true);

    // Mock analysis
    setTimeout(() => {
      const mockFeedback = {
        score: 78,
        strengths: [
          "Good use of specific examples and metrics",
          "Clear structure following STAR framework",
          "Demonstrated leadership qualities effectively"
        ],
        improvements: [
          "Could elaborate more on the results and impact",
          "Consider adding more emotional intelligence aspects",
          "Quantify the team size and budget managed"
        ],
        starAnalysis: {
          situation: { score: 85, feedback: "Well-defined context" },
          task: { score: 80, feedback: "Clear role explanation" },
          action: { score: 75, feedback: "Good detail, could add more specifics" },
          result: { score: 70, feedback: "Add more quantifiable metrics" }
        },
        improvedVersion: userResponse + "\n\nAdditionally, this initiative resulted in a 35% increase in team productivity and saved the organization $2M annually through improved processes."
      };

      setFeedback(mockFeedback);
      setAnalyzingResponse(false);
      toast.success("Response analyzed!");
    }, 2000);
  };

  const currentQuestion = questions[currentQuestionIndex];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      behavioral: 'bg-blue-500',
      technical: 'bg-purple-500',
      situational: 'bg-green-500',
      leadership: 'bg-orange-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive'> = {
      easy: 'secondary',
      medium: 'default',
      hard: 'destructive'
    };
    return colors[difficulty] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Interview Preparation
          </CardTitle>
          <CardDescription>
            AI-generated interview questions tailored to your resume and target role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobTitle && (
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Preparing for: {jobTitle}</p>
              </AlertDescription>
            </Alert>
          )}

          {questions.length === 0 ? (
            <Button
              onClick={handleGenerateQuestions}
              disabled={generatingQuestions || loading || !resumeContent || !jobDescription}
              className="w-full"
              size="lg"
            >
              {generatingQuestions ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Interview Questions
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{questions.length} questions generated</p>
                <Progress value={(currentQuestionIndex / questions.length) * 100} className="w-40" />
              </div>
              <Button variant="outline" onClick={handleGenerateQuestions} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
          )}

          {!resumeContent && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                Please generate a resume first to create tailored interview questions
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Questions & Practice */}
      {questions.length > 0 && currentQuestion && (
        <Tabs defaultValue="question" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="all">All Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="question" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(currentQuestion.category)}>
                        {currentQuestion.category}
                      </Badge>
                      <Badge variant={getDifficultyColor(currentQuestion.difficulty)}>
                        {currentQuestion.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-lg font-medium">{currentQuestion.question}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <p className="font-semibold">Why This Question Matters</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentQuestion.context}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <p className="font-semibold">Tips for Answering</p>
                  </div>
                  <ul className="space-y-2">
                    {currentQuestion.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {currentQuestion.starFramework && (
                  <Card className="bg-accent/30">
                    <CardHeader>
                      <CardTitle className="text-base">STAR Framework Guide</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-semibold text-sm">Situation</p>
                        <p className="text-sm text-muted-foreground">{currentQuestion.starFramework.situation}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Task</p>
                        <p className="text-sm text-muted-foreground">{currentQuestion.starFramework.task}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Action</p>
                        <p className="text-sm text-muted-foreground">{currentQuestion.starFramework.action}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Result</p>
                        <p className="text-sm text-muted-foreground">{currentQuestion.starFramework.result}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="flex-1"
                  >
                    Next Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Practice Your Response</CardTitle>
                <CardDescription>
                  Write or speak your answer and get AI feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="font-medium">{currentQuestion.question}</p>
                </div>

                <Textarea
                  placeholder="Type your response here... Aim for 1-2 minutes when spoken (150-300 words)"
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  className="min-h-[200px]"
                />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{userResponse.split(/\s+/).filter(Boolean).length} words</span>
                  <span>Target: 150-300 words</span>
                </div>

                <Button
                  onClick={handleAnalyzeResponse}
                  disabled={analyzingResponse || !userResponse.trim()}
                  className="w-full"
                >
                  {analyzingResponse ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Get AI Feedback
                    </>
                  )}
                </Button>

                {feedback && (
                  <Card className="border-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">AI Feedback</CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{feedback.score}</span>
                          <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <p className="font-semibold text-sm">Strengths</p>
                        </div>
                        <ul className="space-y-1">
                          {feedback.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-warning" />
                          <p className="font-semibold text-sm">Areas for Improvement</p>
                        </div>
                        <ul className="space-y-1">
                          {feedback.improvements.map((improvement: string, index: number) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {feedback.starAnalysis && (
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">STAR Framework Analysis</p>
                          {Object.entries(feedback.starAnalysis).map(([key, value]: [string, any]) => (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="capitalize">{key}</span>
                                <span className="font-medium">{value.score}%</span>
                              </div>
                              <Progress value={value.score} />
                              <p className="text-xs text-muted-foreground">{value.feedback}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-2">Suggested Enhancement:</p>
                          <p className="text-sm">{feedback.improvedVersion}</p>
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-3">
            {questions.map((q, index) => (
              <Card
                key={q.id}
                className={`cursor-pointer transition-colors ${
                  index === currentQuestionIndex ? 'border-primary' : 'hover:border-primary/50'
                }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(q.category)} variant="default">
                          {q.category}
                        </Badge>
                        <Badge variant={getDifficultyColor(q.difficulty)}>
                          {q.difficulty}
                        </Badge>
                      </div>
                      <p className="font-medium">{q.question}</p>
                    </div>
                    {index === currentQuestionIndex && (
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
