import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InterviewResponsesTabProps {
  question: string;
  vaultId: string;
}

export function InterviewResponsesTab({ question, vaultId }: InterviewResponsesTabProps) {
  const [response, setResponse] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!response.trim()) {
      toast({
        title: "Response required",
        description: "Please write your answer first",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-interview-response-with-audit', {
        body: {
          question,
          response,
          vaultId
        }
      });

      if (error) throw error;
      setAnalysis(data);
      toast({
        title: "Analysis complete!",
        description: "Your response has been reviewed by dual AI systems"
      });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Response</CardTitle>
          <CardDescription>Write your answer using the STAR method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-2">Question:</p>
            <p className="text-sm">{question}</p>
          </div>

          <Textarea
            placeholder="Write your response here using STAR method (Situation, Task, Action, Result)..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={12}
            className="resize-none"
          />

          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !response.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing with Dual AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Response
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Overall Score</CardTitle>
                <div className="text-4xl font-bold text-primary">
                  {analysis.overallScore}/100
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">STAR Method</span>
                  <span className="text-sm">{analysis.starAnalysis?.score}/25</span>
                </div>
                <Progress value={(analysis.starAnalysis?.score / 25) * 100} />
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.starAnalysis?.feedback}
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Vault Alignment</span>
                  <span className="text-sm">{analysis.vaultAlignment?.score}/25</span>
                </div>
                <Progress value={(analysis.vaultAlignment?.score / 25) * 100} />
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.vaultAlignment?.feedback}
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Specificity</span>
                  <span className="text-sm">{analysis.specificity?.score}/25</span>
                </div>
                <Progress value={(analysis.specificity?.score / 25) * 100} />
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.specificity?.feedback}
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Impact</span>
                  <span className="text-sm">{analysis.impact?.score}/25</span>
                </div>
                <Progress value={(analysis.impact?.score / 25) * 100} />
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.impact?.feedback}
                </p>
              </div>
            </CardContent>
          </Card>

          {analysis.strengths?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {analysis.improvements?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-orange-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.improvements.map((improvement: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-orange-500 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={improvement.priority === 'high' ? 'destructive' : 'secondary'}>
                          {improvement.priority}
                        </Badge>
                        <p className="text-sm font-medium">{improvement.suggestion}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{improvement.impact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.geminiAnalysis && analysis.perplexityAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Dual AI Perspectives</CardTitle>
                <CardDescription>Two AI systems reviewed your response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm font-medium mb-2">🤖 Primary AI Analysis</p>
                  <p className="text-xs text-muted-foreground">{analysis.geminiAnalysis.summary}</p>
                </div>
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-sm font-medium mb-2">🔍 Verification AI Fact-Check</p>
                  <p className="text-xs text-muted-foreground">{analysis.perplexityAnalysis.summary}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}