// =====================================================
// STEP 1A: Upload Resume & Job Description
// =====================================================

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, FileText, Briefcase, Upload, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSkeletonV3 } from "./LoadingSkeletonV3";

const MAX_RESUME_CHARS = 15000;
const MAX_JOB_CHARS = 10000;
const MIN_RESUME_CHARS = 100;
const MIN_JOB_CHARS = 50;

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
  const [isParsingFile, setIsParsingFile] = useState(false);

  const resumeOverLimit = localResume.length > MAX_RESUME_CHARS;
  const jobOverLimit = localJob.length > MAX_JOB_CHARS;
  const canAnalyze = 
    localResume.trim().length >= MIN_RESUME_CHARS && 
    localJob.trim().length >= MIN_JOB_CHARS &&
    !resumeOverLimit &&
    !jobOverLimit;

  // File drop handler for resume
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file type
    const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      toast.error("Please upload a .txt, .pdf, or .docx file");
      return;
    }

    setIsParsingFile(true);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Handle plain text files directly
        const text = await file.text();
        setLocalResume(text);
        toast.success("Resume text loaded!");
      } else {
        // For PDF/DOCX, we'd need server-side parsing
        // For now, show a helpful message
        toast.info("For best results, please copy and paste your resume text directly. PDF/DOCX parsing coming soon!");
      }
    } catch (error) {
      console.error("File parsing error:", error);
      toast.error("Failed to read file. Please paste your resume text instead.");
    } finally {
      setIsParsingFile(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: isLoading || isParsingFile,
  });

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

  const getCharacterStatus = (current: number, min: number, max: number) => {
    if (current > max) return "text-destructive";
    if (current < min) return "text-muted-foreground";
    if (current > max * 0.9) return "text-amber-600";
    return "text-green-600";
  };

  // Show loading skeleton when analyzing
  if (isLoading) {
    return <LoadingSkeletonV3 type="analysis" />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-2">Let's Optimize Your Resume</h2>
        <p className="text-muted-foreground">
          Paste your resume and the job description. We'll analyze the fit and help you improve it.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resume input with dropzone */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Your Resume
          </Label>
          
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/30 hover:border-primary/50"
            } ${isParsingFile ? "opacity-50 cursor-wait" : ""}`}
          >
            <input {...getInputProps()} />
            {isParsingFile ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Reading file...
              </div>
            ) : isDragActive ? (
              <p className="text-sm text-primary">Drop your resume here...</p>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span>Drop a .txt file or click to upload</span>
              </div>
            )}
          </div>

          <Textarea
            placeholder="Or paste your resume text here..."
            value={localResume}
            onChange={(e) => setLocalResume(e.target.value)}
            className={`min-h-[260px] font-mono text-sm ${resumeOverLimit ? "border-destructive" : ""}`}
            aria-describedby="resume-char-count"
          />
          <div id="resume-char-count" className="flex items-center justify-between text-xs">
            <span className={getCharacterStatus(localResume.length, MIN_RESUME_CHARS, MAX_RESUME_CHARS)}>
              {localResume.length.toLocaleString()} / {MAX_RESUME_CHARS.toLocaleString()} characters
              {localResume.length < MIN_RESUME_CHARS && ` (need at least ${MIN_RESUME_CHARS})`}
            </span>
            {resumeOverLimit && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Too long
              </span>
            )}
          </div>
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
            className={`min-h-[300px] font-mono text-sm ${jobOverLimit ? "border-destructive" : ""}`}
            aria-describedby="job-char-count"
          />
          <div id="job-char-count" className="flex items-center justify-between text-xs">
            <span className={getCharacterStatus(localJob.length, MIN_JOB_CHARS, MAX_JOB_CHARS)}>
              {localJob.length.toLocaleString()} / {MAX_JOB_CHARS.toLocaleString()} characters
              {localJob.length < MIN_JOB_CHARS && ` (need at least ${MIN_JOB_CHARS})`}
            </span>
            {jobOverLimit && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Too long
              </span>
            )}
          </div>
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
