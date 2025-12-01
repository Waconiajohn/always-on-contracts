/**
 * Must-Interview Builder V2 Page
 * 
 * This is the wrapper page for the new V4 resume builder.
 * It handles:
 * - Initial input collection (resume + job description)
 * - Calling Edge Functions for AI analysis
 * - Rendering the V4 builder component
 * - Export functionality
 */

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MustInterviewBuilderV2 } from "@/components/resume-builder/v4/MustInterviewBuilderV2";
import { transformScoreToBlueprint, transformGapsToV4, transformBulletsToV4 } from "@/lib/v4Adapters";
import type { JobBlueprint, GapAnalysis, RoleData, BulletSuggestion } from "@/components/resume-builder/v4/types/builderV2Types";

export default function MustInterviewBuilderV2Page() {
  const { toast } = useToast();
  const location = useLocation();
  
  // Input state
  const [resumeText, setResumeText] = useState(
    (location.state as any)?.resumeText || ""
  );
  const [jobDescription, setJobDescription] = useState(
    (location.state as any)?.jobDescription || ""
  );
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  
  // Builder data
  const [blueprint, setBlueprint] = useState<JobBlueprint | null>(null);
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [highlightSuggestions, setHighlightSuggestions] = useState<BulletSuggestion[]>([]);
  const [initialScore, setInitialScore] = useState(0);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setResumeText(text);
    };
    reader.readAsText(file);
  };

  // Analyze job and generate builder data
  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please provide both resume and job description",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Call the existing score-resume-match function
      const { data: scoreData, error: scoreError } = await supabase.functions.invoke(
        "score-resume-match",
        {
          body: {
            jobDescription: jobDescription,
            resumeContent: resumeText,
          },
        }
      );

      if (scoreError) throw scoreError;

      // Transform score data to V4 format
      const transformedBlueprint = transformScoreToBlueprint(scoreData);
      setBlueprint(transformedBlueprint);
      setInitialScore(scoreData.overallScore || 0);

      // Extract gaps using v4Adapters
      const extractedGaps = transformGapsToV4(scoreData);
      setGaps(extractedGaps);

      // Extract job title and company if not provided
      if (!jobTitle) {
        const detectedTitle = scoreData.detected?.role || "Target Role";
        setJobTitle(detectedTitle);
      }

      // Generate highlight suggestions by calling generate-dual-resume-section
      try {
        const { data: bulletData, error: bulletError } = await supabase.functions.invoke(
          "generate-dual-resume-section",
          {
            body: {
              section: "summary",
              jobDescription,
              resumeContent: resumeText,
              targetRole: transformedBlueprint.inferredRoleFamily,
              targetIndustry: transformedBlueprint.inferredIndustry,
            },
          }
        );

        if (bulletError) {
          console.warn("Failed to generate bullets:", bulletError);
          setHighlightSuggestions([]);
        } else {
          const transformedBullets = transformBulletsToV4(bulletData, "summary");
          setHighlightSuggestions(transformedBullets);
        }
      } catch (bulletError) {
        console.warn("Bullet generation error:", bulletError);
        setHighlightSuggestions([]);
      }

      // Generate role data from resume
      // For now, create a single role representing their current/most recent position
      const sampleRole: RoleData = {
        id: "role-1",
        title: jobTitle || "Your Title",
        company: companyName || "Your Company",
        startDate: "Present",
        endDate: "",
        isCurrent: true,
        suggestions: [],
        relevantCompetencies: [],
        relevanceToJob: ["Matches target role requirements"],
        bullets: [],
        recommendedBulletCount: { min: 3, max: 5 },
        progress: { accepted: 0, pending: 0, rejected: 0, edited: 0 },
      };
      setRoles([sampleRole]);

      // Show the builder
      setShowBuilder(true);
    } catch (error: any) {
      console.error("Analysis error:", error);
      setAnalysisError(error.message || "Failed to analyze resume");
      toast({
        title: "Analysis Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Callback for builder to rescore
  const handleRescore = async (resumeText: string): Promise<number> => {
    const { data, error } = await supabase.functions.invoke("score-resume-match", {
      body: {
        jobDescription: jobDescription,
        resumeContent: resumeText,
      },
    });

    if (error || !data) return initialScore;
    return data.overallScore || initialScore;
  };

  // Callback for DOCX export
  const handleExportDOCX = async (resumeHtml: string) => {
    toast({
      title: "Export Ready",
      description: "Resume copied to clipboard (DOCX export coming soon)",
    });
    await navigator.clipboard.writeText(resumeHtml);
  };

  // If builder is ready, render it
  if (showBuilder && blueprint) {
    return (
      <MustInterviewBuilderV2
        jobDescription={jobDescription}
        jobTitle={jobTitle}
        companyName={companyName}
        initialJobBlueprint={blueprint}
        initialGaps={gaps}
        initialRoles={roles}
        initialHighlightSuggestions={highlightSuggestions}
        initialScore={initialScore}
        onRescore={handleRescore}
        onExportDOCX={handleExportDOCX}
      />
    );
  }

  // Otherwise, show input form
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Must-Interview Résumé Builder</h1>
          <p className="text-muted-foreground">
            Transform your resume into a must-interview document with AI-powered guidance
          </p>
        </div>

        {analysisError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{analysisError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Upload Your Resume</CardTitle>
            <CardDescription>
              Paste your resume text or upload a file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="resume-upload">Upload Resume (optional)</Label>
              <Input
                id="resume-upload"
                type="file"
                accept=".txt,.doc,.docx"
                onChange={handleFileUpload}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="resume-text">Or paste your resume text</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste your resume content here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={10}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Target Job</CardTitle>
            <CardDescription>
              Provide details about the job you're applying for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  id="job-title"
                  placeholder="e.g., Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="company-name">Company Name (optional)</Label>
                <Input
                  id="company-name"
                  placeholder="e.g., Google"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !resumeText || !jobDescription}
          className="w-full"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Start Building
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
