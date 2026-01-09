// =====================================================
// STEP 1A: Upload Resume & Job Description
// =====================================================

import { useState } from "react";
import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, FileText, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function UploadStep() {
  const {
    resumeText,
    jobDescription,
    setResumeText,
    setJobDescription,
    setFitAnalysis,
    setLoading,
    isLoading,
  } = useResumeBuilderV3Store();

  const [localResume, setLocalResume] = useState(resumeText);
  const [localJob, setLocalJob] = useState(jobDescription);

  const canAnalyze = localResume.trim().length > 100 && localJob.trim().length > 50;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setLoading(true);
    setResumeText(localResume);
    setJobDescription(localJob);

    try {
      const { data, error } = await supabase.functions.invoke("resume-builder-v3", {
        body: {
          step: "fit_analysis",
          resumeText: localResume,
          jobDescription: localJob,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Analysis failed");

      setFitAnalysis(data.data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Fit analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-2">Let's Optimize Your Resume</h2>
        <p className="text-muted-foreground">
          Paste your resume and the job description. We'll analyze the fit and help you improve it.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resume input */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Your Resume
          </Label>
          <Textarea
            placeholder="Paste your resume text here..."
            value={localResume}
            onChange={(e) => setLocalResume(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {localResume.length} characters
            {localResume.length < 100 && " (need at least 100)"}
          </p>
        </div>

        {/* Job description input */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Description
          </Label>
          <Textarea
            placeholder="Paste the job description here..."
            value={localJob}
            onChange={(e) => setLocalJob(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {localJob.length} characters
            {localJob.length < 50 && " (need at least 50)"}
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={!canAnalyze || isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Fit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
