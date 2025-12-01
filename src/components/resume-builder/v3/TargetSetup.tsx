import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ResumeAssessment, ResumeGap } from "@/types/mustInterviewBuilder";
import { 
  Upload, 
  FileText, 
  Briefcase, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  Target,
  ArrowRight
} from "lucide-react";

interface TargetSetupProps {
  initialResumeText: string;
  initialJobDescription: string;
  initialJobUrl: string;
  onComplete: (data: {
    resumeText: string;
    jobDescription: string;
    assessment: ResumeAssessment;
  }) => void;
}

export const TargetSetup = ({
  initialResumeText,
  initialJobDescription,
  initialJobUrl,
  onComplete
}: TargetSetupProps) => {
  const { toast } = useToast();
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [jobUrl, setJobUrl] = useState(initialJobUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setResumeFile(file);
    
    // Parse the file to extract text
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Try to parse PDF/DOCX
      const { data, error } = await supabase.functions.invoke('parse-resume-document', {
        body: formData
      });

      if (error) throw error;

      if (data?.text) {
        setResumeText(data.text);
        toast({
          title: "Résumé uploaded",
          description: `${file.name} parsed successfully`,
        });
      }
    } catch (error) {
      console.error('File parse error:', error);
      toast({
        title: "Could not parse file",
        description: "Please paste your résumé text instead",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both your résumé and the job description",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Step 1: Analyze job requirements
      const { data: jobAnalysis, error: jobError } = await supabase.functions.invoke('analyze-job-requirements', {
        body: { jobDescription }
      });

      if (jobError) throw jobError;

      // Step 2: Score the résumé against the job
      const { data: scoreResult, error: scoreError } = await supabase.functions.invoke('instant-resume-score', {
        body: { 
          resumeContent: resumeText,
          jobDescription,
          industry: jobAnalysis?.roleProfile?.industry || '',
          roleTitle: jobAnalysis?.roleProfile?.title || ''
        }
      });

      if (scoreError) throw scoreError;

      // Step 3: Match vault to requirements (for gap identification)
      const { data: { user } } = await supabase.auth.getUser();
      let vaultMatches = null;
      
      if (user) {
        try {
          const { data: matchData } = await supabase.functions.invoke('match-vault-to-requirements', {
            body: {
              userId: user.id,
              jobRequirements: jobAnalysis?.jobRequirements,
              industryStandards: jobAnalysis?.industryStandards,
              professionBenchmarks: jobAnalysis?.professionBenchmarks,
              atsKeywords: jobAnalysis?.atsKeywords
            }
          });
          vaultMatches = matchData;
        } catch (e) {
          console.log('Vault matching skipped:', e);
        }
      }

      // Construct the assessment object
      const assessment: ResumeAssessment = {
        alignmentScore: scoreResult?.totalScore || scoreResult?.score || 50,
        strengths: extractStrengths(jobAnalysis, vaultMatches),
        gaps: extractGaps(jobAnalysis, vaultMatches, resumeText),
        recommendedFormats: getRecommendedFormats(jobAnalysis?.roleProfile?.seniority),
        industry: jobAnalysis?.roleProfile?.industry || 'Unknown',
        profession: jobAnalysis?.roleProfile?.function || 'Unknown',
        seniority: jobAnalysis?.roleProfile?.seniority || 'mid-level',
        roleTitle: jobAnalysis?.roleProfile?.title || 'Unknown Position',
        companyName: jobAnalysis?.roleProfile?.company,
        atsKeywords: {
          critical: jobAnalysis?.atsKeywords?.critical || [],
          important: jobAnalysis?.atsKeywords?.important || [],
          niceToHave: jobAnalysis?.atsKeywords?.nice_to_have || []
        }
      };

      toast({
        title: "Analysis complete!",
        description: `Your résumé scores ${assessment.alignmentScore}/100 for this role`,
      });

      onComplete({
        resumeText,
        jobDescription,
        assessment
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper functions
  const extractStrengths = (jobAnalysis: any, vaultMatches: any) => {
    const strengths = [];
    
    if (vaultMatches?.matchedItems) {
      const strongMatches = vaultMatches.matchedItems
        .filter((m: any) => m.matchScore >= 70)
        .slice(0, 5);
      
      for (const match of strongMatches) {
        strengths.push({
          area: match.requirement || 'Matched requirement',
          evidence: match.vaultContent?.substring(0, 100) || 'Found in vault',
          confidence: match.matchScore / 100
        });
      }
    }

    return strengths;
  };

  const extractGaps = (jobAnalysis: any, vaultMatches: any, resume: string): ResumeGap[] => {
    const gaps: ResumeGap[] = [];
    const requirements = [
      ...(jobAnalysis?.jobRequirements?.required || []),
      ...(jobAnalysis?.jobRequirements?.preferred || []).slice(0, 3)
    ];

    const unmatchedReqs = vaultMatches?.unmatchedRequirements || requirements.slice(0, 5);

    for (let i = 0; i < Math.min(unmatchedReqs.length, 6); i++) {
      const req = typeof unmatchedReqs[i] === 'string' ? unmatchedReqs[i] : unmatchedReqs[i]?.requirement;
      if (!req) continue;

      const severity: 'critical' | 'important' | 'nice-to-have' = 
        i < 2 ? 'critical' : i < 4 ? 'important' : 'nice-to-have';

      gaps.push({
        id: `gap-${i}`,
        requirement: req,
        severity,
        currentContent: null,
        suggestions: [],
        userSelection: null
      });
    }

    return gaps;
  };

  const getRecommendedFormats = (seniority: string) => {
    const formats = [
      {
        id: 'executive',
        name: 'Executive',
        description: 'Emphasizes leadership and strategic impact',
        bestFor: 'Directors, VPs, C-Suite'
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Balanced format for experienced professionals',
        bestFor: 'Managers, Senior ICs, Specialists'
      },
      {
        id: 'technical',
        name: 'Technical',
        description: 'Highlights technical skills and projects',
        bestFor: 'Engineers, Developers, Technical Leads'
      }
    ];

    // Reorder based on seniority
    if (seniority === 'executive' || seniority === 'senior') {
      return [formats[0], formats[1], formats[2]];
    } else if (seniority === 'mid-level') {
      return [formats[1], formats[0], formats[2]];
    } else {
      return [formats[1], formats[2], formats[0]];
    }
  };

  const hasResume = resumeText.trim().length > 50;
  const hasJob = jobDescription.trim().length > 50;
  const canAnalyze = hasResume && hasJob;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Target className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Build Your Must-Interview Résumé</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your current résumé and the job description. Our AI will analyze alignment, 
          identify gaps, and help you create a must-interview résumé for this specific role.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Résumé Input */}
        <Card className={hasResume ? 'border-green-500/50' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Your Résumé</CardTitle>
              </div>
              {hasResume && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>
            <CardDescription>
              Upload a file or paste your résumé content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="paste">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Paste Text</TabsTrigger>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="mt-4">
                <Textarea
                  placeholder="Paste your résumé content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('resume-upload')?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop your résumé (PDF or DOCX)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse
                  </p>
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                </div>
                {resumeFile && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {resumeFile.name}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Job Description Input */}
        <Card className={hasJob ? 'border-green-500/50' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Target Job Description</CardTitle>
              </div>
              {hasJob && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>
            <CardDescription>
              Paste the full job description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-url" className="text-sm">Job URL (optional)</Label>
              <Input
                id="job-url"
                placeholder="https://..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Job Description</Label>
              <Textarea
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[250px] font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What We'll Do Section */}
      <Alert className="border-primary/20 bg-primary/5">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>What happens next</AlertTitle>
        <AlertDescription className="mt-2">
          <ul className="text-sm space-y-1">
            <li>• <strong>Analyze alignment:</strong> Score your résumé against this specific job</li>
            <li>• <strong>Identify gaps:</strong> Find what's missing or needs strengthening</li>
            <li>• <strong>Generate suggestions:</strong> AI will propose improvements for each gap</li>
            <li>• <strong>Build must-interview:</strong> Polish each section until you reach 80+ score</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          className="gap-2 min-w-[250px]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Analyze & Build Must-Interview Résumé
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
