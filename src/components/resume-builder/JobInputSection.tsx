import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobInputSectionProps {
  onAnalyze: (jobText: string) => void;
  isAnalyzing: boolean;
  initialJobText?: string;
  autoLoaded?: boolean;
}

export const JobInputSection = ({ 
  onAnalyze, 
  isAnalyzing, 
  initialJobText = "",
  autoLoaded = false 
}: JobInputSectionProps) => {
  const [jobText, setJobText] = useState(initialJobText);
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!jobText.trim()) {
      toast({
        title: "No job description",
        description: "Please enter or paste a job description",
        variant: "destructive"
      });
      return;
    }
    onAnalyze(jobText);
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] p-6">
      <Card className="w-full max-w-3xl p-8 space-y-6">
        {autoLoaded && (
          <Alert className="border-primary/20 bg-primary/5">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription>
              Job description loaded from your search results
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center space-y-2">
          <FileText className="h-12 w-12 mx-auto text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Upload Job Description to Begin</h2>
          <p className="text-muted-foreground">
            Paste or type the job description to analyze requirements and build a tailored resume
          </p>
        </div>

        <div className="space-y-4">
          <Textarea
            placeholder="Paste or type the full job description here..."
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />

          <div className="flex justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !jobText.trim()}
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Job...
                </>
              ) : (
                "Analyze Job & Build Resume"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
