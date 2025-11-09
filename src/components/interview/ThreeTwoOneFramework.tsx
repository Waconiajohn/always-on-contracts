import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Award, HelpCircle, MessageSquare, Copy, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { validateInput, invokeEdgeFunction, Generate321FrameworkSchema } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";

interface ThreeTwoOneFrameworkProps {
  jobDescription: string;
  companyResearch: any;
  vaultId: string;
}

export function ThreeTwoOneFramework({ jobDescription, companyResearch, vaultId }: ThreeTwoOneFrameworkProps) {
  const [loading, setLoading] = useState(false);
  const [framework, setFramework] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const generateFramework = async () => {
    setLoading(true);
    try {
      const validated = validateInput(Generate321FrameworkSchema, {
        jobDescription,
        vaultId
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'generate-3-2-1-framework',
        { ...validated, companyResearch },
        {
          showSuccessToast: true,
          successMessage: 'Your interview essentials have been created'
        }
      );

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Generation failed');
      }

      setFramework(data);
    } catch (error: any) {
      logger.error('3-2-1 framework generation failed', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="space-y-4">
      {!framework ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              The 3-2-1 Framework
            </CardTitle>
            <CardDescription>
              3 Examples | 2 Smart Questions | 1 Closing Statement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateFramework} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate 3-2-1 Framework"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 3 Examples */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                <Award className="h-4 w-4 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold">3 Proof Examples</h3>
            </div>
            <div className="space-y-3">
              {framework.examples?.map((example: any, idx: number) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">Example {idx + 1}</Badge>
                        </div>
                        <CardTitle className="text-base">{example.requirement}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(example.proof_story, `example-${idx}`)}
                      >
                        {copied === `example-${idx}` ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-3 space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Your Proof:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {example.proof_story}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/5 rounded-lg">
                      <p className="text-xs font-medium mb-1">💡 Why This Works:</p>
                      <p className="text-xs text-muted-foreground">{example.why_works}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 2 Smart Questions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                <HelpCircle className="h-4 w-4 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">2 Smart Questions</h3>
            </div>
            <div className="space-y-3">
              {framework.questions?.map((q: any, idx: number) => (
                <Card key={idx} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Badge variant="secondary" className="mb-2">Question {idx + 1}</Badge>
                        <CardTitle className="text-base">{q.question}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(q.question, `question-${idx}`)}
                      >
                        {copied === `question-${idx}` ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-3">
                    <div className="p-3 bg-green-500/5 rounded-lg">
                      <p className="text-xs font-medium mb-1">🎯 Why It's Smart:</p>
                      <p className="text-xs text-muted-foreground">{q.why_smart}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 1 Closing Statement */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                <MessageSquare className="h-4 w-4 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold">1 Closing Statement</h3>
            </div>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Your Confident Close</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(framework.closing_statement, 'closing')}
                  >
                    {copied === 'closing' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">
                  "{framework.closing_statement}"
                </p>
              </CardContent>
            </Card>
          </div>

          <Button onClick={generateFramework} variant="outline" className="w-full">
            Regenerate Framework
          </Button>
        </div>
      )}
    </div>
  );
}
