import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { interview } from "@/lib/mcp-client";
import { supabase } from "@/integrations/supabase/client";
import { Brain, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InterviewPrepPanelProps {
  userId: string;
  jobDescription?: string;
}

export const InterviewPrepPanel = ({ userId, jobDescription }: InterviewPrepPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [starStories, setStarStories] = useState<any[]>([]);
  const { toast } = useToast();

  const generateQuestions = async () => {
    if (!jobDescription) {
      toast({
        title: "Job Description Required",
        description: "Please provide a job description to generate questions",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await interview.generateQuestions(userId, jobDescription);
      setQuestions(result.data?.questions || [result.data]);
      if (result.data?.questions?.[0]) {
        setCurrentQuestion(result.data.questions[0]);
      }
      toast({
        title: "Questions Generated",
        description: "AI-powered interview questions are ready",
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate interview questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateResponse = async () => {
    if (!currentQuestion || !response) return;

    setLoading(true);
    try {
      const result = await interview.validateResponse(
        currentQuestion.question || currentQuestion,
        response,
        { jobDescription }
      );
      setFeedback(result.data);
      toast({
        title: "Response Evaluated",
        description: `Score: ${result.data?.score || 'N/A'}/10`,
      });
    } catch (error) {
      console.error('Error validating response:', error);
      toast({
        title: "Error",
        description: "Failed to validate response",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStarStories = async () => {
    setLoading(true);
    try {
      const result = await interview.getStarStories(userId);
      setStarStories(result.data || []);
    } catch (error) {
      console.error('Error loading STAR stories:', error);
      toast({
        title: "Error",
        description: "Failed to load STAR stories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="practice" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="practice">Practice Questions</TabsTrigger>
          <TabsTrigger value="stories" onClick={loadStarStories}>STAR Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Interview Practice
              </CardTitle>
              <CardDescription>
                Generate AI-powered interview questions and get instant feedback on your responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentQuestion ? (
                <Button onClick={generateQuestions} disabled={loading || !jobDescription}>
                  {loading ? "Generating..." : "Generate Practice Questions"}
                </Button>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-semibold mb-2 block">Question:</Label>
                    <p className="text-lg">{currentQuestion.question || currentQuestion}</p>
                    {currentQuestion.type && (
                      <Badge variant="outline" className="mt-2">
                        {currentQuestion.type}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="response">Your Response:</Label>
                    <Textarea
                      id="response"
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={6}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={validateResponse} disabled={loading || !response}>
                      {loading ? "Evaluating..." : "Get Feedback"}
                    </Button>
                    <Button variant="outline" onClick={generateQuestions} disabled={loading}>
                      New Question
                    </Button>
                  </div>

                  {feedback && (
                    <Card className="border-primary">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {feedback.score >= 7 ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                          Score: {feedback.score}/10
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {feedback.strengths && feedback.strengths.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Strengths:</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {feedback.strengths.map((strength: string, i: number) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {feedback.improvements && feedback.improvements.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Areas for Improvement:</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {feedback.improvements.map((improvement: string, i: number) => (
                                <li key={i}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {feedback.suggestions && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Suggestions:</h4>
                            <p className="text-sm text-muted-foreground">{feedback.suggestions}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Your STAR Stories
              </CardTitle>
              <CardDescription>
                Build and manage your STAR (Situation, Task, Action, Result) stories for behavioral interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              {starStories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No STAR stories yet</p>
                  <Button onClick={() => {
                    // Navigate to STAR story builder
                    window.location.href = '/agents/interview-prep';
                  }}>
                    Create Your First Story
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {starStories.map((story) => (
                    <Card key={story.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{story.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold">Situation:</span>
                          <p className="text-muted-foreground mt-1">{story.situation}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Task:</span>
                          <p className="text-muted-foreground mt-1">{story.task}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Action:</span>
                          <p className="text-muted-foreground mt-1">{story.action}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Result:</span>
                          <p className="text-muted-foreground mt-1">{story.result}</p>
                        </div>
                        {story.skills && story.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {story.skills.map((skill: string, i: number) => (
                              <Badge key={i} variant="secondary">{skill}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
