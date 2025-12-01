import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { ResumeAssessment, ResumeSection, HiringManagerFeedback, ATSReport } from "@/types/mustInterviewBuilder";
import { 
  Download, 
  FileText, 
  CheckCircle2,
  Loader2,
  Target,
  TrendingUp,
  Save,
  Copy,
  ExternalLink
} from "lucide-react";

interface FinalizeExportProps {
  sections: ResumeSection[];
  assessment: ResumeAssessment | null;
  jobDescription: string;
  selectedFormat: string | null;
  hiringManagerFeedback: HiringManagerFeedback | null;
  initialScore: number | null;
  currentScore: number | null;
  onATSReport: (report: ATSReport) => void;
  onBack: () => void;
}

export const FinalizeExport = ({
  sections,
  assessment,
  jobDescription,
  selectedFormat,
  hiringManagerFeedback,
  initialScore,
  currentScore,
  onATSReport,
  onBack
}: FinalizeExportProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRunningATS, setIsRunningATS] = useState(false);
  const [atsReport, setAtsReport] = useState<ATSReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Convert sections to formatted text
  const resumeText = sections
    .map(s => `${s.title}\n${s.items.map(i => i.content).join('\n')}`)
    .join('\n\n');

  // Run ATS check on mount
  useEffect(() => {
    runATSCheck();
  }, []);

  const runATSCheck = async () => {
    setIsRunningATS(true);

    try {
      // Use instant-resume-score for ATS analysis
      const { data, error } = await supabase.functions.invoke('instant-resume-score', {
        body: {
          resumeContent: resumeText,
          jobDescription,
          industry: assessment?.industry || '',
          roleTitle: assessment?.roleTitle || ''
        }
      });

      if (error) throw error;

      const report: ATSReport = {
        score: data?.totalScore || data?.atsScore || 75,
        keywordMatches: assessment?.atsKeywords?.critical?.map((kw: string) => ({
          keyword: kw,
          found: resumeText.toLowerCase().includes(kw.toLowerCase()),
          context: undefined
        })) || [],
        formatIssues: data?.formatIssues || [],
        recommendations: data?.recommendations || []
      };

      setAtsReport(report);
      onATSReport(report);

    } catch (error) {
      console.error('ATS check error:', error);
      // Provide default report
      setAtsReport({
        score: 70,
        keywordMatches: [],
        formatIssues: [],
        recommendations: ['Unable to run full ATS analysis']
      });
    } finally {
      setIsRunningATS(false);
    }
  };

  const handleSaveResume = async () => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save resume data - using any cast as the schema may vary
      const resumeData: any = {
        user_id: user.id,
        job_title: assessment?.roleTitle || 'Untitled',
        job_company: assessment?.companyName,
        sections,
        job_analysis: assessment,
        selected_format: selectedFormat,
        ats_score: atsReport?.score
      };

      const { error } = await supabase.from('resumes').insert(resumeData as any);

      if (error) throw error;

      toast({
        title: "Resume saved!",
        description: "Your résumé has been saved to My Resumes",
      });

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    setIsExporting(true);

    try {
      // For now, copy to clipboard - PDF/DOCX generation would require additional backend
      await navigator.clipboard.writeText(resumeText);
      
      toast({
        title: "Copied to clipboard!",
        description: `Your résumé content has been copied. ${format.toUpperCase()} export coming soon!`,
      });

      // TODO: Implement actual PDF/DOCX generation
      // const { data, error } = await supabase.functions.invoke('generate-resume-document', {
      //   body: { sections, format, selectedFormat }
      // });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Please try copying the content manually",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resumeText);
      toast({
        title: "Copied!",
        description: "Résumé content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const scoreImprovement = (currentScore || 0) - (initialScore || 0);
  const finalScore = currentScore || atsReport?.score || 70;
  const isMustInterview = finalScore >= 80;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={cn(
            "p-3 rounded-full",
            isMustInterview ? "bg-green-500/10" : "bg-primary/10"
          )}>
            {isMustInterview ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <Target className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {isMustInterview ? "🎉 Your Must-Interview Résumé is Ready!" : "Your Résumé is Ready for Export"}
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {isMustInterview 
            ? "Congratulations! You've reached must-interview status for this role."
            : "Review the final version and export when ready."
          }
        </p>
      </div>

      {/* Score Summary */}
      <Card className={cn(
        "border-2",
        isMustInterview ? "border-green-500/50 bg-green-500/5" : "border-primary/30"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "text-5xl font-bold",
                finalScore >= 80 ? "text-green-500" :
                finalScore >= 60 ? "text-amber-500" : "text-red-500"
              )}>
                {finalScore}
              </div>
              <div>
                <h3 className="font-semibold">Final Score</h3>
                <p className="text-sm text-muted-foreground">
                  {isMustInterview ? "Must-Interview Status" : `${80 - finalScore} points to Must-Interview`}
                </p>
              </div>
            </div>
            {scoreImprovement > 0 && (
              <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-lg">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">+{scoreImprovement} points improved!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ATS Check */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            ATS Compatibility Check
          </CardTitle>
          <CardDescription>
            Ensuring your résumé passes applicant tracking systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRunningATS ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-muted-foreground">Running ATS analysis...</span>
            </div>
          ) : atsReport ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ATS Score</span>
                <Badge variant={atsReport.score >= 80 ? "default" : "secondary"}>
                  {atsReport.score}/100
                </Badge>
              </div>
              
              {/* Keyword Matches */}
              {atsReport.keywordMatches.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Critical Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {atsReport.keywordMatches.slice(0, 10).map((kw, i) => (
                      <Badge 
                        key={i} 
                        variant={kw.found ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {kw.found ? "✓" : "✗"} {kw.keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {atsReport.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recommendations</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {atsReport.recommendations.slice(0, 3).map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Resume Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Résumé Preview</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 max-h-[400px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-sans">
              {resumeText || "No content generated"}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Your Résumé</CardTitle>
          <CardDescription>
            Download in your preferred format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <Download className="h-6 w-6" />
              <span className="font-medium">Download PDF</span>
              <span className="text-xs text-muted-foreground">Best for applications</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => handleExport('docx')}
              disabled={isExporting}
            >
              <FileText className="h-6 w-6" />
              <span className="font-medium">Download DOCX</span>
              <span className="text-xs text-muted-foreground">Editable format</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={handleCopyToClipboard}
            >
              <Copy className="h-6 w-6" />
              <span className="font-medium">Copy to Clipboard</span>
              <span className="text-xs text-muted-foreground">Paste anywhere</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back to Review
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveResume}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save to My Resumes
          </Button>
          <Button
            onClick={() => navigate('/job-search')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Find Jobs to Apply
          </Button>
        </div>
      </div>
    </div>
  );
};
