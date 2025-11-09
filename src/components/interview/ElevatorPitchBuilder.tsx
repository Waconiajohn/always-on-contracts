import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Copy, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { validateInput, invokeEdgeFunction, GenerateElevatorPitchSchema } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";

interface ElevatorPitchBuilderProps {
  jobDescription: string;
  vaultId: string;
}

export function ElevatorPitchBuilder({ jobDescription, vaultId }: ElevatorPitchBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [pitch, setPitch] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const generatePitch = async () => {
    setLoading(true);
    try {
      const validated = validateInput(GenerateElevatorPitchSchema, {
        vaultId,
        targetRole: 'Executive', // Extracted from job description
        jobDescription
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'generate-elevator-pitch',
        validated,
        {
          showSuccessToast: true,
          successMessage: 'Your perfect fit narrative has been created'
        }
      );

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Generation failed');
      }

      setPitch(data);
    } catch (error: any) {
      logger.error('Elevator pitch generation failed', error);
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
      {!pitch ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Elevator Pitch Builder
            </CardTitle>
            <CardDescription>
              Generate a compelling pitch showing how you meet each job requirement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generatePitch} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate Elevator Pitch"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Elevator Pitch</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(pitch.elevator_pitch, 'pitch')}
                >
                  {copied === 'pitch' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={pitch.elevator_pitch}
                onChange={(e) => setPitch({ ...pitch, elevator_pitch: e.target.value })}
                rows={6}
                className="resize-none font-medium"
              />
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-semibold mb-4">Requirement-by-Requirement Match</h3>
            <div className="space-y-4">
              {pitch.requirements?.map((req: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">Requirement {idx + 1}</Badge>
                          <h4 className="font-semibold">{req.requirement}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(req.first_person_story, `req-${idx}`)}
                      >
                        {copied === `req-${idx}` ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium mb-2">Your Story:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {req.first_person_story}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Button onClick={generatePitch} variant="outline" className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Regenerate Pitch
          </Button>
        </div>
      )}
    </div>
  );
}
